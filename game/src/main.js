// main.js - bootstrap: canvas, the frame loop, phase timing.
// The rival's turn runs on a timer after your Clash so you can watch
// your own attack land first; floaters and clash flashes age in the
// loop and the shake decays. Screenshot mode (?shot=) freezes one
// staged frame and stops the timers.

import { newDuel, finishRivalTurn, checkEnd } from './state.js';
import { runRivalTurn, computeIntent } from './ai.js';
import { render } from './render.js';
import { handleClick, handleKey } from './input.js';
import { shotState, isShotMode } from './shots.js';
import { CARD_POOL } from './deck.js';
import { instantiate } from './deck.js';
import { sfx } from './audio.js';

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(location.search);
const shotMode = isShotMode(params);

const ui = {
  buttons: {
    start: { x: 490, y: 664, w: 300, h: 54 },
    endTurn: { x: 1036, y: 640, w: 220, h: 52 },
  },
  titleFan: ['sunshield', 'tide-serpent', 'elder-treant', 'ember-bolt', 'choir-captain'].map(
    (id) => instantiate(CARD_POOL.find((c) => c.id === id)),
  ),
};

let state = shotMode ? shotState(params.get('shot'), Number(params.get('seed') || 1)) : newDuel(1);
if (!shotMode) computeIntent(state);
let rivalTimer = null;

function onPhaseChange(what) {
  if (what === 'restart') {
    state = newDuel((Math.random() * 1e9) | 0);
    computeIntent(state);
    return;
  }
  if (what === 'clash') {
    if (state.phase === 'over') { if (state.winner === 'player') sfx.win(); else sfx.lose(); return; }
    rivalTimer = setTimeout(() => {
      runRivalTurn(state);
      if (!checkEnd(state)) finishRivalTurn(state);
      else if (state.winner === 'player') sfx.win(); else sfx.lose();
      computeIntent(state);
    }, 900);
  }
}

canvas.addEventListener('click', (ev) => {
  const rect = canvas.getBoundingClientRect();
  const x = (ev.clientX - rect.left) * (canvas.width / rect.width);
  const y = (ev.clientY - rect.top) * (canvas.height / rect.height);
  handleClick(state, ui, x, y, onPhaseChange);
});
window.addEventListener('keydown', (ev) => handleKey(state, ui, ev.key, onPhaseChange));

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  for (const f of state.floaters) f.t += dt;
  state.floaters = state.floaters.filter((f) => f.t < 1.15);
  for (const m of state.clashMarks) m.t += dt;
  state.clashMarks = state.clashMarks.filter((m) => m.t < 0.65);
  if (state.shake) state.shake = Math.max(0, state.shake - dt * 14);
  render(ctx, state, ui);
  if (!shotMode) requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
