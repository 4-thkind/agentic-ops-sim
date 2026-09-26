/**
 * Self-check for the workshop's problem matcher. Not loaded by the page.
 *
 *     node js/test_matcher.js
 *
 * Every scenario's own example must route to itself, plus a few phrasings a
 * CEO might actually type. Fails loudly if a keyword edit breaks routing.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ctx = { console };
vm.createContext(ctx);
for (const f of ['data.js', 'workshop.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, f), 'utf8'), ctx);
}
const match = text => (vm.runInContext('Workshop.matchScenario', ctx)(text) || {}).id || null;

const cases = [
  ...vm.runInContext('SCENARIOS', ctx).map(s => [s.example, s.id]),
  ['Closing the books takes way too long, I want five days', 'close'],
  ['We keep paying vendors twice and invoices are stuck', 'ap'],
  ['Walmart short-pays us every month', 'deductions'],
  ['Our deliveries are late and the largest customer might walk', 'supply'],
  ['The regulator is coming and our AML alert queue is huge', 'compliance'],
  ['Customer satisfaction dropped and the call centre is drowning', 'care'],
  ['Good people keep resigning and onboarding takes nine months', 'knowledge'],
  ['What is the weather like', null]
];

let failed = 0;
for (const [text, want] of cases) {
  const got = match(text);
  if (got !== want) { failed++; console.log(`FAIL  "${text}" -> ${got}, want ${want}`); }
}
if (failed) { console.log(`${failed} of ${cases.length} failed`); process.exit(1); }
console.log(`all ${cases.length} checks passed`);
