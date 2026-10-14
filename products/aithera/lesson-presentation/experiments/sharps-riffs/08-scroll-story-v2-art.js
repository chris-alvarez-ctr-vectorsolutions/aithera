/* Riff 08 · V2 — illustration kit.
   One set of drawing rules for every scene, so the story reads as a single place:
   the same wall, floor, window light, people and props. Scenes are composed from
   these parts in 08-scroll-story-v2.js. Coordinates: viewBox 800×520, floor at y=400.
   Parts that move or change state keep the class names the page's CSS hooks into
   (.jc .arm .syr2 .syr3 .shaft .mote). */
(() => {
  'use strict';

  /* ---- shared definitions (gradients and symbols) -------------------------------- */
  const defsHTML = `
    <linearGradient id="wp" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="520"><stop offset="0" stop-color="#2b3b62"/><stop offset=".78" stop-color="#1b2644"/><stop offset="1" stop-color="#141c34"/></linearGradient>
    <linearGradient id="floorG" gradientUnits="userSpaceOnUse" x1="0" y1="400" x2="0" y2="760"><stop offset="0" stop-color="#1f2b4b"/><stop offset="1" stop-color="#0e152e"/></linearGradient>
    <linearGradient id="shaftG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe0ff" stop-opacity=".30"/><stop offset="1" stop-color="#cfe0ff" stop-opacity="0"/></linearGradient>
    <radialGradient id="shadowG"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <linearGradient id="binG" x1="0" x2="1"><stop offset="0" stop-color="#74839f"/><stop offset=".5" stop-color="#58668a"/><stop offset="1" stop-color="#3b4868"/></linearGradient>
    <linearGradient id="bagG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#43507c"/><stop offset=".6" stop-color="#252f52"/><stop offset="1" stop-color="#171e38"/></linearGradient>
    <linearGradient id="benchG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a70a6"/><stop offset="1" stop-color="#394b79"/></linearGradient>
    <linearGradient id="sbinG" x1="0" x2="1"><stop offset="0" stop-color="#ee6a77"/><stop offset=".45" stop-color="#d8404f"/><stop offset="1" stop-color="#9b2736"/></linearGradient>
    <linearGradient id="lidG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcf7a"/><stop offset="1" stop-color="#e69a2e"/></linearGradient>
    <linearGradient id="barrelG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f8ff"/><stop offset=".6" stop-color="#cdd9ef"/><stop offset="1" stop-color="#9fb0d2"/></linearGradient>
    <symbol id="bin" viewBox="0 0 100 130">
      <path d="M4 16H96L92 124a6 6 0 0 1-6 6H14a6 6 0 0 1-6-6Z" fill="url(#sbinG)"/>
      <path d="M13 24V122M87 24V122" stroke="#fff" stroke-opacity=".15" stroke-width="2"/>
      <rect x="11" y="106" width="78" height="3" fill="#000" opacity=".14"/>
      <rect x="-4" y="2" width="108" height="21" rx="7" fill="url(#lidG)"/>
      <rect x="22" y="9" width="56" height="7" rx="3.5" fill="#5a0f1b"/>
      <rect x="38" y="-4" width="24" height="9" rx="4.5" fill="#e69a2e"/>
      <text x="50" y="72" text-anchor="middle" font-family="Open Sans,sans-serif" font-weight="800" font-size="15" fill="#fff" letter-spacing="1">SHARPS</text>
      <path d="M50 84 l-10 17 h20z" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><rect x="48.4" y="89" width="3.2" height="6" rx="1.2" fill="#fff"/>
    </symbol>`;

  /* ---- the room: wall, window light, floor, motes ------------------------------------ */
  const room = ({ door = false } = {}) => {
    const win = [150, 400, 650].map(x => `
      <g><rect x="${x}" y="44" width="170" height="84" rx="4" fill="#86a6dc" opacity=".32"/><rect x="${x}" y="44" width="170" height="84" rx="4" fill="none" stroke="#141c38" stroke-width="5"/>
      <path d="M${x + 85} 44v84M${x} 86h170" stroke="#141c38" stroke-width="4"/></g>
      <polygon class="shaft" points="${x + 6},128 ${x + 164},128 ${x + 330},400 ${x + 120},400" fill="url(#shaftG)"/>
      <polygon points="${x + 120},400 ${x + 330},400 ${x + 380},470 ${x + 90},470" fill="#cfe0ff" opacity=".035"/>`).join('');
    const motes = [[210, 220, 0], [300, 300, -3], [470, 190, -5], [560, 280, -1.5], [700, 230, -4], [760, 330, -7]]
      .map(([x, y, d]) => `<circle class="mote" cx="${x}" cy="${y}" r="1.6" fill="#e6efff" style="animation-delay:${d}s"/>`).join('');
    const seams = Array.from({ length: 28 }, (_, i) => -1300 + i * 130).map(x => `M${x} 0V296`).join('');
    return `
      <path d="${seams}" stroke="#fff" stroke-opacity=".045" stroke-width="2"/>
      <rect x="-2400" y="296" width="5600" height="102" fill="#16203e"/><rect x="-2400" y="294" width="5600" height="6" fill="#2d3e69"/>
      ${win}
      ${door ? `<g><rect x="40" y="176" width="124" height="222" fill="#0d142b" stroke="#2d3e69" stroke-width="6"/><rect x="50" y="186" width="104" height="212" fill="#121b3a"/>
        <rect x="78" y="148" width="48" height="19" rx="3" fill="#0f3d36"/><text x="102" y="162" text-anchor="middle" font-family="Open Sans,sans-serif" font-size="10" font-weight="800" fill="#5cf5c8">EXIT</text></g>` : ''}
      <rect x="-2400" y="400" width="5600" height="1400" fill="url(#floorG)"/><rect x="-2400" y="396" width="5600" height="6" fill="#34476f"/>
      <rect x="-2400" y="470" width="5600" height="5" fill="#ffb547" opacity=".5"/>
      ${motes}`;
  };

  /* ---- people: side-on, facing right. The .arm group rotates from the shoulder. --------- */
  const figure = ({ hat = '#ffb547', vest = true, jacket = '#5a6d98', pants = '#2f3d63', skin = '#c99f7e', glove = '#2c5aa8', hair = '#2a2230', holding = false, pose = null } = {}) => `
    <g class="fig"><ellipse cx="2" cy="2" rx="24" ry="5" fill="url(#shadowG)"/>
    <g class="bobg">
      <rect x="-10" y="-54" width="11" height="52" rx="5" fill="${pants}"/><rect x="-1" y="-54" width="11" height="52" rx="5" fill="${pants}" opacity=".86"/>
      <path d="M-12 0h17a3 3 0 0 0 0-7H-12z" fill="#151c33"/><path d="M-2 0h17a3 3 0 0 0 0-7H-2z" fill="#151c33"/>
      <path d="M-14 -52C-17 -78-13 -96-5 -101h13c8 5 11 23 8 49z" fill="${jacket}"/>
      ${vest ? `<path d="M-12 -56C-14 -78-11 -94-5 -99h11c6 5 8 21 6 43z" fill="#ffb547" opacity=".94"/><rect x="-13" y="-76" width="25" height="4" fill="#eef3fb" opacity=".92"/><rect x="-13" y="-62" width="25" height="4" fill="#eef3fb" opacity=".92"/>` : ''}
      <rect x="-1" y="-105" width="6" height="7" fill="${skin}"/><circle cx="2" cy="-113" r="9" fill="${skin}"/>
      ${hat ? `<path d="M-8 -114a10.5 9.5 0 0 1 21 0z" fill="${hat}"/><rect x="-10" y="-115" width="28" height="3.4" rx="1.7" fill="${hat}" style="filter:brightness(.86)"/><path d="M-4 -120a8 6 0 0 1 8-3" stroke="#fff" stroke-opacity=".55" stroke-width="2" fill="none"/>`
             : `<path d="M-7 -114a9.5 9 0 0 1 19 0c-4-3-12-3-19 0z" fill="${hair}"/>`}
      <g transform="translate(3 -94)"><g class="arm"${pose ? ` style="transform:rotate(${pose.arm}deg)"` : ''}><rect x="-4.2" y="-2" width="8.5" height="38" rx="4.2" fill="${jacket}"/><circle cx="0" cy="38" r="5.6" fill="${glove}"/>${holding ? `<g class="held"${pose ? ` style="transform:translate(0px,38px) rotate(${pose.held}deg) translate(-3px,0px)"` : ''}>${syringeSm()}</g>` : ''}</g></g>
    </g></g>`;

  /* ---- props ---------------------------------------------------------------------------- */
  const gbin = (x, y, w, h, { bag = false, label = '#3b4f7a', name = '' } = {}) => `
    <g><ellipse cx="${x + w / 2}" cy="${y + h + 2}" rx="${w * .62}" ry="6" fill="url(#shadowG)"/>
    ${bag ? `<path d="M${x + 8} ${y - 6}C${x - 8} ${y - 62} ${x + w + 8} ${y - 70} ${x + w - 8} ${y - 6}Z" fill="url(#bagG)"/>
      <path d="M${x + 22} ${y - 40}C${x + 34} ${y - 56} ${x + 56} ${y - 58} ${x + 70} ${y - 46}" stroke="#7d8cc0" stroke-opacity=".45" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M${x + w / 2 - 10} ${y - 58}C${x + w / 2 - 6} ${y - 70} ${x + w / 2 + 8} ${y - 70} ${x + w / 2 + 12} ${y - 58}" stroke="#56658f" stroke-width="5" fill="none" stroke-linecap="round"/>` : ''}
    <path d="M${x} ${y}H${x + w}L${x + w - 8} ${y + h}H${x + 8}Z" fill="url(#binG)"/>
    <rect x="${x - 6}" y="${y - 10}" width="${w + 12}" height="13" rx="6" fill="#8d9bbf"/>
    <rect x="${x + 14}" y="${y + 18}" width="${w - 28}" height="${Math.min(26, h - 30)}" rx="3" fill="${label}" opacity=".9"/>
    ${name ? `<text x="${x + w / 2}" y="${y + 36}" text-anchor="middle" font-family="Open Sans,sans-serif" font-size="9" font-weight="800" fill="#dfe8fb" letter-spacing=".5">${name}</text>` : ''}
    <rect x="${x + w + 4}" y="${y + 8}" width="5" height="${h - 24}" rx="2.5" fill="#364362"/>
    <circle cx="${x + 14}" cy="${y + h + 1}" r="6" fill="#10172d"/><circle cx="${x + w - 14}" cy="${y + h + 1}" r="6" fill="#10172d"/></g>`;

  const cart = (x) => `
    <g><ellipse cx="${x + 66}" cy="402" rx="84" ry="6" fill="url(#shadowG)"/>
    <rect x="${x + 6}" y="338" width="126" height="9" rx="3" fill="#53659a"/><rect x="${x + 14}" y="376" width="110" height="6" rx="2" fill="#3a4a76"/>
    <rect x="${x}" y="292" width="7" height="100" rx="3" fill="#6c7eb3"/><rect x="${x - 2}" y="288" width="32" height="6" rx="3" fill="#6c7eb3"/>
    <rect x="${x + 22}" y="308" width="54" height="30" rx="3" fill="#475a8c"/><rect x="${x + 22}" y="319" width="54" height="3" fill="#6f83b9" opacity=".6"/>
    <circle cx="${x + 24}" cy="392" r="9" fill="#10172d"/><circle cx="${x + 112}" cy="392" r="9" fill="#10172d"/></g>`;

  const counter = (x1, x2) => `
    <g><ellipse cx="${(x1 + x2) / 2}" cy="402" rx="${(x2 - x1) / 2 + 24}" ry="7" fill="url(#shadowG)"/>
    <rect x="${x1}" y="350" width="${x2 - x1}" height="14" rx="3" fill="url(#benchG)"/><rect x="${x1 + 4}" y="351" width="${x2 - x1 - 8}" height="2" fill="#a9bbe6" opacity=".5"/>
    <rect x="${x1 + 8}" y="364" width="${x2 - x1 - 16}" height="36" fill="#24305c"/>
    <path d="M${x1 + (x2 - x1) / 3} 364V400M${x1 + 2 * (x2 - x1) / 3} 364V400" stroke="#141c38" stroke-width="2"/>
    <rect x="${x1 + 40}" y="376" width="22" height="4" rx="2" fill="#7d90c4"/><rect x="${x1 + (x2 - x1) / 3 + 40}" y="376" width="22" height="4" rx="2" fill="#7d90c4"/></g>`;

  const syringe = () => `
    <rect x="-27" y="1" width="4" height="14" rx="1.5" fill="#9fb0d2"/><rect x="-23" y="6" width="23" height="5" rx="2" fill="#b7c5e2"/>
    <rect x="0" y="0" width="76" height="16" rx="3.5" fill="url(#barrelG)"/><path d="M14 0v5M26 0v5M38 0v5M50 0v5M62 0v5" stroke="#6b7da6" stroke-width="1.2"/>
    <rect x="8" y="5" width="46" height="6" rx="2" fill="#ff5d6c" opacity=".78"/>
    <rect x="76" y="4" width="6" height="8" rx="1.5" fill="#6aa7ff"/><rect x="82" y="7" width="40" height="2" fill="#fff"/><rect x="84" y="7" width="26" height=".8" fill="#9fc3ff" opacity=".8"/>`;


  /* held syringe: drawn at real scale against the person (~12 units overall, about the size of a gloved hand) */
  const syringeSm = () => `<g class="held-in">
    <rect x="-2.4" y="-.9" width=".6" height="1.8" rx=".25" fill="#9fb0d2"/><rect x="-1.9" y="-.3" width="1.9" height=".6" rx=".25" fill="#b7c5e2"/>
    <rect x="0" y="-.95" width="6" height="1.9" rx=".5" fill="url(#barrelG)"/><rect x=".7" y="-.4" width="3.4" height=".8" rx=".25" fill="#ff5d6c" opacity=".8"/>
    <rect x="6" y="-.5" width=".7" height="1" rx=".2" fill="#6aa7ff"/><rect x="6.7" y="-.28" width="3.5" height=".55" rx=".25" fill="#ffffff"/></g>`;

  /* ---- scenes ------------------------------------------------------------------------------ */
  const collection = (alt) => `
    <g class="coll"><g class="cam">
      ${room({ door: true })}
      <rect x="462" y="186" width="132" height="30" rx="4" fill="#233357"/><text x="528" y="206" text-anchor="middle" font-family="Open Sans,sans-serif" font-size="11" font-weight="800" fill="#8fa3d4" letter-spacing=".8">WASTE · RECYCLING</text>
      ${gbin(342, 318, 96, 82, { label: '#2f6b57', name: 'RECYCLE' })}
      ${gbin(470, 312, 112, 88, { bag: true, label: '#3b4f7a', name: 'GENERAL' })}
      ${cart(612)}
      ${alt ? `<text class="nonedl" x="470" y="226" fill="#2ee6cf" font-family="Open Sans,sans-serif" font-size="14" font-weight="700">No needle in this bag</text>`
            : `<g class="cut"><path d="M496 292L556 272" stroke="#2ee6cf" stroke-width="3" stroke-dasharray="6 5" fill="none"/><rect x="484" y="290" width="22" height="10" rx="3" transform="rotate(-18 484 290)" fill="none" stroke="#2ee6cf" stroke-width="3" stroke-dasharray="5 4"/></g>`}
      <g class="jc"><g transform="translate(0 400)">${figure({})}</g></g>
    </g></g>`;

  const workspace = () => `
    <g class="wk">
      ${room({})}
      ${counter(60, 400)}
      ${gbin(560, 330, 96, 70, { label: '#4a5578', name: 'TRASH' })}
      <g class="figw">${figure({ hat: null, vest: false, jacket: '#4f6490', hair: '#1d1a26', holding: true })}</g>
      <g class="nocont"><rect x="690" y="176" width="70" height="92" rx="6" fill="none" stroke="#ff5d6c" stroke-width="2" stroke-dasharray="6 5"/><text x="725" y="290" text-anchor="middle" font-family="Open Sans,sans-serif" font-size="11" font-weight="700" fill="#ff5d6c">No sharps container</text><text x="725" y="305" text-anchor="middle" font-family="Open Sans,sans-serif" font-size="11" font-weight="700" fill="#ff5d6c">nearby</text></g>
      <g class="chipsvg unsafe"><rect x="24" y="76" width="300" height="34" rx="8"/><text x="40" y="98" fill="#ff5d6c">Unsafe disposal — do not copy.</text></g>
    </g>`;

  const instr = () => `
    <svg class="art" viewBox="0 0 800 520" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <rect x="-2400" y="-1400" width="5600" height="3400" fill="url(#wp)"/>
      ${room({})}
      ${counter(60, 400)}
      <rect x="92" y="326" width="34" height="24" rx="3" fill="#8fa5d6"/><rect x="98" y="318" width="22" height="9" rx="2" fill="#aebfe5"/>
      <rect x="300" y="334" width="46" height="16" rx="3" fill="#cfd9ef"/><path d="M300 340h46" stroke="#8ea2cc" stroke-width="2"/>
      <rect x="432" y="272" width="72" height="6" rx="3" fill="#4a5b88"/><use href="#bin" x="438" y="276" width="60" height="78"/>
      <path class="link" d="M224 336C300 300 380 286 436 292" stroke="#2ee6cf" stroke-width="3" stroke-dasharray="7 7" fill="none"/>
      <g class="figi">${figure({ hat: null, vest: false, jacket: '#4f6490', hair: '#1d1a26', holding: true })}</g>
      <g class="chipsvg l0"><rect x="24" y="44" width="360" height="34" rx="8"/><text x="40" y="66" fill="#2ee6cf">BEFORE THE TASK: DISPOSAL PLANNED</text></g>
      <g class="chipsvg l2"><rect x="24" y="44" width="372" height="34" rx="8"/><text x="40" y="66" fill="#2ee6cf">FROM THE DEVICE STRAIGHT TO THE CONTAINER</text></g>
    </svg>`;

  const anatomy = () => `
    <svg class="art" viewBox="0 0 800 520" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <rect x="-2400" y="-1400" width="5600" height="3400" fill="url(#wp)"/>
      <rect x="-2400" y="440" width="5600" height="1400" fill="url(#floorG)"/><rect x="-2400" y="436" width="5600" height="6" fill="#34476f"/>
      <polygon class="shaft" points="250,0 520,0 640,440 180,440" fill="url(#shaftG)" opacity=".7"/>
      <ellipse cx="400" cy="448" rx="150" ry="9" fill="url(#shadowG)"/>
      <rect x="352" y="70" width="96" height="14" rx="5" fill="#33466f"/><rect x="396" y="84" width="8" height="12" fill="#33466f"/>
      <use href="#bin" x="290" y="90" width="220" height="286"/>
      <path d="M298 160h204" stroke="#fff" stroke-opacity=".5" stroke-width="2.5" stroke-dasharray="8 6"/><text x="500" y="156" text-anchor="end" font-family="Open Sans,sans-serif" font-size="11" font-weight="700" fill="#fff" fill-opacity=".7">FILL LINE</text>
      <g class="an an1"><line x1="300" y1="300" x2="240" y2="300"/><circle cx="300" cy="300" r="5"/><circle cx="52" cy="296" r="13"/><text class="num" x="52" y="301" text-anchor="middle">1</text><text x="76" y="292">Puncture-resistant</text><text x="76" y="311">body</text><text class="sm" x="76" y="331">Helps contain sharp objects.</text></g>
      <g class="an an2"><line x1="480" y1="360" x2="556" y2="418"/><circle cx="480" cy="360" r="5"/><circle cx="572" cy="418" r="13"/><text class="num" x="572" y="423" text-anchor="middle">2</text><text x="594" y="414">Leakproof sides</text><text x="594" y="433">and bottom</text><text class="sm" x="594" y="453">Helps contain liquids.</text></g>
      <g class="an an3"><line x1="500" y1="240" x2="556" y2="240"/><circle cx="500" cy="240" r="5"/><circle cx="572" cy="240" r="13"/><text class="num" x="572" y="245" text-anchor="middle">3</text><text x="594" y="236">Appropriate labeling</text><text class="sm" x="594" y="256">Identifies the</text><text class="sm" x="594" y="272">hazardous contents.</text></g>
      <g class="an an4"><line x1="500" y1="104" x2="556" y2="96"/><circle cx="500" cy="104" r="5"/><circle cx="572" cy="96" r="13"/><text class="num" x="572" y="101" text-anchor="middle">4</text><text x="594" y="92">Closure</text><text class="sm" x="594" y="112">Allows the container to be</text><text class="sm" x="594" y="128">secured for removal.</text></g>
    </svg>`;


  /* ---- a believable pile of used syringes, stratified so the top sits at the fill line ------------ */
  const pile = (x0, x1, yTop, yBot, n, seed) => {
    let s = seed; const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
    const items = [];
    for (let i = 0; i < n; i++) {
      const y = yTop + 4 + (yBot - yTop - 8) * Math.pow((i + rnd() * .9) / n, .9);
      const x = x0 + 6 + (x1 - x0 - 12) * ((i * 0.618 + rnd() * .35) % 1);
      const rot = (rnd() < .22 ? 90 : 0) + (rnd() - .5) * 96;
      items.push([x, y, rot, rnd()]);
    }
    items.sort((p, q) => p[1] - q[1]);
    return items.map(([x, y, r, k]) => `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${r.toFixed(0)}) scale(.5) translate(-48 -8)" opacity="${(.8 + k * .2).toFixed(2)}">${syringe()}</g>`).join('');
  };
  const fillTall = () => `<svg class="art" viewBox="0 0 500 500" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <clipPath id="pcTall"><rect x="177" y="222" width="146" height="208"/></clipPath>
      <rect x="-300" y="-300" width="1100" height="1100" fill="#13203f"/>
      <polygon points="140,0 360,0 450,444 50,444" fill="#cfe0ff" opacity=".05"/>
      <ellipse cx="250" cy="448" rx="140" ry="8" fill="url(#shadowG)"/>
      <rect x="165" y="52" width="170" height="388" rx="14" fill="#1d2a4c" stroke="#3d5282" stroke-width="3"/>
      <rect x="177" y="62" width="146" height="170" fill="#2ee6cf" opacity=".05"/><rect x="177" y="232" width="146" height="198" fill="#18254a"/>
      <g class="contents" clip-path="url(#pcTall)">${pile(177, 323, 232, 430, 40, 7)}</g>
      <path d="M182 66V428" stroke="#fff" stroke-opacity=".09" stroke-width="6"/>
      <path d="M156 232H344" stroke="#ff5d6c" stroke-width="3" stroke-dasharray="9 6"/>
      <rect x="152" y="30" width="196" height="30" rx="10" fill="url(#lidG)"/><rect x="204" y="40" width="92" height="9" rx="4.5" fill="#5a0f1b"/>
      <g class="flbl"><path d="M146 66v166M138 66h16M138 232h16" stroke="#aab6cc" stroke-width="2" fill="none"/>
        <text x="128" y="142" text-anchor="end" font-family="Open Sans,sans-serif" font-size="17" font-weight="600" fill="#eaf0fb">Visible space</text><text x="128" y="163" text-anchor="end" font-family="Open Sans,sans-serif" font-size="17" font-weight="600" fill="#eaf0fb">above</text>
        <text x="354" y="226" font-family="Open Sans,sans-serif" font-size="17" font-weight="700" fill="#ff5d6c">Marked fill</text><text x="354" y="247" font-family="Open Sans,sans-serif" font-size="17" font-weight="700" fill="#ff5d6c">limit reached</text></g></svg>`;

  const fill = (slice) => `<svg class="art" viewBox="0 0 880 400" preserveAspectRatio="xMidYMid ${slice ? 'slice' : 'meet'}" aria-hidden="true">
      <rect x="-800" y="-400" width="2480" height="1200" fill="#13203f"/><rect x="-800" y="356" width="2480" height="600" fill="#0e1731"/>
      <polygon points="260,0 520,0 640,360 180,360" fill="#cfe0ff" opacity=".05"/>
      <ellipse cx="440" cy="362" rx="150" ry="8" fill="url(#shadowG)"/>
      <rect x="340" y="40" width="200" height="320" rx="16" fill="#1d2a4c" stroke="#3d5282" stroke-width="3"/>
      <path d="M352 56V346M528 56V346" stroke="#fff" stroke-opacity=".07" stroke-width="3"/>
      <rect x="326" y="24" width="228" height="30" rx="10" fill="url(#lidG)"/><rect x="394" y="33" width="92" height="9" rx="4.5" fill="#5a0f1b"/>
      <clipPath id="pcWide"><rect x="348" y="164" width="184" height="190"/></clipPath><g class="contents" clip-path="url(#pcWide)"><rect x="348" y="170" width="184" height="182" fill="#18254a"/>${pile(348, 532, 170, 352, 44, 11)}</g>
      <path d="M338 170h204" stroke="#ff5d6c" stroke-width="3" stroke-dasharray="9 6"/>
      <g class="flbl"><path d="M300 56v112M292 56h16M292 168h16" stroke="#aab6cc" stroke-width="2" fill="none"/><text x="284" y="116" text-anchor="end" font-family="Open Sans,sans-serif" font-size="17" font-weight="600" fill="#eaf0fb">Visible space above</text>
        <text x="560" y="176" font-family="Open Sans,sans-serif" font-size="17" font-weight="700" fill="#ff5d6c">Marked fill limit reached</text></g></svg>`;

  const decD1 = () => `<svg viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect x="-800" y="-300" width="2400" height="900" fill="#1a2644"/><rect x="-800" y="236" width="2400" height="500" fill="#10182f"/>
      <polygon points="120,0 300,0 420,236 60,236" fill="#cfe0ff" opacity=".05"/>
      <g transform="translate(0 -164)">${counter(60, 400)}</g>
      <g transform="translate(330 250) scale(.85)">${figure({ hat: null, vest: false, jacket: '#4f6490', hair: '#1d1a26', holding: true, pose: { arm: -28, held: 20 } })}</g>
      <ellipse cx="520" cy="264" rx="16" ry="6" fill="#9fb4d9"/><ellipse cx="520" cy="262" rx="12" ry="4" fill="#cfd9ef"/><text x="520" y="288" text-anchor="middle" font-family="Open Sans,sans-serif" font-size="12" fill="#aab6cc">loose cap</text>
      <use href="#bin" x="700" y="128" width="54" height="70"/><text x="727" y="218" text-anchor="middle" font-family="Open Sans,sans-serif" font-size="12" fill="#aab6cc">across the room</text></svg>`;
  const decD3 = () => `<svg viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect x="-800" y="-300" width="2400" height="900" fill="#1a2644"/><rect x="-800" y="226" width="2400" height="500" fill="#10182f"/>
      <polygon points="300,0 520,0 640,226 220,226" fill="#cfe0ff" opacity=".05"/><ellipse cx="410" cy="262" rx="110" ry="8" fill="url(#shadowG)"/>
      <g fill="#a9dbeb" opacity=".9"><polygon points="330,262 372,226 384,266"/><polygon points="394,270 440,238 466,270"/><polygon points="456,258 494,240 502,266"/></g>
      <g fill="#fff" opacity=".35"><polygon points="372,226 378,240 366,254"/><polygon points="440,238 448,252 430,262"/></g>
      <text x="410" y="292" text-anchor="middle" font-family="Open Sans,sans-serif" font-size="12" fill="#aab6cc">possibly blood-contaminated broken glass</text></svg>`;

  /* hero: a tied bag, the cutaway needle, window light */
  const hero = () => `<svg class="hero-art" viewBox="0 0 640 520" aria-hidden="true">
      <polygon class="shaft" points="150,0 330,0 470,470 60,470" fill="url(#shaftG)" opacity=".7"/>
      <ellipse cx="330" cy="476" rx="260" ry="20" fill="#000" opacity=".4"/>
      <path d="M170 470C128 382 140 250 250 200c0-30 30-50 70-50 60 0 100 40 100 65 100 45 110 185 50 255Z" fill="url(#bagG)"/>
      <path d="M200 400C170 330 176 270 226 232" stroke="#8697d1" stroke-opacity=".35" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M250 200c50 15 110 15 170 15" stroke="#58679b" stroke-width="5" fill="none"/><path d="M300 150l16-34 16 34" stroke="#58679b" stroke-width="8" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
      <g stroke="#2ee6cf" stroke-width="3" stroke-dasharray="7 7" fill="none"><path d="M300 340L378 300"/><rect x="294" y="342" width="26" height="12" rx="3" transform="rotate(-27 294 342)"/></g>
      <text x="320" y="392" text-anchor="middle" fill="#2ee6cf" font-family="Open Sans,sans-serif" font-size="13" font-weight="700" letter-spacing="1">ILLUSTRATION · HIDDEN INSIDE THE BAG</text>
      ${[[180, 200, 0], [300, 120, -3], [420, 260, -6], [520, 180, -2], [250, 330, -4]].map(([x, y, d]) => `<circle class="mote" cx="${x}" cy="${y}" r="1.8" fill="#e6efff" style="animation-delay:${d}s"/>`).join('')}</svg>`;

  /* the three object "photo" placeholders */
  const photo = (i) => {
    const base = `<defs><linearGradient id="bn${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3b66"/><stop offset="1" stop-color="#16203e"/></linearGradient></defs><rect width="400" height="300" fill="url(#bn${i})"/><rect y="172" width="400" height="128" fill="#1d2a4d"/><rect y="170" width="400" height="3" fill="#3a4d7a"/>`;
    if (i === 0) return `<svg viewBox="0 0 400 300" aria-hidden="true">${base}<ellipse cx="200" cy="222" rx="130" ry="10" fill="url(#shadowG)"/><g transform="translate(84 196) rotate(-4) scale(1.6)">${syringe()}</g></svg>`;
    if (i === 1) return `<svg viewBox="0 0 400 300" aria-hidden="true">${base}<ellipse cx="200" cy="224" rx="150" ry="10" fill="url(#shadowG)"/><g transform="translate(70 196) rotate(3)"><rect x="0" y="0" width="150" height="30" rx="14" fill="#e69a2e"/><rect x="6" y="5" width="138" height="8" rx="4" fill="#ffd488" opacity=".7"/><rect x="40" y="12" width="60" height="6" rx="3" fill="#3a4666"/><polygon points="150,2 232,2 256,28 150,28" fill="#dfe6f5"/><path d="M172 2v26M194 2v26M216 2v26" stroke="#9fb0cf" stroke-width="1.5"/><polygon points="232,2 256,28 232,28" fill="#b9c6e2"/></g></svg>`;
    return `<svg viewBox="0 0 400 300" aria-hidden="true">${base}<ellipse cx="200" cy="232" rx="140" ry="10" fill="url(#shadowG)"/><g opacity=".92" transform="translate(0 -22)"><polygon points="110,250 164,196 178,254" fill="#a9dbeb"/><polygon points="190,258 244,212 276,258" fill="#a9dbeb"/><polygon points="260,246 304,222 314,254" fill="#a9dbeb"/><polygon points="150,266 198,262 172,282" fill="#a9dbeb"/><g fill="#fff" opacity=".45"><polygon points="164,196 170,214 158,230"/><polygon points="244,212 252,230 234,240"/></g></g></svg>`;
  };


  /* ---- generic safety-feature diagram (V05, P05/P06) ----------------------------------------
     DELIBERATELY GENERIC. Real devices differ, so this shows only the principle (a built-in
     guard moves over the needle) and says so on the image. Replace with a verified,
     device-specific diagram if and when the device is chosen. */
  const DISCLAIM = 'Your device may work differently. Follow its instructions.';
  const sheathRing = (id) => `<g id="${id}"><rect x="36" y="-5" width="45" height="26" rx="6" fill="rgba(46,230,207,.22)" stroke="#2ee6cf" stroke-width="1.6"/><path d="M45 4v8M53 4v8M61 4v8" stroke="#2ee6cf" stroke-opacity=".65" stroke-width="1.2"/></g>`;
  /* Text inside the drawing is sized for the player (about 900px wide). Anything smaller than that
     (the before/after pair) is drawn bare and captioned in normal page text instead. */
  const diagBase = (inner, bare, chip = true) => `<svg viewBox="${bare ? '40 84 500 236' : '0 0 640 360'}" preserveAspectRatio="xMidYMid ${bare ? 'meet' : 'slice'}" aria-hidden="true">
      <rect x="-200" y="-200" width="1040" height="760" fill="#0f1a38"/><rect x="-200" y="292" width="1040" height="300" fill="#0b1329"/><rect x="-200" y="290" width="1040" height="3" fill="#2d4070"/>
      ${bare || !chip ? '' : `<rect x="14" y="14" width="${DISCLAIM.length * 7.5 + 30}" height="32" rx="8" fill="rgba(7,11,20,.86)" stroke="#ffb547" stroke-opacity=".6"/><text x="28" y="35" font-family="Open Sans,sans-serif" font-size="13.5" font-weight="700" fill="#ffb547">${DISCLAIM}</text>`}
      ${inner}</svg>`;
  const lbl = (id, text, color, w, vis) => `<g id="${id}"${vis ? '' : ' opacity="0"'}><rect x="14" y="306" width="${w}" height="42" rx="9" fill="rgba(7,11,20,.86)"/><text x="30" y="334" font-family="Open Sans,sans-serif" font-size="19" font-weight="700" fill="${color}">${text}</text></g>`;
  const sheathScene = () => diagBase(`
      <ellipse cx="290" cy="296" rx="210" ry="8" fill="url(#shadowG)"/>
      <g transform="translate(150 176) scale(2.5)">${syringe()}<circle id="shHalo" cx="122" cy="9" r="15" fill="none" stroke="#ffb547" stroke-width="2"/>${sheathRing('shSheath')}</g>
      <g id="shLock" opacity="0"><circle cx="484" cy="144" r="18" fill="#2ee6cf"/><path d="M475 144l7 8 13-16" fill="none" stroke="#04121a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>
      ${lbl('shL1', '1 · After use, the needle is exposed.', '#ffb547', 388, true)}${lbl('shL2', '2 · Activate the built-in safety feature.', '#2ee6cf', 424, false)}${lbl('shL3', '3 · The needle is now guarded.', '#2ee6cf', 340, false)}
      <g id="shCap" opacity="0"><rect x="468" y="238" width="164" height="100" rx="10" fill="rgba(7,11,20,.88)" stroke="#ff5d6c" stroke-opacity=".7"/>
        <rect x="539" y="246" width="22" height="30" rx="6" fill="#9fb4d9"/><rect x="543" y="251" width="14" height="19" rx="4" fill="#cfd9ef"/><path d="M531 244l38 36M569 244l-38 36" stroke="#ff5d6c" stroke-width="4" stroke-linecap="round"/>
        <text x="550" y="302" text-anchor="middle" font-family="Open Sans,sans-serif" font-size="13.5" font-weight="700" fill="#ffd0d5">Not the same as</text><text x="550" y="320" text-anchor="middle" font-family="Open Sans,sans-serif" font-size="13.5" font-weight="700" fill="#ffd0d5">replacing a loose cap</text></g>`);
  const sheathStill = (guarded, label, bare, chip) => diagBase(`
      <ellipse cx="290" cy="296" rx="210" ry="8" fill="url(#shadowG)"/>
      <g transform="translate(150 176) scale(2.5)">${syringe()}${guarded ? '' : '<circle cx="122" cy="9" r="15" fill="none" stroke="#ffb547" stroke-width="2"/>'}<g transform="translate(${guarded ? 46 : 0} 0)">${sheathRing('')}</g></g>
      ${guarded ? '<g><circle cx="484" cy="144" r="18" fill="#2ee6cf"/><path d="M475 144l7 8 13-16" fill="none" stroke="#04121a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>' : ''}
      ${bare ? '' : lbl('', label, guarded ? '#2ee6cf' : '#ffb547', label.length * 10.6 + 34, true)}`, bare, chip);

  /* ---- illustrated glass cleanup: three panels (V08) ------------------------------------------ */
  const gp = (inner) => `<svg viewBox="0 0 300 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="300" height="220" fill="#16233f"/><rect y="150" width="300" height="70" fill="#0f1830"/><rect y="148" width="300" height="3" fill="#2d4070"/>${inner}</svg>`;
  const shards = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" fill="#a9dbeb" opacity=".92"><polygon points="0,26 26,0 34,28"/><polygon points="40,32 70,8 90,34"/><polygon points="96,26 122,12 128,34"/></g>`;
  const brush = (x, y, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="0" y="-3" width="86" height="6" rx="3" fill="#e69a2e"/><rect x="82" y="-9" width="30" height="18" rx="3" fill="#7d6a4a"/><path d="M112 -8v16M118 -8v16M124 -8v16M130 -8v16" stroke="#cfd9ef" stroke-width="2"/></g>`;
  const pan = (x, y, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 0h74l22 -16v32l-22 -16" fill="#8d9bbf"/><rect x="-46" y="-3" width="48" height="6" rx="3" fill="#6c7eb3"/></g>`;
  const tongs = (x, y) => `<g transform="translate(${x} ${y}) rotate(-18)" stroke="#cfd9ef" stroke-width="5" stroke-linecap="round" fill="none"><path d="M0 0L86 -10M0 0L86 10"/><path d="M-14 -6L0 0L-14 6" stroke-width="4"/></g>`;
  const glassStrip = () => `<div class="strip">
      <figure><div class="gp">${gp(`${shards(70, 150)}${brush(40, 122, -8)}${pan(180, 150, 0)}${tongs(214, 112)}`)}</div><figcaption><b>1 · Tools, not hands</b>Keep your hands away from the glass, even gloved. Bring a brush and dustpan or tongs to it.</figcaption></figure>
      <figure><div class="gp">${gp(`${shards(150, 146, .8)}${pan(70, 160, 0)}${brush(190, 130, 14)}<path d="M190 120q-40 -6 -66 24" stroke="#2ee6cf" stroke-width="3" stroke-dasharray="5 5" fill="none"/>`)}</div><figcaption><b>2 · Collect mechanically</b>Sweep or lift the pieces onto the dustpan. Don’t pick them up by hand.</figcaption></figure>
      <figure><div class="gp">${gp(`<use href="#bin" x="190" y="56" width="70" height="90"/>${pan(60, 98, -26)}<path d="M120 80q40 -18 70 -6" stroke="#2ee6cf" stroke-width="3" stroke-dasharray="5 5" fill="none"/>`)}</div><figcaption><b>3 · Into the designated container</b>Follow your workplace’s cleanup procedure for the receiving container.</figcaption></figure>
    </div><p class="gnote2">Tools and containers vary. Follow your workplace’s procedure.</p>`;


  /* ---- gloves: the same needle through a thin, a thick and a heavy-duty glove ---------------------- */
  const gloves = () => {
    const col = (cx, layers, label) => {
      const top = 188 - layers * 16;
      return `<g>
        <ellipse cx="${cx}" cy="236" rx="96" ry="7" fill="url(#shadowG)"/>
        <rect x="${cx - 70}" y="188" width="140" height="42" rx="12" fill="#6f86b8"/>
        ${Array.from({ length: layers }, (_, i) => `<rect x="${cx - 78}" y="${188 - (i + 1) * 15}" width="156" height="17" rx="8" fill="rgba(46,230,207,.28)" stroke="#2ee6cf" stroke-width="1.6"/>`).join('')}
        <rect x="${cx - 4.5}" y="26" width="9" height="40" rx="2.5" fill="#9fb4d9"/><rect x="${cx - 1.6}" y="64" width="3.2" height="${204 - 64}" fill="#fff"/><circle cx="${cx}" cy="208" r="6" fill="#ff5d6c"/>
        <text x="${cx}" y="272" text-anchor="middle" font-family="Open Sans,sans-serif" font-size="21" font-weight="700" fill="#eaf0fb">${label}</text></g>`;
    };
    return `<svg viewBox="0 8 900 284" aria-hidden="true"><rect y="0" width="900" height="292" fill="#101b3c"/><rect y="230" width="900" height="62" fill="#0b1329"/><rect y="228" width="900" height="3" fill="#2d4070"/>
      ${col(160, 1, 'Thin glove')}${col(450, 2, 'Thick glove')}${col(740, 4, 'Heavy-duty glove')}</svg>`;
  };

  /* ---- plan-card container (Q01) ---------------------------------------------------------------- */
  const planIcon = () => `<svg viewBox="0 0 640 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="640" height="200" fill="#16233f"/><rect y="150" width="640" height="50" fill="#0f1830"/>
      <use href="#bin" x="270" y="26" width="76" height="98"/><path d="M262 62h92" stroke="#fff" stroke-opacity=".7" stroke-width="2" stroke-dasharray="6 5"/><text x="366" y="66" font-family="Open Sans,sans-serif" font-size="12" font-weight="700" fill="#ffd0d5">marked fill line</text>
      <text x="320" y="176" text-anchor="middle" font-family="Open Sans,sans-serif" font-size="13" fill="#aab6cc">Your site’s container and its fill marking</text></svg>`;

  window.ART = { defsHTML, room, figure, collection, workspace, instr, anatomy, fill, fillTall, decD1, decD3, hero, photo, syringe, sheathScene, sheathStill, glassStrip, planIcon, gloves };
  const defs = document.querySelector('#artdefs defs');
  if (defs) defs.innerHTML = defsHTML;
})();
