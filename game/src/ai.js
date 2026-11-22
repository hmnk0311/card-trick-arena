// ai.js - Mistral, the rival duelist. Her ready board is never
// hidden: the threat banner names the strongest attack it poses
// (card, lane, damage) and is recomputed after every board change,
// so you can block that lane, remove the creature, or race her.
// She plays by three readable rules:
//   1. Spend mana on the biggest creature she can afford, into her
//      leftmost empty lane.
//   2. Hold Ember Bolt to finish a creature she cannot trade into.
//   3. Attack every lane she can - she never passes a free hit.
// Her intent is recomputed after she plays, so what you read during
// your Play phase is the clash that is actually coming.

import { drawCard, clash, damageCreature, hurtFace, resonates, resolveSpell, laneAttack } from './state.js';
import { MAX_MANA_CAP } from './config.js';

// The banner advertises her READY board: the strongest threat her
// already-deployed creatures pose right now, recomputed after every
// board change (input.js refreshes it whenever the player plays or
// removes a card), using the same effective-attack maths as combat
// itself, RALLY bonuses included. An unblocked life hit always
// outranks a blocked clash, however big the clash is.
export function computeIntent(state) {
  const r = state.rival;
  let best = null;
  for (let lane = 0; lane < 3; lane++) {
    const c = r.board[lane];
    if (!c || (c.justPlayed && c.trait !== 'swift')) continue;
    const blocked = !!state.player.board[lane];
    const dmg = laneAttack(r, lane);
    const score = (blocked ? 0 : 1000) + dmg;
    if (!best || score > best.score) best = { lane, card: c, dmg, blocked, score };
  }
  state.rivalIntent = best;
  return best;
}

export function intentText(state) {
  const i = state.rivalIntent;
  if (!i) return 'Board threat: none. Mistral has no ready attacker - push!';
  const where = `lane ${i.lane + 1}`;
  if (i.blocked) return `Board threat: ${i.card.name} clashes in ${where} for ${i.dmg}.`;
  return `Board threat: ${i.card.name} hits YOUR LIFE for ${i.dmg} in ${where} - block it!`;
}

// Runs the rival's whole turn: forge, play, clash. Called by main
// after a short pause so the player can see the clash they caused.
export function runRivalTurn(state) {
  const r = state.rival;
  r.manaMax = Math.min(MAX_MANA_CAP, r.manaMax + 1);
  r.mana = r.manaMax;
  r.playedSigils = [];
  drawCard(r);

  // Play creatures, biggest first, into her weakest lane.
  for (;;) {
    let bestIdx = -1;
    for (let i = 0; i < r.hand.length; i++) {
      const c = r.hand[i];
      if (c.kind === 'creature' && c.cost <= r.mana && (bestIdx < 0 || c.cost > r.hand[bestIdx].cost)) bestIdx = i;
    }
    if (bestIdx < 0) break;
    let lane = -1, weakest = Infinity;
    for (let l = 0; l < 3; l++) {
      const cur = r.board[l] ? r.board[l].curAtk + r.board[l].curHp : 0;
      if (!r.board[l] && cur < weakest) { weakest = cur; lane = l; }
    }
    if (lane < 0) break;
    const card = r.hand.splice(bestIdx, 1)[0];
    r.mana -= card.cost;
    if (resonates(r, card)) { card.curAtk += 1; card.curHp += 1; card.hp += 1; card.resonated = true; }
    r.playedSigils.push(card.sigil);
    card.justPlayed = true;
    r.board[lane] = card;
    state.message = `Mistral plays ${card.name} in lane ${lane + 1}.`;
  }

  // Spells, through the same shared resolution as the player's:
  // Growth fattens her biggest creature, Verdict removes a creature
  // it can kill (or mends her when she is low), Undertow removes a
  // small creature and draws, Bolt finishes what her lanes cannot.
  // She casts at most ONE spell a turn - a deliberate duelist, and
  // it keeps her readable instead of machine-gunning her hand.
  for (let spellsCast = 0; spellsCast < 1;) {
    let cast = false;
    for (let i = 0; i < r.hand.length && !cast; i++) {
      const card = r.hand[i];
      if (card.kind !== 'spell' || card.cost > r.mana) continue;
      const res = resonates(r, card);
      let target = null;
      if (card.spell === 'growth') {
        let lane = -1, best = -1;
        r.board.forEach((c, l) => { if (c && c.curAtk > best) { best = c.curAtk; lane = l; } });
        if (lane >= 0) target = { type: 'creature', side: 'rival', lane };
      } else if (card.spell === 'verdict') {
        let lane = -1;
        state.player.board.forEach((c, l) => { if (c && c.curHp <= 3 + (res ? 1 : 0)) lane = l; });
        if (lane >= 0) target = { type: 'creature', side: 'player', lane };
        else if (r.life <= 9) target = { type: 'face', side: 'rival' };
      } else if (card.spell === 'undertow' || card.spell === 'bolt') {
        let lane = -1;
        state.player.board.forEach((c, l) => { if (c && c.curHp <= 2 + (res ? 1 : 0)) lane = l; });
        if (lane >= 0) target = { type: 'creature', side: 'player', lane };
        else if (card.spell === 'bolt' && state.player.life <= 2 + (res ? 1 : 0)) target = { type: 'face', side: 'player' };
      }
      if (target && resolveSpell(state, 'rival', card, target, res)) {
        r.hand.splice(i, 1);
        r.mana -= card.cost;
        r.playedSigils.push(card.sigil);
        state.message = `Mistral casts ${card.name}!`;
        cast = true;
      }
    }
    if (!cast) break;
    spellsCast++;
  }

  clash(state, 'rival');
  computeIntent(state);
}
