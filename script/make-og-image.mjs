/**
 * Generates the social preview card at assets/img/og.png.
 *
 * head.html already emits og:title, og:description and og:url, but declared no
 * image, so links to the handbook unfurled without a card.
 *
 * The emblem is read from assets/img/emblem.svg so the card stays in step with
 * it. Colours are the theme's own: $bg, $t2-teal-dark, $t2-teal-bright.
 *
 * Run from the repo root with a checkout that has sharp available:
 *   node script/make-og-image.mjs
 */
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const WIDTH = 1200;
const HEIGHT = 630;

const BG = '#04090a';
const BG_RAISED = '#071214';
const TEAL_BRIGHT = '#06f5d7';
const TEAL_MID = '#3cb4b4';
const TEAL_DARK = '#3c8c8c';
const PALE = '#a9d7fa';
const RULE = 'rgba(6,245,215,0.34)';

const STACK = "'Segoe UI Semibold','Segoe UI',Arial,Helvetica,sans-serif";

const emblem = readFileSync('assets/img/emblem.svg', 'utf8');
const emblemGroup = emblem.slice(emblem.indexOf('<g '), emblem.lastIndexOf('</svg>'));

const card = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="ground" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${BG_RAISED}"/>
      <stop offset="1" stop-color="${BG}"/>
    </linearGradient>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#ground)"/>

  <g transform="translate(96 129) scale(0.372)">
    ${emblemGroup}
  </g>

  <text x="500" y="238" font-family="${STACK}" font-size="88" font-weight="700"
        letter-spacing="5" fill="${TEAL_BRIGHT}">TRIBES 2</text>
  <text x="503" y="300" font-family="${STACK}" font-size="35" font-weight="600"
        letter-spacing="5" fill="${PALE}">MOD DEVELOPMENT</text>
  <text x="503" y="346" font-family="${STACK}" font-size="35" font-weight="600"
        letter-spacing="5" fill="${PALE}">HANDBOOK</text>

  <line x1="503" y1="392" x2="1104" y2="392" stroke="${RULE}" stroke-width="3"/>

  <text x="503" y="446" font-family="${STACK}" font-size="26" fill="${TEAL_DARK}">Writing mods against vanilla</text>
  <text x="503" y="480" font-family="${STACK}" font-size="26" fill="${TEAL_DARK}">Tribes 2 — the V12 engine, the</text>
  <text x="503" y="514" font-family="${STACK}" font-size="26" fill="${TEAL_DARK}">community patches, TorqueScript</text>

  <text x="503" y="566" font-family="${STACK}" font-size="28" font-weight="600"
        letter-spacing="2" fill="${TEAL_MID}">modding.tribes2wiki.com</text>

  <rect x="0" y="${HEIGHT - 8}" width="${WIDTH}" height="8" fill="${TEAL_BRIGHT}"/>
</svg>`;

await sharp(Buffer.from(card), { density: 200 }).resize(WIDTH, HEIGHT).png().toFile('assets/img/og.png');
console.log('Wrote assets/img/og.png (%dx%d)', WIDTH, HEIGHT);
