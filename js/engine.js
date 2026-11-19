(function (root) {
  'use strict';
  const content = typeof module !== 'undefined' && module.exports ? require('./content.js') : root.ShopContent;
  const SCORE = Object.freeze({ identify: 50, delivery: 100, mistake: 10 });

  function createGame() {
    return {
      version: 1, round: 0, phase: 'identify', score: 0, mistakes: 0,
      identified: 0, delivered: 0, triedAnswers: [], triedRecipients: [],
      feedback: null, history: []
    };
  }

  function currentItem(state) {
    return state && state.phase !== 'ended' ? content.items[state.round] || null : null;
  }

  function stageForRound(index) {
    const round = Number.isInteger(index) ? Math.max(0, Math.min(content.items.length - 1, index)) : 0;
    return content.stages.find(stage => round >= stage.start && round <= stage.end);
  }

  function drama(mistakes) {
    return content.boss.drama[Math.min(content.boss.drama.length - 1, Math.floor((mistakes - 1) / 3))];
  }

  function identify(state, index) {
    if (!state || state.phase !== 'identify' || !Number.isInteger(index) || index < 0 || index > 2 || state.triedAnswers.includes(index)) return state;
    const item = currentItem(state);
    if (!item) return state;
    const triedAnswers = [...state.triedAnswers, index];
    if (index === item.correctIndex) {
      return {
        ...state, phase: 'reveal', score: state.score + SCORE.identify,
        identified: state.identified + 1, triedAnswers,
        feedback: { kind: 'success', title: 'Mystery solved!', text: content.boss.encouragement[state.round % content.boss.encouragement.length] }
      };
    }
    const mistakes = state.mistakes + 1;
    return {
      ...state, score: Math.max(0, state.score - SCORE.mistake), mistakes, triedAnswers,
      feedback: { kind: 'error', title: 'A spectacular mix-up!', text: `${item.explanation} ${drama(mistakes)}` }
    };
  }

  function beginDelivery(state) {
    return state && state.phase === 'reveal' ? { ...state, phase: 'deliver', feedback: null } : state;
  }

  // Stable choices keep reloads and retries fair. Human returns remain a separate UI button.
  function getRecipients(state) {
    const item = currentItem(state);
    if (!item) return [];
    const ids = content.monsters.map(monster => monster.id);
    const start = state.round % ids.length;
    if (item.recipient === 'human') return [ids[start], ids[(start + 4) % ids.length], ids[(start + 8) % ids.length]];
    const otherIds = ids.filter(id => id !== item.recipient);
    const choices = [item.recipient, otherIds[start % otherIds.length], otherIds[(start + 5) % otherIds.length]];
    const shift = state.round % 3;
    return [...choices.slice(shift), ...choices.slice(0, shift)];
  }

  function deliver(state, recipient) {
    if (!state || state.phase !== 'deliver' || (recipient !== 'human' && !getRecipients(state).includes(recipient)) || state.triedRecipients.includes(recipient)) return state;
    const item = currentItem(state);
    if (!item) return state;
    const triedRecipients = [...state.triedRecipients, recipient];
    if (recipient === item.recipient) {
      const monster = content.monsters.find(entry => entry.id === recipient);
      return {
        ...state, phase: 'delivered', score: state.score + SCORE.delivery,
        delivered: state.delivered + 1, triedRecipients,
        feedback: {
          kind: 'success', title: recipient === 'human' ? 'Human mix-up returned!' : 'One happy customer!',
          text: monster ? monster.approval : content.boss.humanReturn
        }
      };
    }
    const mistakes = state.mistakes + 1;
    const monster = content.monsters.find(entry => entry.id === recipient);
    return {
      ...state, score: Math.max(0, state.score - SCORE.mistake), mistakes, triedRecipients,
      feedback: {
        kind: 'error', title: recipient === 'human' ? 'Wait! That belongs here!' : 'Wrong monster, right enthusiasm!',
        text: `${monster ? monster.complaint : 'That is a perfectly respectable monster order. Bring it back!'} ${drama(mistakes)}`
      }
    };
  }

  function advance(state) {
    if (!state || state.phase !== 'delivered') return state;
    const history = [...state.history, {
      itemId: content.items[state.round].id,
      mistakes: state.triedAnswers.length + state.triedRecipients.length - 2
    }];
    if (state.round + 1 >= content.items.length) {
      return { ...state, phase: 'ended', feedback: null, history };
    }
    return { ...state, round: state.round + 1, phase: 'identify', triedAnswers: [], triedRecipients: [], feedback: null, history };
  }

  function getRank(state) {
    const accuracy = (state.identified + state.delivered) / Math.max(1, state.identified + state.delivered + state.mistakes);
    if (accuracy >= 0.9) return { tier: 'S', title: 'Legendary Shop Savior', description: 'Halloween is saved. Mr. Marmalade is so proud he has briefly forgotten to shout. Your employee discount is now emotionally significant.' };
    if (accuracy >= 0.75) return { tier: 'A', title: 'Monster Retail Apprentice', description: 'The packages found their people, the till survived, and your name badge is only slightly haunted. You have earned a proper tea break.' };
    if (accuracy >= 0.55) return { tier: 'B', title: 'Assistant of the Damned', description: 'A few wrong turns, one very dramatic boss, and fifteen rescued packages. The monsters are happy. The paperwork is somebody else’s problem.' };
    return { tier: 'C', title: 'Certified Chaos Intern', description: 'You turned a delivery disaster into a memorable evening. Nobody asked for a refund in blood. Mr. Marmalade calls this professional growth.' };
  }

  function serialize(state) { return JSON.stringify(state); }

  // Only load structurally valid, internally consistent saves. A corrupt save starts a fresh shift.
  function restore(raw) {
    try {
      const state = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const integer = value => Number.isInteger(value) && value >= 0;
      if (!state || state.version !== 1 || !integer(state.round) || state.round >= content.items.length ||
          !['identify', 'reveal', 'deliver', 'delivered', 'ended'].includes(state.phase) ||
          !['score', 'mistakes', 'identified', 'delivered'].every(key => integer(state[key])) ||
          !Array.isArray(state.triedAnswers) || !Array.isArray(state.triedRecipients) || !Array.isArray(state.history)) return null;
      const expectedIdentified = state.round + (state.phase === 'identify' ? 0 : 1);
      const expectedDelivered = state.round + (['delivered', 'ended'].includes(state.phase) ? 1 : 0);
      if (state.identified !== expectedIdentified || state.delivered !== expectedDelivered ||
          state.score > state.identified * SCORE.identify + state.delivered * SCORE.delivery ||
          (state.phase === 'ended' && state.round !== content.items.length - 1) ||
          state.history.length !== state.round + (state.phase === 'ended' ? 1 : 0)) return null;
      const item = content.items[state.round];
      const recipientChoices = getRecipients(state.phase === 'ended' ? { ...state, phase: 'deliver' } : state);
      if (new Set(state.triedAnswers).size !== state.triedAnswers.length ||
          state.triedAnswers.some(index => !Number.isInteger(index) || index < 0 || index > 2) ||
          new Set(state.triedRecipients).size !== state.triedRecipients.length ||
          state.triedRecipients.some(id => id !== 'human' && !recipientChoices.includes(id)) ||
          (state.phase === 'identify' && state.triedAnswers.includes(item.correctIndex)) ||
          (state.phase !== 'identify' && !state.triedAnswers.includes(item.correctIndex)) ||
          (['identify', 'reveal'].includes(state.phase) && state.triedRecipients.length > 0) ||
          (state.phase === 'deliver' && state.triedRecipients.includes(item.recipient)) ||
          (['delivered', 'ended'].includes(state.phase) && !state.triedRecipients.includes(item.recipient))) return null;
      if (state.history.some((entry, index) => !entry || entry.itemId !== content.items[index].id || !integer(entry.mistakes) || entry.mistakes > 5)) return null;
      const thisRoundMistakes = state.triedAnswers.filter(index => index !== item.correctIndex).length + state.triedRecipients.filter(id => id !== item.recipient).length;
      const expectedMistakes = state.history.reduce((sum, entry) => sum + entry.mistakes, 0) + (state.phase === 'ended' ? 0 : thisRoundMistakes);
      if (state.mistakes !== expectedMistakes) return null;
      // These screens display the success message immediately after a resume.
      if (['reveal', 'delivered'].includes(state.phase) && state.feedback === null) return null;
      if (state.feedback !== null && (!state.feedback || !['success', 'error'].includes(state.feedback.kind) || typeof state.feedback.title !== 'string' || typeof state.feedback.text !== 'string')) return null;
      return {
        version: 1, round: state.round, phase: state.phase, score: state.score, mistakes: state.mistakes,
        identified: state.identified, delivered: state.delivered,
        triedAnswers: [...state.triedAnswers], triedRecipients: [...state.triedRecipients],
        feedback: state.feedback ? { ...state.feedback } : null,
        history: state.history.map(entry => ({ itemId: entry.itemId, mistakes: entry.mistakes }))
      };
    } catch (_) { return null; }
  }

  const engine = { SCORE, createGame, currentItem, stageForRound, identify, beginDelivery, deliver, advance, getRank, getRecipients, serialize, restore };
  root.ShopEngine = engine;
  if (typeof module !== 'undefined' && module.exports) module.exports = engine;
})(typeof globalThis !== 'undefined' ? globalThis : this);
