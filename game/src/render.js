// render.js - every pixel of Ember Sigil Duel on one canvas.
// Screens: title (hero card fan, big sigils, How to Duel panel),
// table (rival hand face-down with counts, both boards, your fanned
// hand, life orbs, mana crystals, resonance meter, intent banner,
// phase tracker), victory (burst, spoils, stats) and defeat (the
// cracked orb, what Mistral did, the rematch button).

import { W, H, SIGILS, INK, INK_DIM, GOLD, CARD_W, CARD_H, HAND_W, HAND_H, LANES, LANE_W, ENEMY_BOARD_Y, PLAYER_BOARD_Y } from './config.js';
import { TRAITS } from './deck.js';
import { laneAttack, resonates } from './state.js';
import { intentText } from './ai.js';

export function drawSigil(ctx, sigil, x, y, r) {
  // Silhouettes differ at a glance, even in grayscale: Sun is a plain
  // disc, Tide a round droplet, Grove a leaf on a stem, and Ember a
  // three-tongued flame - never three lookalike pointed ovals.
  const s = SIGILS[sigil];
  ctx.save();
  ctx.fillStyle = s.color; ctx.strokeStyle = s.dark; ctx.lineWidth = 2;
  ctx.beginPath();
  if (s.shape === 'disc') { ctx.arc(x, y, r, 0, Math.PI * 2); }
  else if (s.shape === 'drop') { ctx.moveTo(x, y - r); ctx.bezierCurveTo(x + r * 0.95, y + r * 0.25, x + r * 0.62, y + r, x, y + r); ctx.bezierCurveTo(x - r * 0.62, y + r, x - r * 0.95, y + r * 0.25, x, y - r); }
  else if (s.shape === 'leaf') { ctx.moveTo(x, y - r); ctx.bezierCurveTo(x + r, y - r * 0.2, x + r * 0.7, y + r * 0.7, x, y + r * 0.8); ctx.bezierCurveTo(x - r * 0.7, y + r * 0.7, x - r, y - r * 0.2, x, y - r); }
  else {
    // Ember: three flame tongues.
    ctx.moveTo(x, y + r);
    ctx.bezierCurveTo(x - r * 0.9, y + r * 0.5, x - r * 0.75, y - r * 0.1, x - r * 0.42, y - r * 0.42);
    ctx.bezierCurveTo(x - r * 0.30, y - r * 0.05, x - r * 0.22, y + r * 0.05, x - r * 0.10, y - r * 0.15);
    ctx.bezierCurveTo(x - r * 0.02, y - r * 0.55, x + r * 0.05, y - r * 0.8, x, y - r);
    ctx.bezierCurveTo(x + r * 0.28, y - r * 0.55, x + r * 0.34, y - r * 0.25, x + r * 0.44, y - r * 0.48);
    ctx.bezierCurveTo(x + r * 0.85, y - r * 0.05, x + r * 0.9, y + r * 0.5, x, y + r);
  }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  if (s.shape === 'leaf') {
    ctx.beginPath(); ctx.moveTo(x, y + r * 0.8); ctx.quadraticCurveTo(x + r * 0.15, y + r * 0.1, x, y - r * 0.75);
    ctx.strokeStyle = s.dark; ctx.lineWidth = 2; ctx.stroke();
  }
  ctx.restore();
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function portrait(ctx, card, x, y, w, h) {
  // A bold silhouette with an identity, not just the suit token:
  // creatures stand as a hooded figure in their sigil's dark colour
  // (a SWIFT blade, an ARMORED shield or a RALLY banner by trait),
  // spells burst as an eight-point star.
  const cx = x + w / 2, cy = y + h / 2;
  const s = SIGILS[card.sigil];
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  rr(ctx, x, y, w, h, 8); ctx.fill();
  if (card.kind === 'spell') {
    ctx.fillStyle = s.dark;
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2, rad = i % 2 ? h * 0.16 : h * 0.34;
      const px = cx + Math.cos(a) * rad, py = cy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    drawSigil(ctx, card.sigil, cx, cy, h * 0.15);
  } else {
    ctx.fillStyle = s.dark;
    ctx.beginPath(); ctx.arc(cx, cy - h * 0.18, h * 0.16, 0, Math.PI * 2); ctx.fill(); // head
    ctx.beginPath(); // shoulders and robe
    ctx.moveTo(cx - w * 0.26, cy + h * 0.42);
    ctx.quadraticCurveTo(cx, cy - h * 0.18, cx + w * 0.26, cy + h * 0.42);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = s.dark; ctx.lineWidth = 4; ctx.lineCap = 'round';
    if (card.trait === 'swift') { ctx.beginPath(); ctx.moveTo(cx + w * 0.10, cy + h * 0.30); ctx.lineTo(cx + w * 0.34, cy - h * 0.28); ctx.stroke(); }
    if (card.trait === 'rally') { ctx.beginPath(); ctx.moveTo(cx - w * 0.30, cy + h * 0.38); ctx.lineTo(cx - w * 0.30, cy - h * 0.34); ctx.stroke(); ctx.fillStyle = s.color; ctx.fillRect(cx - w * 0.30, cy - h * 0.34, w * 0.20, h * 0.16); }
    if (card.trait === 'armored') { ctx.beginPath(); ctx.arc(cx + w * 0.28, cy + h * 0.05, h * 0.17, 0, Math.PI * 2); ctx.fillStyle = s.color; ctx.fill(); ctx.stroke(); }
    drawSigil(ctx, card.sigil, cx, cy + h * 0.13, h * 0.11);
  }
  ctx.restore();
}

export function drawCard(ctx, card, x, y, w = CARD_W, h = CARD_H, opts = {}) {
  const s = SIGILS[card.sigil];
  ctx.save();
  if (opts.lift) { ctx.shadowColor = 'rgba(242,182,60,.8)'; ctx.shadowBlur = 22; ctx.translate(0, -10); }
  rr(ctx, x, y, w, h, 12);
  ctx.fillStyle = '#f7efdb'; ctx.fill();
  ctx.lineWidth = opts.selected ? 5 : 3; ctx.strokeStyle = opts.selected ? GOLD : s.dark; ctx.stroke();
  ctx.shadowBlur = 0;
  // Frame band in the sigil colour.
  rr(ctx, x + 4, y + 4, w - 8, 30, 8); ctx.fillStyle = s.color; ctx.fill();
  ctx.fillStyle = '#241539'; ctx.font = `bold ${Math.round(w * 0.105)}px system-ui`; ctx.textAlign = 'left';
  ctx.fillText(card.name, x + 26, y + 26, w - 58);
  drawSigil(ctx, card.sigil, x + w - 20, y + 19, 11);
  portrait(ctx, card, x + 10, y + 40, w - 20, h * 0.34);
  // Cost gem, top-left, overlapping the frame.
  ctx.beginPath(); ctx.arc(x + 2, y + 2, 17, 0, Math.PI * 2);
  ctx.fillStyle = '#3fa7e0'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#eaf6ff'; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 21px system-ui'; ctx.textAlign = 'center';
  ctx.fillText(String(card.cost), x + 2, y + 10);
  ctx.fillStyle = '#33254f'; ctx.textAlign = 'left';
  if (card.kind === 'creature') {
    ctx.font = '11px system-ui';
    const trait = card.trait ? TRAITS[card.trait] : null;
    ctx.fillText(trait ? `${trait.label} - ${trait.text}` : 'A sigil creature of the duel table.', x + 10, y + h * 0.60, w - 20);
    if (card.resonated) { ctx.fillStyle = '#b3541e'; ctx.font = 'bold 11px system-ui'; ctx.fillText('★ RESONATED +1/+1', x + 10, y + h * 0.60 + 15); }
    // Attack sword bottom-left, health heart bottom-right: huge.
    // Board creatures show their EFFECTIVE attack (RALLY included),
    // the number combat will actually use.
    ctx.font = 'bold 30px system-ui';
    ctx.fillStyle = '#b3372a'; ctx.fillText(`⚔${opts.effAtk ?? card.curAtk}`, x + 8, y + h - 10);
    ctx.fillStyle = '#2e7d46'; ctx.textAlign = 'right'; ctx.fillText(`♥${card.curHp}`, x + w - 8, y + h - 10);
  } else {
    ctx.font = '12px system-ui';
    wrapText(ctx, card.text, x + 10, y + h * 0.60, w - 20, 15);
    ctx.font = 'bold 13px system-ui'; ctx.fillStyle = s.dark; ctx.textAlign = 'center';
    ctx.fillText('✦ SPELL ✦', x + w / 2, y + h - 12);
  }
  if (opts.dim) {
    // Unaffordable: keep the cream face readable, veil the whole
    // card instead of repainting it a muddy colour.
    rr(ctx, x, y, w, h, 12); ctx.fillStyle = 'rgba(23,17,43,0.48)'; ctx.fill();
    ctx.fillStyle = '#ffd9d0'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(`NEED ${card.cost} MANA`, x + w / 2, y + h - 26);
  }
  ctx.restore();
}

function wrapText(ctx, text, x, y, maxW, lh) {
  const words = text.split(' '); let line = '', yy = y;
  for (const word of words) {
    if (ctx.measureText(line + word).width > maxW && line) { ctx.fillText(line, x, yy); yy += lh; line = ''; }
    line += word + ' ';
  }
  ctx.fillText(line, x, yy);
}

export function cardBack(ctx, x, y, w, h) {
  ctx.save();
  rr(ctx, x, y, w, h, 10); ctx.fillStyle = '#37265e'; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = GOLD; ctx.stroke();
  if (w < 80) { drawSigil(ctx, 'ember', x + w / 2, y + h / 2, 15); }
  else {
    drawSigil(ctx, 'sun', x + w / 2 - 24, y + h / 2, 13);
    drawSigil(ctx, 'tide', x + w / 2 + 24, y + h / 2, 13);
    drawSigil(ctx, 'grove', x + w / 2, y + h / 2 - 24, 13);
    drawSigil(ctx, 'ember', x + w / 2, y + h / 2 + 24, 13);
  }
  ctx.restore();
}

function lifeOrb(ctx, x, y, life, label, color) {
  ctx.save();
  const grad = ctx.createRadialGradient(x - 12, y - 14, 6, x, y, 44);
  grad.addColorStop(0, '#fff3f0'); grad.addColorStop(0.35, color); grad.addColorStop(1, '#571d16');
  ctx.beginPath(); ctx.arc(x, y, 42, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = GOLD; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 34px system-ui'; ctx.textAlign = 'center';
  ctx.fillText(String(Math.max(0, life)), x, y + 4);
  ctx.font = 'bold 12px system-ui'; ctx.fillText('LIFE', x, y + 24);
  ctx.fillStyle = INK; ctx.font = 'bold 14px system-ui';
  ctx.fillText(label, x, y - 56);
  ctx.restore();
}

function manaRow(ctx, x, y, mana, max) {
  ctx.save();
  ctx.fillStyle = INK_DIM; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'left';
  ctx.fillText('MANA', x, y - 8);
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    const cx = x + 12 + i * 26, cy = y + 14;
    ctx.moveTo(cx, cy - 12); ctx.lineTo(cx + 9, cy); ctx.lineTo(cx, cy + 12); ctx.lineTo(cx - 9, cy); ctx.closePath();
    ctx.fillStyle = i < mana ? '#57c8f2' : (i < max ? '#2c4a63' : 'rgba(255,255,255,0.08)');
    ctx.fill(); ctx.strokeStyle = '#bdeaff'; ctx.lineWidth = 1; ctx.stroke();
  }
  ctx.restore();
}

export function render(ctx, state, ui) {
  ctx.save();
  if (state.shake) ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#2e2150'); grad.addColorStop(1, '#1d1436');
  ctx.fillStyle = grad; ctx.fillRect(-12, -12, W + 24, H + 24);
  if (state.screen === 'title') drawTitle(ctx, state, ui);
  else if (state.screen === 'victory') drawEnd(ctx, state, true);
  else if (state.screen === 'defeat') drawEnd(ctx, state, false);
  else drawTable(ctx, state, ui);
  ctx.restore();
}

function drawTitle(ctx, state, ui) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = GOLD; ctx.font = 'bold 64px system-ui';
  ctx.fillText('EMBER SIGIL DUEL', W / 2, 118);
  ctx.fillStyle = INK; ctx.font = '22px system-ui';
  ctx.fillText('An original 3-lane card duel of sun, tide, grove and ember', W / 2, 156);
  // Hero fan of real cards from the pool.
  const fan = ui.titleFan;
  fan.forEach((card, i) => {
    ctx.save();
    ctx.translate(W / 2 + (i - 2) * 128, 268);
    ctx.rotate((i - 2) * 0.10);
    drawCard(ctx, card, -CARD_W / 2, -60, CARD_W, CARD_H, { lift: i === 2 });
    ctx.restore();
  });
  // How to Duel panel.
  rr(ctx, 290, 486, 700, 150, 14); ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.fill(); ctx.strokeStyle = GOLD; ctx.stroke();
  ctx.fillStyle = INK; ctx.font = 'bold 19px system-ui'; ctx.fillText('HOW TO DUEL', W / 2, 518);
  ctx.font = '16px system-ui'; ctx.fillStyle = INK_DIM;
  ctx.fillText('Click a card, then a lane. Creatures clash down their lane -', W / 2, 548);
  ctx.fillText('an empty lane means the blow hits the rival LIFE orb. First orb to 0 falls.', W / 2, 574);
  ctx.fillText('Play two cards of one sigil in a turn and the second RESONATES +1/+1.', W / 2, 600);
  button(ctx, ui.buttons.start, '▶  START THE DUEL', '#b3372a');
  ctx.fillStyle = INK_DIM; ctx.font = '13px system-ui';
  ctx.fillText('Mouse: select & place - Keys 1-7 pick a card, Q/W/E pick a lane, Enter ends the turn', W / 2, 742);
  ctx.restore();
}

