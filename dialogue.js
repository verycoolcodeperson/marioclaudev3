// ---------------------------------------------------------------------------
// All story text lives here - short dialogue-box scripts keyed by moment.
// Each line: { character, name, text }. `character` picks the portrait
// (see entities/Face.js CHARACTER_FACES).
// ---------------------------------------------------------------------------

export const GAME_INTRO = [
  { character: 'peach', name: 'Peach', text: 'Mario! The Power Stars are vanishing from every kingdom!' },
  { character: 'toad', name: 'Toad', text: 'Whole worlds are losing their sparkle without them!' },
  { character: 'peach', name: 'Peach', text: 'Someone - or something - is behind this. Please, find out who!' },
  { character: 'mario', name: 'Mario', text: "Let's-a go! I'll bring those Stars home." },
  { character: 'toad', name: 'Toad', text: 'Walk up to a World gate to begin your adventure. Good luck!' },
];

export const WORLD_INTRO = {
  1: [
    { character: 'toad', name: 'Toad', text: 'Greenhorn Fields used to sparkle with Stars, now it\'s gone quiet.' },
    { character: 'mario', name: 'Mario', text: "Time to wake this place up!" },
  ],
  2: [
    { character: 'peach', name: 'Peach', text: 'Reports say strange footprints lead into the Dustdune Wastes...' },
    { character: 'mario', name: 'Mario', text: 'Sandy shoes, here I come.' },
  ],
  3: [
    { character: 'luigi', name: 'Luigi', text: 'B-b-bro, it\'s freezing up here in Frostpeak Range!' },
    { character: 'mario', name: 'Mario', text: 'Bundle up, Luigi - we\'ve got Stars to save!' },
  ],
  4: [
    { character: 'toad', name: 'Toad', text: 'Mossglow Woods is getting awfully overgrown without its Stars.' },
    { character: 'mario', name: 'Mario', text: "Let's clear a path!" },
  ],
  5: [
    { character: 'peach', name: 'Peach', text: 'The tides at Coral Cove have gone wild - something\'s stirring the sea.' },
    { character: 'mario', name: 'Mario', text: 'Time for a swim, then!' },
  ],
  6: [
    { character: 'toad', name: 'Toad', text: 'Cinderpeak Caldera... even I\'m too scared to go near there!' },
    { character: 'mario', name: 'Mario', text: "I've got this, Toad. Stay safe!" },
  ],
  7: [
    { character: 'luigi', name: 'Luigi', text: 'The clouds over Cloudtop Heights look... angry.' },
    { character: 'mario', name: 'Mario', text: 'We\'re getting close now, I can feel it.' },
  ],
  8: [
    { character: 'bowser', name: 'Bowser', text: 'GWAHAHA! So you finally made it to MY castle!' },
    { character: 'mario', name: 'Mario', text: 'Bowser?! I should have known!' },
    { character: 'bowser', name: 'Bowser', text: 'Every last Star is mine now. Turn back while you still can!' },
    { character: 'mario', name: 'Mario', text: 'Not a chance. Those Stars belong to everyone!' },
  ],
};

export const WORLD_OUTRO = {
  1: [
    { character: 'toad', name: 'Toad', text: 'You did it! Greenhorn Fields is glowing again!' },
    { character: 'peach', name: 'Peach', text: 'But this was just the beginning, Mario. Keep going!' },
  ],
  2: [
    { character: 'mario', name: 'Mario', text: 'Phew! That Sphinx sure didn\'t want to give up its Stars.' },
    { character: 'toad', name: 'Toad', text: 'Onward - the trail keeps going!' },
  ],
  3: [
    { character: 'luigi', name: 'Luigi', text: 'You melted the Yeti\'s heart! Well... sort of.' },
    { character: 'mario', name: 'Mario', text: 'On to the next one!' },
  ],
  4: [
    { character: 'toad', name: 'Toad', text: 'The Woods feel alive again! Thank you, Mario!' },
    { character: 'peach', name: 'Peach', text: 'I\'m starting to sense a pattern to all this...' },
  ],
  5: [
    { character: 'peach', name: 'Peach', text: 'The Kraken was guarding something for someone bigger...' },
    { character: 'mario', name: 'Mario', text: 'Bowser. It\'s always Bowser.' },
  ],
  6: [
    { character: 'mario', name: 'Mario', text: 'That Golem nearly roasted my mustache!' },
    { character: 'toad', name: 'Toad', text: 'Just a little further, Mario - stay strong!' },
  ],
  7: [
    { character: 'luigi', name: 'Luigi', text: 'The Griffin\'s down! Bowser\'s castle is straight ahead...' },
    { character: 'mario', name: 'Mario', text: 'This ends today.' },
  ],
  8: [
    { character: 'bowser', name: 'Bowser', text: 'IMPOSSIBLE! My castle... my Stars...!' },
    { character: 'mario', name: 'Mario', text: 'Game over, Bowser. Give the Stars back!' },
  ],
};

export const ENDING_DIALOGUE = [
  { character: 'bowser', name: 'Bowser', text: "Fine, FINE! Take your sparkly rocks! This isn't over, Mario!" },
  { character: 'peach', name: 'Peach', text: 'Mario, you did it! Every Star is back where it belongs!' },
  { character: 'toad', name: 'Toad', text: 'Hooray for Mario! The whole kingdom is sparkling again!' },
  { character: 'luigi', name: 'Luigi', text: 'We make a great team, bro. ...Next time I\'m coming too!' },
  { character: 'peach', name: 'Peach', text: 'Thank you, Mario. Adventure of the Stars, indeed.' },
  { character: 'mario', name: 'Mario', text: "That's-a wrap! ...Until next time." },
];
