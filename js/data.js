/**
 * data.js — Speakers, intro narration, and the workshop script.
 *
 * Every line the advisor speaks is a backtick string. server/prewarm.py
 * renders each one ahead of time, so keep spoken lines static (no ${...})
 * and use plain quotes for on-screen-only text.
 */

const SPEAKERS = {
  narrator: { name: 'Narrator', role: 'Strategic Overview',      initials: 'N',  gender: 'm', rate: 1.0,  pitch: 1.0, voice: 'en-US-AndrewMultilingualNeural' },
  agent:    { name: 'Iris',     role: 'AI Operations Advisor',   initials: 'AI', gender: 'f', rate: 1.0,  pitch: 1.0, voice: 'en-US-MichelleNeural' }
};

const ZONES = [
  {
    id: 'stakes',
    speakerId: 'narrator',
    narration: `Nova Brands. Four and a half billion dollars in revenue, fifteen thousand people, plants on three continents. Revenue is eight percent below plan. The books take eleven days to close. Twelve thousand compliance alerts are waiting. The biggest customer is threatening to leave. Every one of these problems lives inside a process. And every process runs on data that nobody is connecting.`
  },
  {
    id: 'shift',
    speakerId: 'agent',
    narration: `Most companies try to fix this by putting AI on top. It rarely works, because an AI that doesn't understand the process just automates the mess faster. The companies getting results do it the other way round. Understand the process first. Then let AI agents take the repetitive work, and keep people on the decisions that need judgement.`
  },
  {
    id: 'how',
    speakerId: 'agent',
    narration: `This session works differently from a presentation. Tell me a problem in your own words, and the result you need. I'll diagnose it, give you three ways forward, and tell you which one I'd pick. Then you decide. I'll tell you where your choice leads, including where I disagree.`
  },
  {
    id: 'workshop',
    speakerId: 'agent',
    narration: `Good morning. I'm Iris, your operations advisor. Tell me the problem that's costing this business the most, and the result you need. I'll show you the options and tell you what I'd do. Then I want to hear what you would do.`
  }
];

/* Shared advisor lines used across every scenario. */
const LINES = {
  unmatched: `I can't map that to an area I've prepared yet. For this session I've worked through seven. Pick the one closest to what you have in mind.`,
  notQuite:  `My mistake. Which of these is closest?`,
  ownIdea:   `That's a reasonable instinct. The question I'd ask of any approach is this: does it change the process, or only speed up the one you have? If it's the second, you'll hit a ceiling. Tell me which of the three paths your idea is closest to, and I'll show you where it lands.`,
  pickOne:   `Pick whichever answer is closest, and I'll take it from there.`,
  next:      `Want to bring me another problem, or shall we wrap up?`,
  wrap:      `Here's what we decided today. Notice the pattern. In every case the agents took the repetitive work, and your people kept the decisions. That isn't a technology project. It's a new operating model. The technology is ready. The only question is where you start.`
};

/* Matched against the CEO's own words when they propose their own approach.
   Paths are always: a = go all-in on agents, b = process first then agents
   with people on the decisions, c = people-led, minimal change. */
const PATH_HINTS = {
  a: ['all at once', 'everything', 'end to end', 'end-to-end', 'fully', 'full automation', 'automate all', 'automate everything', 'big bang', 'fast', 'quick', 'aggressive', 'replace', 'agents do it', 'autonomous', 'no humans'],
  b: ['process first', 'fix the process', 'standardi', 'clean', 'phase', 'pilot', 'step by step', 'then agents', 'human in the loop', 'humans decide', 'people decide', 'review', 'approve', 'hybrid', 'combination', 'both', 'first then'],
  c: ['hire', 'more people', 'headcount', 'team', 'assist', 'outsource', 'contract', 'bonus', 'train', 'manual', 'cheap', 'safe', 'small', 'switch supplier', 'new supplier', 'wait']
};

