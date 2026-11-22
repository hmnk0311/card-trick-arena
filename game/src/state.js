// state.js - the duel itself: turns, mana, resonance, lane combat.
// A turn is three named phases the HUD always shows:
//   1. Draw & Forge  - draw a card, mana crystals grow and refill.
//   2. Play          - click a hand card, then a lane (or a target).
//   3. Clash         - your board attacks down its lanes, then the
//                      rival answers with a full turn of their own.
// A creature fights the creature facing it; an empty lane means the
// blow lands on the rival duelist's life orb. First life orb to
// zero ends the duel.

import { START_LIFE, MAX_MANA_CAP, HAND_LIMIT, OPENING_HAND } from './config.js';
import { buildDeck, instantiate, CARD_POOL } from './deck.js';

export function newDuel(seed = 1) {
  const s = {
    screen: 'title', // title | duel | victory | defeat
    seed,
    turn: 1,
    phase: 'play', // play | clash | rival | over
    player: freshSide(seed * 7 + 3),
    rival: freshSide(seed * 13 + 5),
    selectedHand: -1,
    selectedBoard: null, // {side, lane} for spell targets on creatures
    pendingSpell: null,
    log: [],
    floaters: [], // {x lane, y, text, color, t}
    clashMarks: [], // {lane, side, t} attack flashes
    shake: 0,
    winner: null,
    rivalIntent: null,
    message: 'Your move. Pick a card, then a lane.',
  };
  for (let i = 0; i < OPENING_HAND; i++) { drawCard(s.player); drawCard(s.rival); }
  s.player.manaMax = 1; s.player.mana = 1;
  // The rival forges at the start of her own turn (runRivalTurn adds
  // her crystal), so she starts at 0: giving her 1 here as well
  // would put her a full crystal ahead for the whole duel.
  s.rival.manaMax = 0; s.rival.mana = 0;
  return s;
}

function freshSide(seed) {
  return {
    life: START_LIFE, mana: 0, manaMax: 0,
    deck: buildDeck(seed), hand: [], board: [null, null, null],
    playedSigils: [],
  };
}

export function drawCard(side) {
  if (!side.deck.length) return null;
  const card = side.deck.pop();
  // A full hand cannot take the card: it goes to the bottom of the
  // deck and the draw honestly reports that nothing was drawn.
  if (side.hand.length >= HAND_LIMIT) { side.deck.unshift(card); return null; }
  side.hand.push(card);
  return card;
}

export function laneAttack(side, lane) {
  const c = side.board[lane];
  if (!c) return 0;
  let atk = c.curAtk;
  for (const ally of side.board) if (ally && ally !== c && ally.trait === 'rally') atk += 1;
  return atk;
}

export function canPlay(state, card) {
  return state.screen === 'duel' && state.phase === 'play' && card.cost <= state.player.mana;
}

// Resonance: exactly the second card of a sigil in the same turn
// resonates; the third and later cards of that sigil do not.
export function resonates(side, card) {
  return side.playedSigils.filter((s) => s === card.sigil).length === 1;
}

export function playCreature(state, handIdx, lane) {
  const p = state.player;
  const card = p.hand[handIdx];
  if (!card || card.kind !== 'creature' || p.board[lane] || !canPlay(state, card)) return false;
  p.mana -= card.cost;
  p.hand.splice(handIdx, 1);
  const res = resonates(p, card);
  if (res) { card.curAtk += 1; card.curHp += 1; card.hp += 1; card.resonated = true; }
  p.playedSigils.push(card.sigil);
  card.justPlayed = true;
  p.board[lane] = card;
  state.selectedHand = -1;
  state.message = res ? `${card.name} RESONATES! +1/+1 from the ${card.sigil} sigil.` : `${card.name} takes lane ${lane + 1}.`;
  return true;
}

// Spells resolve against a target: {type:'creature', side, lane} or
// {type:'face', side}. Returns true when the spell was cast.
export function castSpell(state, handIdx, target) {
  const p = state.player;
  const card = p.hand[handIdx];
  if (!card || card.kind !== 'spell' || !canPlay(state, card)) return false;
  const res = resonates(p, card);
  // Remove the spell from the hand BEFORE resolving it, so a spell
  // that draws a card (Undertow) frees its own slot first; put it
  // back untouched when the target turns out to be illegal.
  p.hand.splice(handIdx, 1);
  const ok = resolveSpell(state, 'player', card, target, res);
  if (!ok) { p.hand.splice(handIdx, 0, card); return false; }
  p.mana -= card.cost;
  p.playedSigils.push(card.sigil);
  state.selectedHand = -1; state.pendingSpell = null;
  // A spell can end the duel on the spot (a lethal Bolt): check
  // before anything else gets a chance to act.
  checkEnd(state);
  return true;
}

