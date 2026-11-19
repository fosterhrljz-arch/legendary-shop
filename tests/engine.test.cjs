const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/content.js');
const E = require('../js/engine.js');

function reveal(state = E.createGame()) { return E.identify(state, E.currentItem(state).correctIndex); }
function delivery(state = E.createGame()) { return E.beginDelivery(reveal(state)); }
function completeRound(state = E.createGame()) {
  const ready = delivery(state);
  return E.advance(E.deliver(ready, E.currentItem(ready).recipient));
}

test('content has 15 valid unique packages, 12 monsters, and three human returns', () => {
  assert.equal(C.items.length, 15);
  assert.equal(C.monsters.length, 12);
  assert.equal(C.items.filter(item => item.recipient === 'human').length, 3);
  assert.equal(new Set(C.items.map(item => item.id)).size, C.items.length);
  assert.equal(new Set(C.monsters.map(monster => monster.id)).size, C.monsters.length);
  for (const item of C.items) {
    assert.equal(item.candidates.length, 3);
    assert.equal(new Set(item.candidates).size, 3);
    assert.equal(item.candidates[item.correctIndex], item.name);
    assert.ok(item.recipient === 'human' || C.monsters.some(monster => monster.id === item.recipient));
    for (const key of ['id', 'name', 'description', 'category', 'recipient', 'visualHint', 'sprite', 'explanation']) assert.ok(item[key]);
  }
  for (const monster of C.monsters) {
    assert.ok(C.items.some(item => item.recipient === monster.id));
    assert.ok(monster.likes.length && monster.dislikes.length && monster.hint && monster.approval && monster.complaint);
  }
  assert.deepEqual(new Set(C.items.map(item => item.correctIndex)), new Set([0, 1, 2]));
});

test('correct identity reveals the item and awards exactly 50 points', () => {
  const original = E.createGame();
  const next = reveal(original);
  assert.equal(next.phase, 'reveal');
  assert.equal(next.score, 50);
  assert.equal(next.identified, 1);
  assert.equal(next.feedback.kind, 'success');
  assert.equal(original.phase, 'identify');
  assert.equal(original.score, 0);
  assert.strictEqual(E.identify(next, E.currentItem(next).correctIndex), next);
});

test('wrong identity gives readable feedback, records a mistake, and permits retry', () => {
  const state = E.createGame();
  const wrongIndex = (E.currentItem(state).correctIndex + 1) % 3;
  const wrong = E.identify(state, wrongIndex);
  assert.equal(wrong.phase, 'identify');
  assert.equal(wrong.score, 0);
  assert.equal(wrong.mistakes, 1);
  assert.equal(wrong.feedback.kind, 'error');
  assert.ok(wrong.feedback.text.includes(E.currentItem(wrong).explanation));
  assert.deepEqual(wrong.triedAnswers, [wrongIndex]);
  assert.strictEqual(E.identify(wrong, wrongIndex), wrong);
  const corrected = reveal(wrong);
  assert.equal(corrected.phase, 'reveal');
  assert.equal(corrected.score, 50);
});

test('delivery matching awards 100 points and rejects repeated rewards', () => {
  const state = delivery();
  assert.equal(state.phase, 'deliver');
  assert.equal(state.feedback, null);
  const next = E.deliver(state, E.currentItem(state).recipient);
  assert.equal(next.phase, 'delivered');
  assert.equal(next.score, 150);
  assert.equal(next.delivered, 1);
  assert.equal(next.feedback.kind, 'success');
  assert.strictEqual(E.deliver(next, E.currentItem(next).recipient), next);
});

test('wrong delivery deducts ten, records complaint, and keeps the round playable', () => {
  const state = delivery();
  const wrongId = E.getRecipients(state).find(id => id !== E.currentItem(state).recipient);
  const next = E.deliver(state, wrongId);
  assert.equal(next.phase, 'deliver');
  assert.equal(next.score, 40);
  assert.equal(next.mistakes, 1);
  assert.equal(next.feedback.kind, 'error');
  assert.ok(next.feedback.text.includes(C.monsters.find(monster => monster.id === wrongId).complaint));
  assert.strictEqual(E.deliver(next, wrongId), next);
  assert.equal(E.deliver(next, E.currentItem(next).recipient).phase, 'delivered');
});

test('returning monster goods is a mistake; human packages can be returned successfully', () => {
  const wrong = E.deliver(delivery(), 'human');
  assert.equal(wrong.mistakes, 1);
  assert.equal(wrong.phase, 'deliver');
  let state = E.createGame();
  while (E.currentItem(state).recipient !== 'human') state = completeRound(state);
  state = delivery(state);
  const next = E.deliver(state, 'human');
  assert.equal(next.phase, 'delivered');
  assert.equal(next.feedback.title, 'Human mix-up returned!');
});

test('every package has three unique customer choices with its intended monster', () => {
  let state = E.createGame();
  while (state.phase !== 'ended') {
    const item = E.currentItem(state);
    const options = E.getRecipients(state);
    assert.equal(options.length, 3);
    assert.equal(new Set(options).size, 3);
    assert.ok(options.every(id => C.monsters.some(monster => monster.id === id)));
    if (item.recipient !== 'human') assert.ok(options.includes(item.recipient));
    assert.deepEqual(E.getRecipients(state), options);
    state = completeRound(state);
  }
  assert.deepEqual(E.getRecipients(state), []);
});

