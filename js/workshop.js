/**
 * workshop.js — The one-to-one session between the CEO and the advisor.
 *
 * Fully scripted and offline: the CEO types freely, a keyword matcher routes
 * their words to a prepared scenario (SCENARIOS in data.js), and every
 * advisor reply comes from that script.
 *
 * Round: problem -> confirm -> diagnosis + three paths -> CEO picks or
 * proposes -> advisor reacts -> follow-up question -> outcome.
 */

const Workshop = (() => {
  let log, chips, form, input, sendBtn;
  let started = false;
  let busy = false;
  let state = 'problem';     // problem | confirm | choose | followup | next
  let sc = null;             // active scenario
  let pathId = null;         // CEO's chosen path
  let pathsEl = null;        // the rendered path cards of this round
  const decisions = [];

  /* ── Matching ── */

  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function hits(text, keywords) {
    const t = ' ' + text.toLowerCase() + ' ';
    // Longer phrases are stronger evidence than a single short word.
    return keywords.reduce((n, k) => n + (new RegExp('\\b' + esc(k), 'i').test(t) ? k.length : 0), 0);
  }

  function matchScenario(text) {
    let best = null, bestScore = 0;
    for (const s of SCENARIOS) {
      const n = hits(text, s.keywords);
      if (n > bestScore) { best = s; bestScore = n; }
    }
    return best;
  }

  function matchPath(text) {
    const direct = text.toLowerCase().match(/\b(?:path|option)?\s*([abc])\b(?![\w'])/);
    if (direct && (text.trim().length <= 12 || /path|option/i.test(text))) return direct[1];
    let best = null, bestScore = 0;
    for (const p of sc.paths) {
      const words = p.name.toLowerCase().split(/[^a-z]+/).filter(w => w.length > 4);
      const n = hits(text, PATH_HINTS[p.id]) + hits(text, words);
      if (n > bestScore) { best = p.id; bestScore = n; }
    }
    return best;
  }

  const YES = /^\s*(y|ya|yes|yeah|yep|yup|correct|right|exactly|sure|that'?s (it|right|correct)|spot on|absolutely|indeed)\b/i;
  const WRAP = /\b(wrap|finish|done|end|stop|summary|summari[sz]e|that'?s all|no more)\b/i;

  /* ── Speech: the advisor talks through a queue so lines never cut each other off ── */

  const queue = [];
  let talking = false;
  function talk(text) {
    queue.push(text);
    if (!talking) nextLine();
  }
  function nextLine() {
    const text = queue.shift();
    if (!text) { talking = false; return; }
    talking = true;
    VoiceEngine.speakLine({ id: 'agent', text, speakerId: 'agent' }, { onEnd: nextLine });
  }
  function hush() {
    queue.length = 0;
    talking = false;
    VoiceEngine.stop();
  }

  /* ── Rendering ── */

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function scrollDown() { log.scrollTop = log.scrollHeight; }
  function append(node) { log.appendChild(node); scrollDown(); return node; }
  const wait = ms => new Promise(r => setTimeout(r, ms));

  function ceo(text) {
    const row = el('div', 'msg msg-ceo');
    row.appendChild(el('span', 'msg-who', 'You'));
    row.appendChild(el('p', null, text));
    append(row);
  }

  async function ai(text, { speak = true } = {}) {
    const typing = append(el('div', 'msg msg-ai typing'));
    typing.innerHTML = '<i></i><i></i><i></i>';
    await wait(Math.min(1400, 450 + text.length * 3));
    typing.remove();
    const row = el('div', 'msg msg-ai');
    row.appendChild(el('span', 'msg-who', 'Iris · AI Advisor'));
    row.appendChild(el('p', null, text));
    append(row);
    if (speak) talk(text);
  }

  function setChips(list) {
    chips.innerHTML = '';
    list.forEach(({ label, fn, ghost }) => {
      const b = el('button', 'chip' + (ghost ? ' ghost' : ''), label);
      b.type = 'button';
      b.addEventListener('click', () => { if (!busy) fn(); });
      chips.appendChild(b);
    });
    scrollDown();  // chips shrink the log; keep the latest line in view
  }

  function evidenceCard(s) {
    const box = el('div', 'ws-card');
    box.appendChild(el('div', 'ws-label', 'Diagnosis · ' + s.fn));
    const grid = el('div', 'ws-evidence');
    s.evidence.forEach(e => {
      const cell = el('div', 'ws-ev');
      cell.appendChild(el('span', 'ws-ev-v', e.v));
      cell.appendChild(el('span', 'ws-ev-l', e.l));
      grid.appendChild(cell);
    });
    box.appendChild(grid);
    append(box);
  }

  function pathsCard(s) {
    const box = el('div', 'ws-card');
    box.appendChild(el('div', 'ws-label', 'Three ways forward · target: ' + s.target));
    const list = el('div', 'ws-paths');
    s.paths.forEach(p => {
      const b = el('button', 'ws-path');
      b.type = 'button';
      b.dataset.id = p.id;
      const head = el('div', 'ws-path-head');
      head.appendChild(el('span', 'ws-path-id', p.id.toUpperCase()));
      head.appendChild(el('span', 'ws-path-name', p.name));
      if (p.id === s.recommend) head.appendChild(el('span', 'ws-rec', 'Advisor pick'));
      b.appendChild(head);
      b.appendChild(el('p', 'ws-path-sum', p.summary));
      const meta = el('div', 'ws-meta');
      [['Time', p.time], ['Cost', p.cost], ['Risk', p.risk], ['Projected', p.projected]].forEach(([k, v]) => {
        const m = el('span', 'ws-meta-i');
        m.appendChild(el('em', null, k));
        m.appendChild(document.createTextNode(v));
        meta.appendChild(m);
      });
      b.appendChild(meta);
      b.addEventListener('click', () => {
        if (busy || state !== 'choose') return;
        hush();
        ceo('Path ' + p.id.toUpperCase() + ' — ' + p.name);
        choose(p.id);
      });
      list.appendChild(b);
    });
    box.appendChild(list);
    pathsEl = list;
    append(box);
  }

  function outcomeCard(s, p, opt) {
    const verdict = opt.score > 0 ? 'Strong' : opt.score < 0 ? 'At risk' : 'Workable';
    const box = el('div', 'ws-card ws-outcome ' + verdict.toLowerCase().replace(' ', '-'));
    box.appendChild(el('div', 'ws-label', 'Outcome at 90 days'));
    const row = el('div', 'ws-evidence');
    [['Target', s.target], ['Projected', p.projected], ['Your call', 'Path ' + p.id.toUpperCase()], ['Plan health', verdict]]
      .forEach(([l, v]) => {
        const cell = el('div', 'ws-ev');
        cell.appendChild(el('span', 'ws-ev-v', v));
        cell.appendChild(el('span', 'ws-ev-l', l));
        row.appendChild(cell);
      });
    box.appendChild(row);
    box.appendChild(el('p', 'ws-note', p.id === s.recommend
      ? 'Your call matched the advisor’s recommendation.'
      : 'You chose differently from the advisor — path ' + s.recommend.toUpperCase() + ' was its pick.'));
    append(box);
  }

  function summaryCard() {
    const box = el('div', 'ws-card ws-summary');
    box.appendChild(el('div', 'ws-label', 'Session summary · your operating model'));
    decisions.forEach(d => {
      const r = el('div', 'ws-sum-row');
      r.appendChild(el('span', 'ws-sum-fn', d.fn));
      r.appendChild(el('span', 'ws-sum-path', d.path));
      r.appendChild(el('span', 'ws-sum-proj', d.projected + ' · ' + d.human));
      box.appendChild(r);
    });
    box.appendChild(el('p', 'ws-note', 'Agents take the repetitive work. People keep the decisions. Process first, then technology.'));
    append(box);
  }

  /* ── Flow ── */

  async function step(fn) {
    busy = true;
    input.disabled = sendBtn.disabled = true;
    chips.innerHTML = '';
    try { await fn(); }
    finally {
      busy = false;
      input.disabled = sendBtn.disabled = false;
      if (window.innerWidth > 744) input.focus();
    }
  }

  function askProblem() {
    state = 'problem';
    sc = null;
    const pool = SCENARIOS.filter(s => !decisions.some(d => d.id === s.id));
    const ex = (pool[0] || SCENARIOS[0]).example;
    input.placeholder = 'Describe a problem and the result you need — e.g. “' + ex + '”';
    // Example problems as one-click prompts; clicking sends it as the CEO's message.
    setChips((pool.length ? pool : SCENARIOS).slice(0, 4).map(s => ({
      label: s.example,
      fn: () => send(s.example)
    })));
  }

  function scenarioChips() {
    setChips(SCENARIOS.map(s => ({
      label: (decisions.some(d => d.id === s.id) ? '✓ ' : '') + s.title,
      fn: () => { hush(); ceo(s.title); step(() => diagnose(s)); }
    })));
    state = 'problem';
  }

  async function confirm(s) {
    sc = s;
    state = 'confirm';
    await ai(s.confirm);
    input.placeholder = 'Yes, or correct me';
    setChips([
      { label: 'Yes, that’s it', fn: () => { hush(); ceo('Yes, that’s it.'); step(() => diagnose(sc)); } },
      { label: 'Not quite', ghost: true, fn: () => { hush(); ceo('Not quite.'); step(notQuite); } }
    ]);
  }

  async function notQuite() {
    await ai(LINES.notQuite);
    scenarioChips();
  }

  async function unmatched() {
    await ai(LINES.unmatched);
    scenarioChips();
  }

  async function diagnose(s) {
    sc = s;
    pathId = null;
    await ai(s.diagnosis);
    await wait(300);
    evidenceCard(s);
    await wait(500);
    pathsCard(s);
    await ai(s.recommendWhy);
    state = 'choose';
    input.placeholder = 'Pick a path above, or tell me what you would do';
  }

  async function choose(id) {
    pathId = id;
    state = 'followup';
    pathsEl.querySelectorAll('.ws-path').forEach(b => {
      b.classList.toggle('chosen', b.dataset.id === id);
      b.classList.toggle('dim', b.dataset.id !== id);
    });
    await step(async () => {
      await ai(sc.reactions[id]);
      await ai(sc.followup.q);
    });
    followupChips();
  }

  function followupChips() {
    input.placeholder = 'Choose an answer, or type your own';
    setChips(sc.followup.options.map(o => ({
      label: o.label,
      fn: () => { hush(); ceo(o.label); answer(o); }
    })));
  }

  async function answer(opt) {
    const p = sc.paths.find(x => x.id === pathId);
    await step(async () => {
      await ai(opt.reply);
      await wait(300);
      outcomeCard(sc, p, opt);
      decisions.push({ id: sc.id, fn: sc.fn, path: p.name, projected: p.projected, human: opt.label });
      await ai(LINES.next);
    });
    state = 'next';
    input.placeholder = 'Describe another problem, or say “wrap up”';
    setChips([
      { label: 'Another problem', fn: () => { hush(); ceo('Let’s take another problem.'); askProblem(); } },
      { label: 'Wrap up', ghost: true, fn: () => { hush(); ceo('Let’s wrap up.'); step(wrapUp); } }
    ]);
  }

  async function wrapUp() {
    summaryCard();
    await ai(LINES.wrap);
    askProblem();
  }

  function onSubmit(e) {
    e.preventDefault();
    const text = input.value.trim();
    input.value = '';
    send(text);
  }

  function send(text) {
    if (!text || busy) return;
    hush();
    ceo(text);

    if (state === 'confirm') {
      if (YES.test(text)) return step(() => diagnose(sc));
      const other = matchScenario(text);
      return step(() => (other && other !== sc ? confirm(other) : notQuite()));
    }

    if (state === 'choose') {
      const id = matchPath(text);
      if (id) return choose(id);
      return step(async () => { await ai(LINES.ownIdea); });
    }

    if (state === 'followup') {
      const opt = sc.followup.options.map(o => [o, hits(text, o.label.toLowerCase().split(/\s+/).filter(w => w.length > 3))])
        .sort((a, b) => b[1] - a[1])[0];
      if (opt[1] > 0) return answer(opt[0]);
      return step(async () => { await ai(LINES.pickOne); followupChips(); });
    }

    if (state === 'next' && WRAP.test(text) && !matchScenario(text)) return step(wrapUp);

    const s = matchScenario(text);
    step(() => (s ? confirm(s) : unmatched()));
  }

  /* ── Public ── */

  function init() {
    log     = document.getElementById('chatLog');
    chips   = document.getElementById('chatChips');
    form    = document.getElementById('chatForm');
    input   = document.getElementById('chatInput');
    sendBtn = document.getElementById('chatSend');
    form.addEventListener('submit', onSubmit);
  }

  /** Called when the workshop zone opens. The greeting itself is narrated
   *  by Navigation as the zone's narration, so it is shown here unspoken. */
  function start() {
    if (started) return;
    started = true;
    const greeting = ZONES.find(z => z.id === 'workshop').narration;
    step(() => ai(greeting, { speak: false })).then(askProblem);
  }

  return { init, start, matchScenario };
})();