export function resolveSpell(state, ownerKey, card, target, res) {
  const me = state[ownerKey];
  const foeKey = ownerKey === 'player' ? 'rival' : 'player';
  const foe = state[foeKey];
  const bonus = res ? 1 : 0;
  if (card.spell === 'bolt') {
    // A face target hits the duelist whose orb was actually chosen.
    if (target.type === 'face') { hurtFace(state, target.side, 2 + bonus); }
    else if (!damageCreature(state, target.side, target.lane, 2 + bonus)) return false;
  } else if (card.spell === 'verdict') {
    // Verdict mends only the caster's own orb; on a creature it judges.
    if (target.type === 'face' && target.side === ownerKey) { me.life = Math.min(START_LIFE, me.life + 4 + bonus); state.message = `${card.name} mends its caster.`; }
    else if (target.type === 'face') return false;
    else if (!damageCreature(state, target.side, target.lane, 3 + bonus)) return false;
  } else if (card.spell === 'undertow') {
    if (target.type === 'face' || !damageCreature(state, target.side, target.lane, 2 + bonus)) return false;
    drawCard(me);
  } else if (card.spell === 'growth') {
    if (target.type !== 'creature' || target.side !== ownerKey) return false;
    const c = me.board[target.lane];
    if (!c) return false;
    c.curAtk += 2 + bonus; c.curHp += 2 + bonus; c.hp += 2 + bonus;
    state.message = `${c.name} grows wild! +${2 + bonus}/+${2 + bonus}.`;
  } else return false;
  return true;
}

export function damageCreature(state, sideKey, lane, amount) {
  const side = state[sideKey];
  const c = side.board[lane];
  if (!c) return false;
  let dmg = amount;
  if (c.trait === 'armored') dmg = Math.max(0, dmg - 1);
  c.curHp -= dmg;
  state.floaters.push({ lane, side: sideKey, text: dmg === 0 && amount > 0 ? '🛡 SHIELD' : `-${dmg}`, color: dmg === 0 ? '#bdeaff' : '#ff7a5c', t: 0 });
  if (c.curHp <= 0) { state.message = `${c.name} falls!`; side.board[lane] = null; }
  return true;
}

export function hurtFace(state, sideKey, amount) {
  state[sideKey].life -= amount;
  // Face damage floats at the orb that actually took it (the render
  // layer places side 'face-rival' / 'face-player' on the orbs).
  state.floaters.push({ lane: 1, side: sideKey === 'rival' ? 'face-rival' : 'face-player', text: `-${amount} LIFE`, color: '#ffd34d', t: 0 });
  state.shake = Math.min(10, state.shake + 4);
}

// One side's Clash phase: every ready creature strikes down its lane.
export function clash(state, sideKey) {
  const me = state[sideKey];
  const foeKey = sideKey === 'player' ? 'rival' : 'player';
  const foe = state[foeKey];
  for (let lane = 0; lane < 3; lane++) {
    const c = me.board[lane];
    if (!c) continue;
    if (c.justPlayed && c.trait !== 'swift') continue;
    const atk = laneAttack(me, lane);
    state.clashMarks.push({ lane, side: sideKey, t: 0 });
    const blocker = foe.board[lane];
    if (blocker) {
      // Combat is simultaneous: the blocker strikes back even when
      // the blow kills it, so a big attacker cannot snowball a lane
      // for free - every clash costs both sides.
      const back = laneAttack(foe, lane);
      damageCreature(state, foeKey, lane, atk);
      damageCreature(state, sideKey, lane, back);
    } else {
      hurtFace(state, foeKey, atk);
    }
    if (checkEnd(state)) return;
  }
}

export function checkEnd(state) {
  if (state.player.life <= 0 || state.rival.life <= 0) {
    state.phase = 'over';
    state.winner = state.rival.life <= 0 && state.player.life > 0 ? 'player' : 'rival';
    state.screen = state.winner === 'player' ? 'victory' : 'defeat';
    return true;
  }
  return false;
}

export function endPlayerTurn(state) {
  if (state.phase !== 'play') return;
  state.selectedHand = -1; state.pendingSpell = null;
  state.phase = 'clash';
  clash(state, 'player');
  if (state.phase === 'over') return;
  state.phase = 'rival';
}

export function finishRivalTurn(state) {
  if (state.phase === 'over') return;
  state.turn += 1;
  const p = state.player;
  p.manaMax = Math.min(MAX_MANA_CAP, p.manaMax + 1);
  p.mana = p.manaMax;
  p.playedSigils = [];
  for (const c of p.board) if (c) c.justPlayed = false;
  for (const c of state.rival.board) if (c) c.justPlayed = false;
  drawCard(p);
  state.phase = 'play';
  state.message = `Turn ${state.turn}. Draw & Forge done - your move.`;
}

export function poolCard(id) { return instantiate(CARD_POOL.find((c) => c.id === id)); }