test('progress resets round choices, preserves score, and switches stages at rounds six and eleven', () => {
  let state = completeRound();
  assert.equal(state.round, 1);
  assert.equal(state.phase, 'identify');
  assert.equal(state.score, 150);
  assert.equal(state.history.length, 1);
  assert.deepEqual(state.triedAnswers, []);
  assert.deepEqual(state.triedRecipients, []);
  assert.equal(E.stageForRound(0).name, 'Training Chaos');
  assert.equal(E.stageForRound(4).id, 1);
  assert.equal(E.stageForRound(5).name, 'Peak Halloween Rush');
  assert.equal(E.stageForRound(9).id, 2);
  assert.equal(E.stageForRound(10).name, 'Full Shop Meltdown');
  assert.equal(E.stageForRound(14).id, 3);
});

test('a complete perfect shift ends only after the final next action at 2250 points', () => {
  let state = E.createGame();
  for (let round = 0; round < 14; round++) {
    state = completeRound(state);
    assert.notEqual(state.phase, 'ended');
  }
  state = delivery(state);
  state = E.deliver(state, E.currentItem(state).recipient);
  assert.equal(state.phase, 'delivered');
  state = E.advance(state);
  assert.equal(state.phase, 'ended');
  assert.equal(state.score, 2250);
  assert.equal(state.mistakes, 0);
  assert.equal(state.identified, 15);
  assert.equal(state.delivered, 15);
  assert.equal(state.history.length, 15);
  assert.equal(E.currentItem(state), null);
  assert.equal(E.getRank(state).title, 'Legendary Shop Savior');
  assert.strictEqual(E.advance(state), state);
});

test('invalid phase actions and unsupported answers do not mutate the state', () => {
  const state = E.createGame();
  for (const answer of [-1, 3, 1.5, NaN, '1', null]) assert.strictEqual(E.identify(state, answer), state);
  assert.strictEqual(E.deliver(state, 'dragonkin'), state);
  assert.strictEqual(E.beginDelivery(state), state);
  assert.strictEqual(E.advance(state), state);
  const ready = delivery();
  assert.strictEqual(E.deliver(ready, 'not-a-monster'), ready);
  const absent = C.monsters.find(monster => !E.getRecipients(ready).includes(monster.id)).id;
  assert.strictEqual(E.deliver(ready, absent), ready);
});

test('all rank tiers have a friendly ending and mistakes never cause a hard game over', () => {
  const expected = [[0, 'S'], [5, 'A'], [15, 'B'], [40, 'C']];
  for (const [mistakes, tier] of expected) {
    const rank = E.getRank({ identified: 15, delivered: 15, mistakes });
    assert.equal(rank.tier, tier);
    assert.ok(rank.title && rank.description);
  }
  let state = E.createGame();
  while (state.phase !== 'ended') {
    const item = E.currentItem(state);
    for (let index = 0; index < 3; index++) if (index !== item.correctIndex) state = E.identify(state, index);
    state = E.beginDelivery(reveal(state));
    for (const recipient of [...E.getRecipients(state), 'human']) if (recipient !== item.recipient) state = E.deliver(state, recipient);
    state = E.advance(E.deliver(state, item.recipient));
  }
  assert.equal(state.mistakes, 75);
  assert.equal(state.phase, 'ended');
  assert.equal(E.getRank(state).tier, 'C');
});

test('every live phase and final state round-trip through safe persistence', () => {
  let state = E.createGame();
  const check = value => assert.deepEqual(E.restore(E.serialize(value)), value);
  while (state.phase !== 'ended') {
    check(state);
    const item = E.currentItem(state);
    state = E.identify(state, (item.correctIndex + 1) % 3); check(state);
    state = reveal(state); check(state);
    state = E.beginDelivery(state); check(state);
    state = E.deliver(state, [...E.getRecipients(state), 'human'].find(id => id !== item.recipient)); check(state);
    state = E.deliver(state, item.recipient); check(state);
    state = E.advance(state); check(state);
  }
});

test('malformed and inconsistent saved games are rejected', () => {
  for (const raw of [null, '', '{', '{}', 'null', '[]', '{"version":999}']) assert.equal(E.restore(raw), null);
  const state = E.createGame();
  for (const patch of [
    { score: -1 }, { round: 15 }, { round: 0.5 }, { phase: 'unknown' }, { identified: 5 },
    { mistakes: 50 }, { triedAnswers: [0, 0] }, { triedAnswers: [99] }, { triedRecipients: ['alien'] },
    { history: [{ itemId: 'fake', mistakes: 0 }] }, { score: 1000 }, { feedback: { kind: 'unsafe' } }
  ]) assert.equal(E.restore({ ...state, ...patch }), null);
});

test('saved reveal and completed-delivery screens require feedback for safe resume', () => {
  const identified = reveal();
  const ready = E.beginDelivery(identified);
  const delivered = E.deliver(ready, E.currentItem(ready).recipient);
  for (const state of [identified, delivered]) {
    assert.equal(E.restore(E.serialize({ ...state, feedback: null })), null);
    assert.deepEqual(E.restore(E.serialize(state)), state);
  }
  // Neutral phases intentionally have no dialogue; they remain valid saves.
  for (const state of [E.createGame(), ready]) {
    assert.equal(state.feedback, null);
    assert.deepEqual(E.restore(E.serialize(state)), state);
  }
});