export function button(ctx, rect, label, color) {
  ctx.save();
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = GOLD; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 20px system-ui'; ctx.textAlign = 'center';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 7);
  ctx.restore();
}

function drawTable(ctx, state, ui) {
  const p = state.player, r = state.rival;
  // Rival hand: face-down backs with a count badge.
  r.hand.forEach((_, i) => cardBack(ctx, 430 + i * 62, 6, 54, 74));
  ctx.fillStyle = INK; ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'left';
  ctx.fillText(`MISTRAL'S HAND: ${r.hand.length} cards`, 430, 100);
  lifeOrb(ctx, 1130, 108, r.life, 'MISTRAL', '#e4573d');
  lifeOrb(ctx, 1130, 520, p.life, 'YOU', '#57b96a');
  manaRow(ctx, 1064, 596, p.mana, p.manaMax);
  ctx.fillStyle = INK_DIM; ctx.font = '13px system-ui';
  ctx.fillText(`Rival mana ${r.mana}/${r.manaMax} - Rival deck ${r.deck.length} - Your deck ${p.deck.length}`, 24, 100);

  // Intent banner: the rival's coming clash, readable at a glance.
  rr(ctx, 356, 118, 700, 34, 9); ctx.fillStyle = 'rgba(180,40,30,0.35)'; ctx.fill(); ctx.strokeStyle = '#e4573d'; ctx.stroke();
  ctx.fillStyle = '#ffd9d0'; ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'center';
  ctx.fillText('⚠ ' + intentText(state), 706, 141);

  // Phase tracker + turn, stacked in the left column.
  ctx.textAlign = 'left'; ctx.font = 'bold 15px system-ui';
  ctx.fillStyle = INK; ctx.fillText(`TURN ${state.turn}`, 24, 130);
  const phases = ['1 DRAW & FORGE', '2 PLAY', '3 CLASH'];
  phases.forEach((label, i) => {
    ctx.fillStyle = (state.phase === 'play' && i === 1) || (state.phase !== 'play' && i === 2) ? GOLD : INK_DIM;
    ctx.fillText(((state.phase === 'play' && i === 1) || (state.phase !== 'play' && i === 2) ? '● ' : '○ ') + label, 24, 158 + i * 22);
  });

  // Lanes: gems, slots, boards.
  LANES.forEach((lane, l) => {
    for (const [y, side] of [[ENEMY_BOARD_Y, r], [PLAYER_BOARD_Y, p]]) {
      rr(ctx, lane.x, y, LANE_W, CARD_H, 12);
      ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fill();
      ctx.setLineDash([6, 6]); ctx.strokeStyle = 'rgba(244,236,216,0.35)'; ctx.stroke(); ctx.setLineDash([]);
      const c = side.board[l];
      if (c) {
        drawCard(ctx, c, lane.x + 14, y, CARD_W, CARD_H, { effAtk: laneAttack(side, l) });
      } else {
        drawSigil(ctx, ['sun', 'tide', 'grove'][l], lane.x + LANE_W / 2, y + CARD_H / 2, 20);
        ctx.fillStyle = INK_DIM; ctx.font = '13px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(`LANE ${l + 1}`, lane.x + LANE_W / 2, y + CARD_H / 2 + 44);
      }
    }
  });

  // Clash flashes and damage floaters.
  for (const m of state.clashMarks) {
    ctx.save(); ctx.globalAlpha = Math.max(0, 1 - m.t / 0.6);
    ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 6;
    const x = LANES[m.lane].x + LANE_W / 2;
    ctx.beginPath(); ctx.moveTo(x, m.side === 'player' ? 560 : 240); ctx.lineTo(x, m.side === 'player' ? 240 : 560); ctx.stroke();
    ctx.restore();
  }
  ctx.font = 'bold 24px system-ui'; ctx.textAlign = 'center';
  for (const f of state.floaters) {
    ctx.save(); ctx.globalAlpha = Math.max(0, 1 - f.t / 1.1);
    ctx.fillStyle = f.color;
    if (f.side === 'face-rival' || f.side === 'face-player') {
      // Face damage lands on the orb itself, with a pulse ring.
      const oy = f.side === 'face-rival' ? 108 : 520;
      ctx.beginPath(); ctx.arc(1130, oy, 44 + f.t * 26, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillText(f.text, 1130, oy - 58 - f.t * 20);
    } else {
      const x = LANES[f.lane].x + LANE_W / 2;
      const y = (f.side === 'player' ? 560 : 240) - f.t * 34;
      ctx.fillText(f.text, x, y);
    }
    ctx.restore();
  }

  // Resonance meter: one pip per sigil played this turn.
  ctx.textAlign = 'left'; ctx.fillStyle = INK; ctx.font = 'bold 14px system-ui';
  ctx.fillText('RESONANCE - play 2 of a sigil:', 24, 648);
  Object.keys(SIGILS).forEach((sigil, i) => {
    const played = p.playedSigils.filter((s) => s === sigil).length;
    drawSigil(ctx, sigil, 36 + i * 40, 676, 13);
    ctx.fillStyle = played >= 2 ? GOLD : INK_DIM; ctx.font = 'bold 13px system-ui';
    ctx.fillText(played >= 2 ? '★' : `${played}/2`, 28 + i * 40, 702);
  });

  // Player hand, fanned, affordable cards bright, others dimmed.
  const totalW = p.hand.length * 126;
  p.hand.forEach((card, i) => {
    const x = W / 2 - totalW / 2 + i * 126 - 40;
    const y = 622 - (i === state.selectedHand ? 16 : 0);
    drawCard(ctx, card, x, y, HAND_W, HAND_H, { dim: card.cost > p.mana, selected: i === state.selectedHand, lift: i === state.selectedHand });
    ctx.fillStyle = INK_DIM; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(`[${i + 1}]`, x + HAND_W / 2, 622 + HAND_H + 16 - (i === state.selectedHand ? 16 : 0));
  });

  // Message line + End Turn.
  ctx.fillStyle = INK; ctx.font = '16px system-ui'; ctx.textAlign = 'left';
  ctx.fillText(state.pendingSpell ? `Choose a target for ${state.pendingSpell.name}: click any creature, a life orb, or your own creature.` : state.message, 24, 36);
  if (state.phase === 'play') button(ctx, ui.buttons.endTurn, 'END TURN ⚔ CLASH', '#b3372a');
  else { ctx.fillStyle = GOLD; ctx.font = 'bold 18px system-ui'; ctx.fillText(state.phase === 'clash' ? 'CLASH!' : 'MISTRAL PLAYS…', 1064, 668); }
}

function drawFinalTable(ctx, state) {
  // The table the duel ended on, kept under the result panel: both
  // boards, both hands and both orbs, so the end screens still show
  // a card game, not just a label.
  const p = state.player, r = state.rival;
  r.hand.forEach((_, i) => cardBack(ctx, 430 + i * 62, 6, 54, 74));
  p.hand.forEach((card, i) => drawCard(ctx, card, 380 + i * 126, 622, HAND_W, HAND_H, {}));
  LANES.forEach((lane, l) => {
    for (const [y, side] of [[ENEMY_BOARD_Y, r], [PLAYER_BOARD_Y, p]]) {
      const c = side.board[l];
      if (c) drawCard(ctx, c, lane.x + 14, y, CARD_W, CARD_H, { effAtk: laneAttack(side, l) });
    }
  });
  lifeOrb(ctx, 1130, 108, r.life, 'MISTRAL', '#e4573d');
  lifeOrb(ctx, 1130, 520, p.life, 'YOU', '#57b96a');
}

function drawEnd(ctx, state, won) {
  // The final table stays on screen; the verdict lives in a panel
  // in the empty left column, with the final life totals big.
  drawFinalTable(ctx, state);
  ctx.save();
  rr(ctx, 14, 150, 322, 480, 18);
  ctx.fillStyle = 'rgba(18,11,36,0.92)'; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = won ? GOLD : '#e4573d'; ctx.stroke();
  ctx.textAlign = 'center';
  const cx = 175;
  if (won) {
    ['sun', 'tide', 'grove', 'ember'].forEach((sigil, i) => drawSigil(ctx, sigil, 65 + i * 74, 196, 15));
    ctx.fillStyle = GOLD; ctx.font = 'bold 46px system-ui';
    ctx.fillText('VICTORY!', cx, 268);
    ctx.fillStyle = INK; ctx.font = '17px system-ui';
    ctx.fillText(`Mistral's orb shatters`, cx, 312);
    ctx.fillText(`on turn ${state.turn}.`, cx, 336);
    ctx.font = 'bold 21px system-ui'; ctx.fillStyle = '#57b96a';
    ctx.fillText(`YOU ${Math.max(0, state.player.life)}  -  MISTRAL 0`, cx, 386);
    ctx.font = '15px system-ui'; ctx.fillStyle = INK_DIM;
    ctx.fillText(`Cards left in your deck: ${state.player.deck.length}`, cx, 424);
    ctx.fillText('The winning board is', cx, 470);
    ctx.fillText('still on the table.', cx, 492);
  } else {
    ctx.strokeStyle = '#e4573d'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(cx, 216, 34, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 22, 192); ctx.lineTo(cx - 4, 218); ctx.lineTo(cx + 12, 198); ctx.lineTo(cx + 4, 244); ctx.stroke();
    ctx.fillStyle = '#e4573d'; ctx.font = 'bold 46px system-ui';
    ctx.fillText('DEFEAT', cx, 300);
    ctx.fillStyle = INK; ctx.font = '17px system-ui';
    ctx.fillText(`Your orb cracked`, cx, 344);
    ctx.fillText(`on turn ${state.turn}.`, cx, 368);
    ctx.font = 'bold 21px system-ui'; ctx.fillStyle = '#e4573d';
    ctx.fillText(`YOU 0  -  MISTRAL ${Math.max(0, state.rival.life)}`, cx, 418);
    ctx.font = '15px system-ui'; ctx.fillStyle = INK_DIM;
    ctx.fillText('Her Serpent and Golem', cx, 462);
    ctx.fillText('held the lanes. Watch the', cx, 484);
    ctx.fillText('threat banner and block', cx, 506);
    ctx.fillText('the named lane.', cx, 528);
  }
  button(ctx, { x: 35, y: 552, w: 280, h: 54 }, '↻  REMATCH', won ? '#2e7d46' : '#b3372a');
  ctx.restore();
}
