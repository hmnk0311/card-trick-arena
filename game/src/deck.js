// deck.js - the card pool and deck building for Ember Sigil Duel.
// Creatures carry cost / attack / health and one trait printed on the
// card: SWIFT (attacks the turn it lands), ARMORED n (ignores the
// first n damage each hit) or RALLY (allies in its lane gain +1
// attack while it stands). Spells are one-shot sigil tricks.
// Resonance: the second card of the same sigil you play in one turn
// resonates - creatures gain +1/+1, spells strike or mend harder.

export const TRAITS = {
  swift:   { label: 'SWIFT',    text: 'Attacks the turn it lands.' },
  armored: { label: 'ARMORED',  text: 'Ignores 1 damage from each hit.' },
  rally:   { label: 'RALLY',    text: 'Lane allies have +1 attack.' },
};

export const CARD_POOL = [
  // Sun - gold disc: steady knights and healing light.
  { id: 'dawn-squire',   kind: 'creature', sigil: 'sun',   name: 'Dawn Squire',    cost: 1, atk: 2, hp: 2, trait: null },
  { id: 'sunshield',     kind: 'creature', sigil: 'sun',   name: 'Sunshield Nun',  cost: 2, atk: 1, hp: 5, trait: 'armored' },
  { id: 'gilded-lancer', kind: 'creature', sigil: 'sun',   name: 'Gilded Lancer',  cost: 3, atk: 4, hp: 3, trait: 'swift' },
  { id: 'choir-captain', kind: 'creature', sigil: 'sun',   name: 'Choir Captain',  cost: 4, atk: 3, hp: 5, trait: 'rally' },
  { id: 'solar-judgment',kind: 'spell',    sigil: 'sun',   name: 'Solar Verdict',  cost: 3, text: 'Deal 3 to a creature, or mend your life by 4.', spell: 'verdict' },
  // Tide - blue drop: serpents, bounce and card flow.
  { id: 'puddle-sprite', kind: 'creature', sigil: 'tide',  name: 'Puddle Sprite',  cost: 1, atk: 1, hp: 3, trait: null },
  { id: 'reef-archer',   kind: 'creature', sigil: 'tide',  name: 'Reef Archer',    cost: 2, atk: 3, hp: 2, trait: null },
  { id: 'tide-serpent',  kind: 'creature', sigil: 'tide',  name: 'Tide Serpent',   cost: 4, atk: 5, hp: 4, trait: 'swift' },
  { id: 'mist-caller',   kind: 'creature', sigil: 'tide',  name: 'Mist Caller',    cost: 3, atk: 2, hp: 4, trait: 'rally' },
  { id: 'undertow',      kind: 'spell',    sigil: 'tide',  name: 'Undertow',       cost: 2, text: 'Deal 2 to a creature and draw a card.', spell: 'undertow' },
  // Grove - green leaf: growth and thick health.
  { id: 'moss-pup',      kind: 'creature', sigil: 'grove', name: 'Moss Pup',       cost: 1, atk: 1, hp: 4, trait: null },
  { id: 'briar-brute',   kind: 'creature', sigil: 'grove', name: 'Briar Brute',    cost: 3, atk: 3, hp: 6, trait: 'armored' },
  { id: 'elder-treant',  kind: 'creature', sigil: 'grove', name: 'Elder Treant',   cost: 5, atk: 5, hp: 7, trait: null },
  { id: 'grove-warden',  kind: 'creature', sigil: 'grove', name: 'Grove Warden',   cost: 2, atk: 2, hp: 3, trait: 'rally' },
  { id: 'wild-growth',   kind: 'spell',    sigil: 'grove', name: 'Wild Growth',    cost: 2, text: 'Give a creature +2/+2.', spell: 'growth' },
  // Ember - red flame: cheap aggression and direct fire.
  { id: 'cinder-imp',    kind: 'creature', sigil: 'ember', name: 'Cinder Imp',     cost: 1, atk: 3, hp: 1, trait: null },
  { id: 'ash-duelist',   kind: 'creature', sigil: 'ember', name: 'Ash Duelist',    cost: 2, atk: 3, hp: 3, trait: 'swift' },
  { id: 'magma-golem',   kind: 'creature', sigil: 'ember', name: 'Magma Golem',    cost: 4, atk: 6, hp: 3, trait: 'armored' },
  { id: 'pyre-herald',   kind: 'creature', sigil: 'ember', name: 'Pyre Herald',    cost: 3, atk: 4, hp: 2, trait: 'rally' },
  { id: 'ember-bolt',    kind: 'spell',    sigil: 'ember', name: 'Ember Bolt',     cost: 1, text: 'Deal 2 to any creature or duelist.', spell: 'bolt' },
];

// Deterministic RNG (mulberry32) so staged screenshots and tests are
// reproducible from a seed.
export function rng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let uidCounter = 1;
export function instantiate(def) {
  return { ...def, uid: uidCounter++, curHp: def.hp ?? 0, curAtk: def.atk ?? 0, justPlayed: true, resonated: false };
}

export function buildDeck(seed, copies = 2) {
  const rand = rng(seed);
  const cards = [];
  for (const def of CARD_POOL) for (let i = 0; i < copies; i++) cards.push(instantiate(def));
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
