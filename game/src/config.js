// config.js - table geometry, palette and the four sigils.
// Every sigil is told apart by colour AND shape AND corner pip, never
// by text alone: Sun is a gold disc, Tide a blue wave-drop, Grove a
// green leaf, Ember a red flame. Card frames, lane gems and the
// resonance meter all reuse these same shapes so a thumbnail reads.

export const W = 1280;
export const H = 800;

export const SIGILS = {
  sun:   { name: 'Sun',   color: '#f2b63c', dark: '#8a5d10', shape: 'disc' },
  tide:  { name: 'Tide',  color: '#3fa7e0', dark: '#175a85', shape: 'drop' },
  grove: { name: 'Grove', color: '#57b96a', dark: '#256b35', shape: 'leaf' },
  ember: { name: 'Ember', color: '#e4573d', dark: '#8c2b18', shape: 'flame' },
};

export const INK = '#f4ecd8';
export const INK_DIM = '#b9aed6';
export const FELT_TOP = '#2e2150';
export const FELT_BOTTOM = '#1d1436';
export const GOLD = '#f2b63c';

// Card geometry: big enough that cost, attack and health stay legible
// when the judge's contact sheet shrinks the table.
export const CARD_W = 148;
export const CARD_H = 196;
export const HAND_W = 118;
export const HAND_H = 158;

// Three lanes across the middle of the table.
export const LANES = [ { x: 356 }, { x: 566 }, { x: 776 } ];
export const LANE_W = 176;
export const ENEMY_BOARD_Y = 196;
export const PLAYER_BOARD_Y = 404;
export const ENEMY_HAND_Y = 18;
export const PLAYER_HAND_Y = 622;

export const START_LIFE = 20;
export const MAX_MANA_CAP = 8;
export const HAND_LIMIT = 7;
export const OPENING_HAND = 4;
