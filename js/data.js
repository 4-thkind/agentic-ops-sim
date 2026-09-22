/**
 * data.js — Zone definitions, speaker profiles, and narration scripts.
 * Each zone has a unique speaker with distinct voice settings.
 */

const SPEAKERS = {
  ceo:      { name: 'Elena Rao',          role: 'CEO — Nova Industrial',    initials: 'ER', gender: 'f', rate: 1.02, pitch: 1.0,  voice: 'en-US-JennyNeural' },
  cfo:      { name: 'Daniel Brooks',      role: 'Chief Financial Officer',        initials: 'DB', gender: 'm', rate: 0.97, pitch: 1.0,  voice: 'en-US-GuyNeural' },
  ops:      { name: 'Marcus Lee',         role: 'Head of Operations',             initials: 'ML', gender: 'm', rate: 1.0,  pitch: 1.0,  voice: 'en-US-ChristopherNeural' },
  chro:     { name: 'Priya Menon',        role: 'Chief HR Officer',               initials: 'PM', gender: 'f', rate: 0.96, pitch: 1.0,  voice: 'en-IN-NeerjaNeural' },
  cco:      { name: 'Sofia Martinez',     role: 'Chief Commercial Officer',       initials: 'SM', gender: 'f', rate: 1.04, pitch: 1.0,  voice: 'en-US-AriaNeural' },
  board:    { name: 'Richard Bennett',    role: 'Independent Board Director',     initials: 'RB', gender: 'm', rate: 0.95, pitch: 1.0,  voice: 'en-GB-RyanNeural' },
  agent:    { name: 'AI Operations Agent',role: 'Your future advantage',          initials: 'AI', gender: 'f', rate: 1.0,  pitch: 1.0,  voice: 'en-US-MichelleNeural' },
  narrator: { name: 'Narrator',           role: 'Strategic Overview',             initials: 'N',  gender: 'm', rate: 0.96, pitch: 1.0,  voice: 'en-GB-ThomasNeural' }
};

const ZONES = [
  {
    id: 'crisis',
    speakerId: 'ceo',
    narration: `You're looking at a four and a half billion dollar company — and it's coming apart. Revenue is eight percent below plan. Our largest customer is threatening to leave within thirty days. I've got five executives giving me five different explanations. I don't need more opinions. I need someone who can figure out what's actually happening. Imagine if an AI agent had been watching every signal across this business — connecting the supply chain delays, customer complaints, employee attrition data — all of it, in real time. We wouldn't be having this conversation.`
  },
  {
    id: 'diagnosis',
    speakerId: 'cfo',
    narration: `Three hundred and sixty million in revenue gap. Everyone in the room has a theory. A hundred and forty million is late orders we already won but can't ship. A hundred and twenty is genuine market softness. The rest is price concessions and penalties. It took our COO two weeks of meetings — two weeks — to discover that a cost programme eighteen months ago removed thirty percent of maintenance planners. And nobody connected that to the forty-one percent rise in downtime. An AI operations intelligence agent would have flagged that correlation within days. The pattern was in the data. Nobody was watching.`
  },
  {
    id: 'supply',
    speakerId: 'ops',
    narration: `Everyone blamed my supplier in Penang. Sixty-eight percent on-time delivery — so it looks like the obvious culprit. But when we actually traced the late Helix orders, the supplier explained about thirty percent of them. Thirty percent. The other seventy percent was scheduling failures, maintenance gaps, and a new system my planners don't trust. And here's the kicker: Monterrey — the one plant that kept its planners and isn't on the new system — runs at ninety-four percent. A supply chain monitoring agent would cross-reference all of this automatically. Supplier data, production schedules, maintenance logs, system accuracy. It doesn't just tell you what's late. It tells you why.`
  },
  {
    id: 'people',
    speakerId: 'chro',
    narration: `Nine of thirty-one plant and operations leaders left in twelve months. And the exit interviews say the same thing every single time: their decisions were moved to a central hub. They're measured on things they can no longer control. They spend every shift firefighting. Two more critical leaders — Tomas Novak at Brno and Anjali Kapoor in supply planning — were about to leave. Nobody in the C-suite knew. An AI talent risk agent monitors engagement signals, exit interview patterns, workload metrics. It flags flight risks weeks before resignation. Not after the letter lands on your desk.`
  },
  {
    id: 'technology',
    speakerId: 'cco',
    narration: `Forty-four million dollars on a manufacturing execution system. And what did we get? Seventy-one percent schedule accuracy against a ninety-five percent target. My planners are running shadow spreadsheets to survive. Meanwhile Monterrey — which is not on the new system — is outperforming every plant that is. A system health watchdog agent would have caught this in the first month. It continuously audits system accuracy against operational outcomes. When planners start building workarounds, it doesn't just log it — it escalates the gap and quantifies the business impact in dollars, not dashboards.`
  },
  {
    id: 'decision',
    speakerId: 'board',
    narration: `Forty million dollars. That's what the board approved as an emergency budget. Not enough for everything — which is exactly the point. Supply chain fixes? Technology repairs? Rehire the planners? Retain the leaders who are leaving? Save the customer relationship? Add capacity? You can't fund all of it. The quality of this allocation depends entirely on whether the diagnosis was right. A decision intelligence agent models the downstream effects of every scenario. It shows you the trade-offs in real time. Fund supply but not workforce — here's what happens at Brno in sixty days. It doesn't decide for you. It makes sure you can't bet forty million in the dark.`
  },
  {
    id: 'escalation',
    speakerId: 'narrator',
    narration: `Monday, a production line goes down at Brno. Tuesday, the customer accelerates their contract review to ten days. Wednesday, the Brno plant head resigns. Thursday, the CFO demands five percent out of operating expenses. Friday, the board wants the recovery plan. Five crises in a single week, landing on a team already stretched to breaking point. Without AI agents, each one is a surprise. The team is reactive, overwhelmed, making calls on instinct. With AI agents, the system triages incoming crises against the existing plan automatically. It surfaces which events are containable and which change the fundamentals. It drafts communications. It models impact. It keeps every stakeholder on the same version of truth — in real time.`
  },
  {
    id: 'future',
    speakerId: 'agent',
    narration: `Every signal that mattered in this crisis was already in the company's data. Supply chain patterns. Scheduling accuracy. Attrition trends. Customer sentiment. System adoption rates. The problem was never information. It was connection, speed, and pattern recognition at a scale no human team can match alone. Supply chain monitoring. Real-time quality audits. Talent risk detection. Decision scenario modelling. Automated stakeholder communications. Crisis triage and response. Each one an agent. All connected. All watching. All working while your team sleeps. AI agents don't replace your judgement. They make it possible to exercise that judgement with real evidence, at the speed the business actually moves. The question is not whether this technology will run operations. The question is whether you'll be the company that has it — or the company competing against one that does.`
  }
];
