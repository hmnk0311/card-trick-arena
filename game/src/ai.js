// ai.js - Mistral, the rival duelist. Her plan is never hidden: at
// the start of your turn the intent banner names the exact card and
// lane she will strike with, so you can block that lane, remove the
// creature, or race her. She plays by three readable rules:
//   1. Spend mana on the biggest creature she can afford, into the
//      lane where she is weakest (or emptiest).
//   2. Hold Ember Bolt to finish a creature she cannot trade into.
//   3. Attack every lane she can - she never passes a free hit.
// Her intent is recomputed after she plays, so what you read during
// your Play phase is the clash that is actually coming.

import { drawCard, clash, damageCreature, hurtFace, resonates } from './state.js';
import { MAX_MANA_CAP } from './config.js';

export function computeIntent(state) {
  const r = state.rival;
  let best = null;
  for (let lane = 0; lane < 3; lane++) {
    const c = r.board[lane];
    if (!c || (c.justPlayed && c.trait !== 'swift')) continue;
    const blocked = !!state.player.board[lane];
    const dmg = c.curAtk + (r.board.some((a) => a && a !== c && a.trait === 'rally') ? 1 : 0);
    if (!best || (!blocked && best.blocked) || dmg > best.dmg) best = { lane, card: c, dmg, blocked };
  }
  state.rivalIntent = best;
  return best;
}

export function intentText(state) {
  const i = state.rivalIntent;
  if (!i) return 'Mistral has no ready attacker. Her lanes are quiet - push!';
  const where = `lane ${i.lane + 1}`;
  if (i.blocked) return `Mistral intends: ${i.card.name} clashes in ${where} for ${i.dmg}.`;
  return `Mistral intends: ${i.card.name} hits YOUR LIFE for ${i.dmg} in ${where} - block it!`;
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

  // Bolt a player creature she cannot profitably trade into.
  const boltIdx = r.hand.findIndex((c) => c.spell === 'bolt' && c.cost <= r.mana);
  if (boltIdx >= 0) {
    let targetLane = -1;
    for (let l = 0; l < 3; l++) {
      const c = state.player.board[l];
      if (c && c.curHp <= 2 && (!state.rival.board[l] || state.rival.board[l].curAtk < c.curHp)) targetLane = l;
    }
    if (targetLane >= 0) {
      const card = r.hand.splice(boltIdx, 1)[0];
      r.mana -= card.cost;
      damageCreature(state, 'player', targetLane, 2);
      state.message = `Mistral bolts your creature in lane ${targetLane + 1}!`;
    }
  }

  clash(state, 'rival');
  computeIntent(state);
}
