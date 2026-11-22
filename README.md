[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/hmnk0311/card-trick-arena/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/hmnk0311/card-trick-arena/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

# Ember Sigil Duel

An original 3-lane card duel for the desktop browser, built for
make.fun's "Make the best card game" bounty. No build step, no
network: open `game/index.html` from any static server and play.

## The game

You duel **Mistral** across three lanes. Both duelists have a
**20-point life orb** and a mana pool that grows by one crystal a
turn (the Draw & Forge phase).

- **Play** — click a card in your hand, then a lane. Creatures carry
  a mana cost, attack and health, and one of four **sigils** told
  apart by colour and shape: Sun (gold disc), Tide (blue drop),
  Grove (green leaf), Ember (red flame).
- **Traits** — SWIFT attacks the turn it lands, ARMORED ignores 1
  damage from each hit, RALLY gives lane allies +1 attack.
- **Resonance** — play two cards of one sigil in a single turn and
  the second resonates: creatures gain +1/+1, spells hit harder.
  The meter under the table tracks every sigil.
- **Clash** — at End Turn your board attacks down its lanes. A
  creature fights the creature facing it (combat is simultaneous);
  an empty lane means the blow lands on the rival's life orb.
- **Readable rival** — Mistral's intent banner names the exact card
  and lane she will strike with next, so you can block that lane,
  remove the creature, or race her. She plays her biggest creature
  into her weakest lane and holds Ember Bolt for creatures she
  cannot trade into.

First life orb to zero falls. Win and loss screens tally the duel
and offer a rematch.

Controls: mouse, or keys 1-7 to pick a hand card, Q/W/E for lanes
1-3, Enter to end the turn, Esc to deselect.

## Layout

- `main.ts` — the entry program: copies `game/` and `screenshots/`
  to `/output` and writes `dossier.json` (caps match the scorer's).
- `game/src/config.js` — table geometry, palette, the four sigils.
- `game/src/deck.js` — the 20-card pool, traits, seeded decks.
- `game/src/state.js` — turns, mana, resonance, lane combat.
- `game/src/ai.js` — Mistral: her three rules and the intent banner.
- `game/src/render.js` — title, table, victory and defeat screens.
- `game/src/input.js` — mouse and keyboard control.
- `game/src/audio.js` — synthesised WebAudio chimes (no files).
- `game/src/shots.js` — staged scenes used for the screenshots.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

Run locally: `node serve.ts`, then open http://localhost:8080
Hand in: `MAKEFUN_OUTPUT_DIR=out node main.ts`
