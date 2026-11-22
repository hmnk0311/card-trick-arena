// shots.js - staged scenes for the maker's screenshots.
// ?shot=title|battle|victory|defeat&seed=1 freezes a scene the real
// rules can reach. The battle scene is a legal turn-4 position:
// Mistral's turns 1-3 (mana 1, 2, 3) bought exactly the Puddle
// Sprite (1), Reef Archer (2) and Mist Caller (3) on her board;
// you have played Briar Brute (turn 3) and, this turn, Cinder Imp -
// your first Ember - and the Ash Duelist in your hand is selected:
// she is your second Ember, so she will RESONATE +1/+1, and lane 1
// is where the banner's unblocked Reef Archer threatens your life.
// The live game never uses these; they only set the first frame
// when the URL asks for one.

import { newDuel, poolCard } from './state.js';
import { computeIntent } from './ai.js';

export function shotState(name, seed = 1) {
  const s = newDuel(seed);
  if (name === 'title') { s.screen = 'title'; return s; }
  s.screen = 'duel';
  if (name === 'battle') {
    s.turn = 4;
    s.player.life = 14; s.rival.life = 11;
    s.player.manaMax = 4; s.player.mana = 3;
    s.rival.manaMax = 3; s.rival.mana = 0;
    place(s, 'rival', 0, 'reef-archer');
    place(s, 'rival', 1, 'mist-caller');
    place(s, 'rival', 2, 'puddle-sprite');
    place(s, 'player', 1, 'briar-brute', 2);
    place(s, 'player', 2, 'cinder-imp');
    s.player.hand = [poolCard('ember-bolt'), poolCard('ash-duelist'), poolCard('wild-growth'), poolCard('choir-captain'), poolCard('tide-serpent')];
    s.rival.hand = [poolCard('moss-pup'), poolCard('solar-judgment')];
    s.player.playedSigils = ['ember'];
    s.selectedHand = 1;
    s.player.deck = s.player.deck.slice(0, 27);
    s.rival.deck = s.rival.deck.slice(0, 29);
    s.message = 'Ash Duelist selected: she RESONATES +1/+1 as your 2nd Ember. Click LANE 1 to block the Archer!';
    computeIntent(s);
    return s;
  }
  if (name === 'victory') {
    s.turn = 7; s.rival.life = 0; s.player.life = 9;
    place(s, 'player', 0, 'gilded-lancer');
    place(s, 'player', 1, 'elder-treant', 3);
    place(s, 'rival', 1, 'reef-archer', 1);
    s.player.hand = [poolCard('ember-bolt'), poolCard('dawn-squire')];
    s.rival.hand = [poolCard('moss-pup')];
    s.screen = 'victory'; s.winner = 'player'; s.phase = 'over';
    return s;
  }
  // defeat: the board she won with stays on the table.
  s.turn = 6; s.player.life = 0; s.rival.life = 6;
  place(s, 'rival', 0, 'tide-serpent');
  place(s, 'rival', 2, 'magma-golem', 1);
  place(s, 'player', 2, 'sunshield', 3);
  s.player.hand = [poolCard('undertow')];
  s.rival.hand = [poolCard('ash-duelist'), poolCard('wild-growth')];
  s.screen = 'defeat'; s.winner = 'rival'; s.phase = 'over';
  return s;
}

function place(state, side, lane, id, dmg = 0) {
  const c = poolCard(id);
  c.justPlayed = false;
  c.curHp -= dmg;
  state[side].board[lane] = c;
  return c;
}

export function isShotMode(params) { return params.has('shot'); }
