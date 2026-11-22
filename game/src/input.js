// input.js - mouse and keyboard control of the table.
// Mouse: click a hand card to lift it, click a lane slot to place a
// creature, click any creature or a life orb to target a spell,
// click END TURN to clash. Keyboard mirrors it: 1-7 select a hand
// card, Q/W/E choose lanes 1-3, Enter ends the turn, Esc deselects.

import { LANES, LANE_W, ENEMY_BOARD_Y, PLAYER_BOARD_Y, CARD_H, HAND_W, HAND_H } from './config.js';
import { playCreature, castSpell, endPlayerTurn } from './state.js';
import { sfx } from './audio.js';

export function handCardRect(state, i) {
  const totalW = state.player.hand.length * 126;
  return { x: 1280 / 2 - totalW / 2 + i * 126 - 40, y: 622 - (i === state.selectedHand ? 16 : 0), w: HAND_W, h: HAND_H };
}

export function boardRect(side, lane) {
  return { x: LANES[lane].x + 14, y: side === 'player' ? PLAYER_BOARD_Y : ENEMY_BOARD_Y, w: 148, h: CARD_H };
}

function inside(x, y, r) { return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }

export function handleClick(state, ui, x, y, onPhaseChange) {
  if (state.screen === 'title') {
    if (inside(x, y, ui.buttons.start)) { state.screen = 'duel'; sfx.place(); }
    return;
  }
  if (state.screen === 'victory' || state.screen === 'defeat') {
    if (inside(x, y, { x: 640 - 130, y: 560, w: 260, h: 56 })) onPhaseChange('restart');
    return;
  }
  if (state.phase !== 'play') return;

  // Life orbs are spell targets (Bolt / Verdict on a face).
  if (state.pendingSpell) {
    if (Math.hypot(x - 1130, y - 108) < 48) { if (castSpell(state, state.selectedHand, { type: 'face', side: 'rival' })) sfx.spell(); return; }
    if (Math.hypot(x - 1130, y - 520) < 48) { if (castSpell(state, state.selectedHand, { type: 'face', side: 'player' })) sfx.spell(); return; }
  }

  // Board creatures are spell targets.
  if (state.pendingSpell) {
    for (const side of ['player', 'rival']) for (let lane = 0; lane < 3; lane++) {
      if (state[side].board[lane] && inside(x, y, boardRect(side, lane))) {
        if (castSpell(state, state.selectedHand, { type: 'creature', side, lane })) sfx.spell();
        return;
      }
    }
  }

  // Hand selection.
  for (let i = 0; i < state.player.hand.length; i++) {
    if (inside(x, y, handCardRect(state, i))) {
      const card = state.player.hand[i];
      if (card.cost > state.player.mana) { state.message = `Not enough mana for ${card.name} (needs ${card.cost}).`; return; }
      state.selectedHand = i;
      state.pendingSpell = card.kind === 'spell' ? card : null;
      state.message = card.kind === 'spell' ? `Choose a target for ${card.name}.` : `${card.name} selected - click a lane.`;
      return;
    }
  }

  // Lane placement for a selected creature.
  if (state.selectedHand >= 0 && !state.pendingSpell) {
    for (let lane = 0; lane < 3; lane++) {
      const slot = { x: LANES[lane].x, y: PLAYER_BOARD_Y, w: LANE_W, h: CARD_H };
      if (inside(x, y, slot)) { if (playCreature(state, state.selectedHand, lane)) sfx.place(); return; }
    }
  }

  if (inside(x, y, ui.buttons.endTurn)) {
    endPlayerTurn(state); sfx.clash(); onPhaseChange('clash');
  }
}

export function handleKey(state, ui, key, onPhaseChange) {
  if (state.screen === 'title' && (key === 'Enter' || key === ' ')) { state.screen = 'duel'; return; }
  if ((state.screen === 'victory' || state.screen === 'defeat') && key === 'Enter') { onPhaseChange('restart'); return; }
  if (state.screen !== 'duel' || state.phase !== 'play') return;
  if (key >= '1' && key <= '7') {
    const i = Number(key) - 1;
    if (i < state.player.hand.length) {
      state.selectedHand = i;
      const card = state.player.hand[i];
      state.pendingSpell = card.kind === 'spell' ? card : null;
    }
  } else if (key === 'Escape') { state.selectedHand = -1; state.pendingSpell = null; }
  else if (['q', 'w', 'e'].includes(key.toLowerCase())) {
    const lane = ['q', 'w', 'e'].indexOf(key.toLowerCase());
    if (state.selectedHand >= 0 && !state.pendingSpell) { if (playCreature(state, state.selectedHand, lane)) sfx.place(); }
  } else if (key === 'Enter') { endPlayerTurn(state); sfx.clash(); onPhaseChange('clash'); }
}
