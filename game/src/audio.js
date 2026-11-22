// audio.js - tiny WebAudio chimes, no audio files: a soft pluck when
// a card lands, a low thud for a clash, a rising arpeggio on victory.
// Everything is synthesised, so the game stays fully offline.

let ctx = null;
function ac() {
  if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; } }
  return ctx;
}

function tone(freq, t0, dur, type = 'sine', gain = 0.06) {
  const a = ac(); if (!a) return;
  const o = a.createOscillator(); const g = a.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(gain, a.currentTime + t0);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + t0 + dur);
  o.connect(g); g.connect(a.destination);
  o.start(a.currentTime + t0); o.stop(a.currentTime + t0 + dur);
}

export const sfx = {
  place() { tone(520, 0, 0.12, 'triangle'); tone(780, 0.05, 0.12, 'triangle'); },
  clash() { tone(140, 0, 0.18, 'square', 0.05); tone(90, 0.02, 0.22, 'sine', 0.08); },
  spell() { tone(880, 0, 0.15, 'sine'); tone(1180, 0.07, 0.18, 'sine'); },
  win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.11, 0.24, 'triangle', 0.07)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.13, 0.26, 'triangle', 0.07)); },
};
