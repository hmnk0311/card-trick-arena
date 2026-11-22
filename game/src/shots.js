// shots.js - staged scenes for the maker's screenshots.
// ?shot=title|battle|victory|defeat&seed=1 freezes a scene the real
// rules can reach: a mid-duel table with both hands, both boards,
// life orbs, mana, a lit resonance meter and Mistral's intent
// banner naming her coming clash. The live game never uses these;
// they only set the first frame when the URL asks for one.

import { newDuel, poolCard, drawCard } from './state.js';
import { computeIntent } from './ai.js';

function place(state, side, lane, id, dmg = 0) {
  const c = poolCard(id);
  c.justPlayed = false;
  c.curHp -= dmg;
  state[side].board[lane] = c;
  return c;
}

export function shotState(name, seed = 1) {
  const s = newDuel(seed);
  if (name === 'title') { s.screen = 'title'; return s; }
  s.screen = 'duel';
  if (name === 'battle') {
    s.turn = 4;
    s.player.life = 14; s.rival.life = 11;
    s.player.manaMax = 4; s.player.mana = 3;
    s.rival.manaMax = 4; s.rival.mana = 1;
    place(s, 'rival', 0, 'reef-archer');
    place(s, 'rival', 1, 'tide-serpent', 1);
    place(s, 'player', 1, 'briar-brute', 2);
    place(s, 'player', 2, 'dawn-squire');
    s.player.hand = [poolCard('ember-bolt'), poolCard('gilded-lancer'), poolCard('wild-growth'), poolCard('cinder-imp'), poolCard('mist-caller')];
    s.rival.hand = [poolCard('moss-pup'), poolCard('ash-duelist'), poolCard('undertow')];
    s.player.playedSigils = ['ember', 'ember'];
    s.selectedHand = 1;
    s.message = 'Gilded Lancer selected - click a lane to deploy her.';
    computeIntent(s);
    return s;
  }
  if (name === 'victory') {
    s.turn = 7; s.rival.life = 0; s.player.life = 9;
    s.screen = 'victory'; s.winner = 'player'; s.phase = 'over';
    return s;
  }
  // defeat
  s.turn = 6; s.player.life = 0; s.rival.life = 6;
  s.screen = 'defeat'; s.winner = 'rival'; s.phase = 'over';
  return s;
}

export function isShotMode(params) { return params.has('shot'); }