const SCENARIOS = [
  {
    id: 'close',
    title: 'Month-end close is too slow',
    fn: 'Finance · Record to report',
    target: '5-day close',
    example: 'Our month-end close takes 11 days. I need it in 5.',
    keywords: ['close', 'closing', 'month end', 'month-end', 'quarter end', 'books', 'reconcil', 'journal', 'ledger', 'general ledger', 'record to report', 'r2r', 'financial reporting', 'accounting', 'accountant', 'controller', 'audit'],
    confirm: `So the books take eleven working days to close, and you want that down to five without weakening controls. Is that the problem?`,
    diagnosis: `I looked at where the eleven days go. Almost none of it is accounting judgement. Six days are reconciliations and chasing numbers across three separate systems. Two days are manual journal entries that follow the same pattern every month. The last three are review loops, because nobody trusts the numbers until someone has checked them twice. This is a process problem first, and a technology problem second.`,
    evidence: [
      { v: '11 days', l: 'Current close cycle' },
      { v: '3', l: 'ERP instances to reconcile' },
      { v: '62%', l: 'Reconciliations done by hand' },
      { v: '1,400', l: 'Recurring journals a month' }
    ],
    paths: [
      { id: 'a', name: 'Automate everything now', summary: 'Put reconciliation, journal and reporting agents on every entity at once.', time: '4 months', cost: 'High', risk: 'High', projected: '6 days' },
      { id: 'b', name: 'Fix the process, then agents', summary: 'Standardise the close calendar and chart of accounts, then give agents the matching and journals. Accountants review exceptions only.', time: '6 months', cost: 'Medium', risk: 'Low', projected: '5 days' },
      { id: 'c', name: 'People-led, agent-assisted', summary: 'Keep today’s process and give accountants an assistant that prepares reconciliations.', time: '2 months', cost: 'Low', risk: 'Low', projected: '9 days' }
    ],
    recommend: 'b',
    recommendWhy: `My recommendation is path B. If you put agents on top of three different close processes, you automate three different sets of problems. Standardise first, then the agents take over the matching and the journals, and your accountants only look at exceptions. That's how you reach five days and keep the auditors comfortable. But you know your finance team better than I do. Which would you back, or how would you approach it?`,
    reactions: {
      a: `Speed is tempting, and you'd see results in the first quarter. My concern is this: the agents learn the process you have, not the one you want. With three systems you'd likely stall around six days and spend next year untangling it. If you go this way, I'd insist on one pilot entity first.`,
      b: `Agreed. It's slower to start, but it's the path that holds. The first two months will look quiet, because the work is in the process design, not the technology. That's normal. Show the board the close calendar, not just the dashboard.`,
      c: `That's the safe choice, and your team will adopt it quickly. The ceiling is the issue. An assistant makes accountants faster, but they're still doing the matching. You'd land around nine days. It's a good first step if you're not ready to change the operating model yet.`
    },
    followup: {
      q: `One decision matters more than the technology. When an agent finds a reconciliation it can't match, who owns that exception?`,
      options: [
        { label: 'The entity controller', score: 1, reply: `Good. Keeping ownership with the controller means accountability doesn't move just because the work did. The agent does the matching, the controller signs off.` },
        { label: 'A central close team', score: 0, reply: `That works at scale, but watch the handoffs. A central team resolving exceptions for entities they don't know can add days back. Give them a direct line to the entity controllers.` },
        { label: 'Let the agent decide', score: -1, reply: `I'd push back on that one. Agents should propose, not approve, on anything that touches the ledger. Auditors will ask who signed off, and the model is not an answer they accept.` }
      ]
    }
  },

  {
    id: 'ap',
    title: 'Invoice backlog and duplicate payments',
    fn: 'Finance · Accounts payable',
    target: '80% touchless invoices',
    example: 'Invoices are piling up, we pay late fees and some suppliers get paid twice.',
    keywords: ['invoice', 'payable', 'accounts payable', 'ap ', 'vendor payment', 'supplier payment', 'pay supplier', 'pay vendor', 'late fee', 'late payment', 'penalt', 'duplicate', 'paid twice', 'backlog', 'procure to pay', 'p2p', 'purchase order', 'touchless'],
    confirm: `So invoices are piling up, you're paying late fees, and some suppliers are being paid twice. You want most invoices flowing through untouched, and no more duplicates. Have I got that right?`,
    diagnosis: `Your team handles about ninety thousand invoices a month, and only thirty-eight percent go through without a person touching them. The rest stall on three things: invoices arriving in more than forty formats, purchase orders that don't match the goods receipt, and approvals sitting in someone's inbox. The duplicates come from suppliers invoicing twice through two channels. Last year that leakage cost you four point two million dollars.`,
    evidence: [
      { v: '90k', l: 'Invoices a month' },
      { v: '38%', l: 'Touchless today' },
      { v: '40+', l: 'Invoice formats' },
      { v: '$4.2M', l: 'Duplicates and penalties' }
    ],
    paths: [
      { id: 'a', name: 'Agents end to end', summary: 'Agents capture, match, route and approve invoices, and flag anomalies before payment. People approve high-value and flagged items.', time: '5 months', cost: 'Medium', risk: 'Medium', projected: '82% touchless' },
      { id: 'b', name: 'Clean supplier data first', summary: 'Fix the vendor master and matching rules, then deploy agents in a second phase.', time: '9 months', cost: 'Medium', risk: 'Low', projected: '78% touchless' },
      { id: 'c', name: 'Add people to clear the backlog', summary: 'Bring in a temporary team and keep the current process.', time: '1 month', cost: 'Low', risk: 'Low', projected: '42% touchless' }
    ],
    recommend: 'a',
    recommendWhy: `Here I'd go further than usual and recommend path A. Accounts payable is one of the most repeatable processes in the company, and agents are mature here. Capture, matching, routing and anomaly checks can run end to end, with your team approving only high-value or flagged invoices. The supplier data cleanup can run alongside, it doesn't need to come first. What's your call?`,
    reactions: {
      a: `Good. Plan a four-week parallel run, where the agents and your team process the same invoices, so your controllers see the accuracy with their own eyes before you switch over. Trust is built there, not in a steering committee.`,
      b: `That's a careful choice, and not a wrong one. Clean supplier data helps everything. The cost is time. Every month you wait is roughly three hundred and fifty thousand dollars in leakage. I'd run the cleanup and the agent rollout in parallel.`,
      c: `That clears this month's pile, but next month it comes back. You'd be paying people to do work the process keeps creating. I'd only use extra hands as a bridge while the agents go live.`
    },
    followup: {
      q: `The anomaly agent will stop payments it thinks are duplicates or fraud. Some will be false alarms. Where do you set the line?`,
      options: [
        { label: 'Stop only high-value flags', score: 1, reply: `That's the balance I'd pick. Big exposure gets a human look, small anomalies are logged and reviewed in a batch, and your suppliers still get paid on time.` },
        { label: 'Stop anything suspicious', score: 0, reply: `Safe, but expect noise in the first month and some unhappy suppliers. Tune it weekly with your payables lead, and the false alarms drop fast.` },
        { label: 'Log it, never stop a payment', score: -1, reply: `Then you'll learn about duplicates after the money has gone, and recovering it takes months. I'd at least stop the high-value ones.` }
      ]
    }
  },

  {
    id: 'deductions',
    title: 'Retailers deduct millions from our invoices',
    fn: 'Commercial · Order to cash',
    target: 'Recover $15M a year',
    example: 'Retailers deduct $38M a year from what they owe us and we never dispute it.',
    keywords: ['deduction', 'retailer', 'short pay', 'short-pay', 'shortpay', 'chargeback', 'claim', 'dispute', 'trade promotion', 'promotion', 'cash application', 'receivable', 'collections', 'order to cash', 'o2c', 'dso', 'customers pay', 'write off', 'write-off', 'revenue leakage'],
    confirm: `So retailers are deducting thirty-eight million dollars a year from what they owe you, and most of it is never challenged. You want a big part of that back. Is that the one?`,
    diagnosis: `About forty percent of those deductions are invalid: promotions already paid, shortages that never happened, penalties outside the contract. But each one needs proof, from the contract, the proof of delivery and the promotion agreement, and those sit in four different systems. Your team can research about twenty percent of them before the dispute window closes. The rest are written off by default.`,
    evidence: [
      { v: '$38M', l: 'Deducted a year' },
      { v: '~40%', l: 'Likely invalid' },
      { v: '20%', l: 'Researched in time' },
      { v: '4', l: 'Systems holding the proof' }
    ],
    paths: [
      { id: 'a', name: 'Agents dispute automatically', summary: 'Agents gather the proof, draft the dispute, and submit every valid one without review.', time: '4 months', cost: 'Medium', risk: 'Medium', projected: '$14M recovered' },
      { id: 'b', name: 'Agents research, analysts decide', summary: 'Agents gather evidence and score every deduction. Analysts choose what to dispute and own the retailer conversation.', time: '4 months', cost: 'Medium', risk: 'Low', projected: '$16M recovered' },
      { id: 'c', name: 'Focus on the top 10 retailers', summary: 'Move more analysts onto the largest accounts only.', time: '1 month', cost: 'Low', risk: 'Low', projected: '$6M recovered' }
    ],
    recommend: 'b',
    recommendWhy: `I'd recommend path B. Agents are excellent at the research: it's slow, repetitive, and spread across four systems. But disputing with your biggest retailers is a relationship. An analyst who knows the buyer will win more and damage less. So the agents find and prove, and your people decide and negotiate. Do you see it the same way?`,
    reactions: {
      a: `You'd recover a lot, fast. The risk is tone. Automated disputes land on the retailer's desk as volume, and a buyer who feels spammed will slow-pay you somewhere else. I'd keep your top twenty accounts human-led.`,
      b: `Good. Give the analysts a simple rule: the agent brings the evidence and a win probability, and the analyst decides in under two minutes. That's how the team goes from twenty percent coverage to nearly all of it.`,
      c: `Quick and safe, and the top retailers are where most of the money is. But the long tail adds up, and it's exactly the work agents do best. I'd start here and add the agents in month two.`
    },
    followup: {
      q: `The agents will also see why deductions happen, for example one warehouse that keeps shipping short. What do you want done with that?`,
      options: [
        { label: 'Send it to operations weekly', score: 1, reply: `Right. Recovering money is good, preventing the deduction is better. A weekly root-cause report to operations is where this pays off twice.` },
        { label: 'Put it on a dashboard', score: 0, reply: `A dashboard is fine, but someone has to own acting on it. Name an owner in operations, or it becomes another screen nobody opens.` },
        { label: 'Keep it within finance', score: -1, reply: `Then finance keeps recovering the same losses every month. The pattern is only useful if the people who cause it can see it.` }
      ]
    }
  },

  {
    id: 'supply',
    title: 'Late deliveries, top customer at risk',
    fn: 'Operations · Supply chain',
    target: '95% on-time in 90 days',
    example: 'On-time delivery is 78% and our biggest customer is threatening to leave.',
    keywords: ['supply', 'supplier', 'otif', 'on time', 'on-time', 'in full', 'deliver', 'late order', 'shipping', 'shipment', 'logistic', 'inventory', 'stock', 'warehouse', 'plant', 'factory', 'production', 'demand', 'forecast', 'planning', 'planner', 'fill rate', 'lose the customer', 'customer is threatening', 'biggest customer', 'largest customer'],
    confirm: `So on-time-in-full delivery is at seventy-eight percent, your biggest customer is threatening to walk, and you need ninety-five percent within ninety days. Is that the priority?`,
    diagnosis: `Everyone blames the supplier in Penang, and their on-time rate is poor. But when I trace the late orders, that supplier explains only thirty percent of them. The other seventy percent come from inside: production scheduled against a forecast that's three weeks stale, and planners overriding the planning system because they don't trust it. The one plant that still plans weekly with its own planners runs at ninety-four percent.`,
    evidence: [
      { v: '78%', l: 'On-time in full' },
      { v: '30%', l: 'Late orders caused by supplier' },
      { v: '3 wks', l: 'Forecast lag' },
      { v: '94%', l: 'Best plant, same network' }
    ],
    paths: [
      { id: 'a', name: 'Network-wide control tower', summary: 'Agents watch orders, supply and capacity across every plant, predict late orders two weeks out and re-plan automatically.', time: '5 months', cost: 'High', risk: 'Medium', projected: '93% on-time' },
      { id: 'b', name: 'Save the customer, then scale', summary: 'In 30 days, put agents on the key customer’s orders only, with a planner approving every re-plan. Prove it, then extend.', time: '3 months', cost: 'Medium', risk: 'Low', projected: '95% on key account' },
      { id: 'c', name: 'Switch the supplier', summary: 'Dual-source from a second supplier and add safety stock.', time: '4 months', cost: 'High', risk: 'Medium', projected: '84% on-time' }
    ],
    recommend: 'b',
    recommendWhy: `I recommend path B. You have ninety days and one customer who matters more than the rest. Put the agents on that customer's orders first, with a planner approving every change, and you can show them improvement within a month. Once it works, extend it. Switching suppliers fixes only thirty percent of the problem. What would you do?`,
    reactions: {
      a: `It's the right end state, and I'd build toward it. But five months is longer than your customer will wait. I'd carve out their orders as the first wave, so you show progress inside the ninety days.`,
      b: `Good. Call the customer this week and tell them exactly what's changing and when they'll see it. Showing them weekly on-time numbers for their own orders buys you more time than any promise.`,
      c: `It feels decisive, and the board will like it. But the data says the supplier causes less than a third of the late orders. You'd spend the money and still sit around eighty-four percent. I'd fix the planning first.`
    },
    followup: {
      q: `Your planners don't trust the current system. How do you get them to trust the agents?`,
      options: [
        { label: 'Planners approve every re-plan', score: 1, reply: `Yes. Trust comes from control. After a few weeks of approving good recommendations, they'll start asking the agent to handle more on its own.` },
        { label: 'Train them first', score: 0, reply: `Training helps, but it isn't enough. People trust what they've seen work on their own orders. Let them run it alongside their spreadsheets for two weeks.` },
        { label: 'Mandate it from the top', score: -1, reply: `That's what happened with the last system, and it's why they built shadow spreadsheets. Mandates get compliance, not trust.` }
      ]
    }
  },

  {
    id: 'compliance',
    title: 'Compliance alerts piling up',
    fn: 'Risk · Compliance monitoring',
    target: 'Backlog cleared, noise halved',
    example: 'We have 12,000 compliance alerts waiting and almost all are false positives.',
    keywords: ['compliance', 'risk', 'alert', 'fraud', 'sanction', 'screening', 'aml', 'kyc', 'money laundering', 'regulator', 'regulatory', 'false positive', 'investigat', 'monitoring', 'third party', 'third-party', 'due diligence', 'fine'],
    confirm: `So you have twelve thousand compliance alerts waiting, almost all of them false alarms, and the regulator visits in the spring. You want the backlog cleared and the noise cut in half. Right?`,
    diagnosis: `Your screening rules were tuned five years ago and never revisited, so they flag anything close to a match. Ninety-five percent of alerts close as false positives, but each one still takes an investigator forty minutes, most of it spent collecting information from six systems. The real risk isn't the backlog itself. It's that a genuine case is sitting somewhere in the pile.`,
    evidence: [
      { v: '12k', l: 'Alerts in backlog' },
      { v: '95%', l: 'False positives' },
      { v: '40 min', l: 'Per alert today' },
      { v: '6', l: 'Systems per case' }
    ],
    paths: [
      { id: 'a', name: 'Agents close low-risk alerts', summary: 'Agents investigate every alert and auto-close clear false positives, with a full audit trail.', time: '3 months', cost: 'Medium', risk: 'High', projected: 'Cleared in 45 days' },
      { id: 'b', name: 'Agents investigate, humans decide', summary: 'Agents gather evidence and write the case summary. Investigators make every decision in minutes. Rules are retuned in parallel.', time: '3 months', cost: 'Medium', risk: 'Low', projected: 'Cleared in 60 days' },
      { id: 'c', name: 'Hire contract investigators', summary: 'Add fifty contract investigators to work the backlog.', time: '1 month', cost: 'High', risk: 'Medium', projected: 'Cleared in 120 days' }
    ],
    recommend: 'b',
    recommendWhy: `In compliance, I recommend path B. Let the agents do the investigation work, pulling data from six systems and writing the case summary, but keep every decision with a person. Regulators care deeply about who decided. With a summary in hand, an investigator can close a false positive in five minutes instead of forty. Where do you land?`,
    reactions: {
      a: `It's the fastest, and technically it works. But auto-closing alerts is the one thing I'd be careful with in front of a regulator. If you go this way, agree it with your compliance head first, and sample-check the closed alerts every week.`,
      b: `Good. And retune the rules in parallel, because the best alert is the one that never fires. Between better rules and agent summaries, your investigators spend their time on the cases that matter.`,
      c: `It works, but it's slow and expensive, and contract investigators leave with the knowledge. You'd clear it in four months and be back here next year. I'd use a small contract team as a bridge only.`
    },
    followup: {
      q: `When the regulator asks how an agent reached a conclusion, what do you show them?`,
      options: [
        { label: 'A full audit trail per case', score: 1, reply: `Exactly. Every data point the agent pulled, every step, and the person who decided. That turns the agents from a risk into evidence of control.` },
        { label: 'The model documentation', score: 0, reply: `Useful, but regulators want to see individual cases, not the design document. Keep the trail for every decision.` },
        { label: 'We explain it if asked', score: -1, reply: `That's a risky position. If you can't reconstruct a decision, the regulator will treat it as uncontrolled. Build the trail from day one.` }
      ]
    }
  },

  {
    id: 'care',
    title: 'Complaints up, satisfaction down',
    fn: 'Customer · Care and experience',
    target: 'Satisfaction +15 points',
    example: 'Complaints are up 30% and customer satisfaction keeps falling.',
    keywords: ['customer service', 'customer care', 'complain', 'csat', 'nps', 'satisfaction', 'call center', 'call centre', 'contact center', 'contact centre', 'support', 'ticket', 'handle time', 'wait time', 'customer experience', 'cx', 'service desk', 'unhappy', 'angry customer'],
    confirm: `So complaints are up thirty percent, customer satisfaction is sliding, and you want it up fifteen points without doubling the team. Is that it?`,
    diagnosis: `Sixty percent of complaints are about the same three things: where is my order, a missing credit, and a damaged delivery. Each one needs the rep to check three systems before answering, so calls run eleven minutes and customers repeat themselves. The contact centre isn't the problem. It's absorbing failures from order management and billing.`,
    evidence: [
      { v: '+30%', l: 'Complaint volume' },
      { v: '60%', l: 'From just 3 issues' },
      { v: '11 min', l: 'Average handle time' },
      { v: '61', l: 'Satisfaction score' }
    ],
    paths: [
      { id: 'a', name: 'AI agents answer customers', summary: 'Customer-facing agents resolve order status, credits and claims end to end, on chat and phone.', time: '4 months', cost: 'Medium', risk: 'Medium', projected: '+12 points' },
      { id: 'b', name: 'Resolve and prevent', summary: 'Agents fully resolve the top three issues, hand the rest to people with full context, and send complaint patterns upstream to fix causes.', time: '5 months', cost: 'Medium', risk: 'Low', projected: '+17 points' },
      { id: 'c', name: 'Give reps an assistant', summary: 'Reps get an agent that pulls answers from every system during the call.', time: '2 months', cost: 'Low', risk: 'Low', projected: '+7 points' }
    ],
    recommend: 'b',
    recommendWhy: `I'd go with path B. Let agents fully handle the three issues that make up most of the volume, since they're simple and repetitive, and hand everything else to a person with the full history, so nobody repeats themselves. Then feed the patterns back to billing and logistics, because the cheapest complaint is the one that never happens. What would you pick?`,
    reactions: {
      a: `You'd see handle times drop fast. The risk is the complex customer who gets stuck with an agent that can't help. Make sure there's always a one-step route to a person, and measure how often people take it.`,
      b: `Good. The prevention half is what moves the fifteen points. Resolving faster helps, but fewer problems in the first place is what customers actually notice.`,
      c: `Your reps will love it, and it's a low-risk start. But the calls still happen, and the causes still exist. It's a good phase one, not the answer.`
    },
    followup: {
      q: `Once the agents are live, which number do you hold the team to?`,
      options: [
        { label: 'First-contact resolution', score: 1, reply: `That's the one. It captures whether the customer got what they needed, whoever answered. Handle time follows on its own.` },
        { label: 'Cost per contact', score: 0, reply: `It matters to finance, but on its own it rewards deflection. Pair it with first-contact resolution.` },
        { label: 'Average handle time', score: -1, reply: `Careful. Push handle time and people rush customers off the line. It improves the metric and hurts satisfaction.` }
      ]
    }
  },

  {
    id: 'knowledge',
    title: 'Experienced people are leaving',
    fn: 'People · Talent and knowledge',
    target: 'Ramp-up time halved',
    example: 'Our best planners are leaving and new hires take forever to get up to speed.',
    keywords: ['attrition', 'talent', 'leaving', 'resign', 'quit', 'retention', 'retain', 'knowledge', 'hr', 'human resources', 'onboard', 'ramp', 'new hire', 'hiring', 'training', 'retire', 'skills', 'burnout', 'employee', 'staff', 'workforce'],
    confirm: `So experienced people are leaving, the know-how is going with them, and new hires take too long to get up to speed. You want continuity, and ramp-up time cut in half. Correct?`,
    diagnosis: `Nine of your thirty-one plant and operations leaders left in the last twelve months. The exit interviews say the same thing: decisions were moved away from them, and they spend every shift firefighting. When they leave, the knowledge goes too, because most of it was never written down. A new planner takes nine months to reach full speed.`,
    evidence: [
      { v: '9 of 31', l: 'Leaders left in 12 months' },
      { v: '9 mo', l: 'New planner ramp-up' },
      { v: '70%', l: 'Know-how undocumented' },
      { v: '2', l: 'Critical leaders at risk now' }
    ],
    paths: [
      { id: 'a', name: 'Knowledge assistant for all', summary: 'Capture procedures, past decisions and expert answers into an agent any employee can ask.', time: '3 months', cost: 'Low', risk: 'Low', projected: 'Ramp-up 5 months' },
      { id: 'b', name: 'Remove the firefighting, capture the know-how', summary: 'Agents take the routine firefighting that drives people out, and experts’ knowledge is recorded into an assistant for new hires.', time: '5 months', cost: 'Medium', risk: 'Low', projected: 'Ramp-up 4 months' },
      { id: 'c', name: 'Retention bonuses', summary: 'Pay retention bonuses to key leaders for 18 months.', time: '1 month', cost: 'High', risk: 'Medium', projected: 'Ramp-up unchanged' }
    ],
    recommend: 'b',
    recommendWhy: `My recommendation is path B. A knowledge assistant treats the symptom, people leaving with what they know. But they're leaving because of the firefighting. Take the routine work off their plate with agents, and give decisions back to them. Then capture what they know while they're still here. What's your view?`,
    reactions: {
      a: `It's a solid, quick win, and new hires will use it from week one. But it doesn't change why people leave. I'd pair it with an honest look at the workload.`,
      b: `Good. Start by sitting down with the two leaders most likely to leave next. Ask what they'd automate if they could. They know exactly which firefights are pointless.`,
      c: `Money buys you time, not loyalty. The exit interviews never mentioned pay. If the job stays the same, most of them leave when the bonus pays out.`
    },
    followup: {
      q: `Once agents take the routine work, what do you give back to your plant leaders?`,
      options: [
        { label: 'Local decision rights', score: 1, reply: `That's the heart of it. They left because decisions were taken away. The agents give you the visibility to trust them with decisions again.` },
        { label: 'Improvement projects', score: 0, reply: `Good for the business, but let them choose the projects. Ownership is what keeps people.` },
        { label: 'Bigger targets', score: -1, reply: `That's more of the same pressure. Freed-up time filled with bigger targets is how you lose the next nine.` }
      ]
    }
  }
];
