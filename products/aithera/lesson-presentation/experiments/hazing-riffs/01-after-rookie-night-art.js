/* Hazing riff 01 · "After Rookie Night" — illustration kit.
   Same drawing rules as the Sharps V2 article (side-on figures, navy room, window light, floor at y=400
   in an 800×520 viewBox) so the two modules read as one series. Scenes are composed in
   01-after-rookie-night.js. Icons inside drawings are Font Awesome Pro glyphs set as SVG text, so the
   page must load the self-hosted Font Awesome stylesheet. Classes the page's CSS hooks into are noted
   beside each part. */
(() => {
  'use strict';
  const F = 'Open Sans,sans-serif';
  const FA = (code, x, y, size, fill, extra = '') => `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-family="'Font Awesome 6 Pro'" font-weight="900" font-size="${size}" fill="${fill}" ${extra}>&#x${code};</text>`;
  const T = (x, y, s, { size = 13, w = 600, fill = '#eaf0fb', a = 'middle', ls = 0, cls = '' } = {}) => `<text${cls ? ` class="${cls}"` : ''} x="${x}" y="${y}" text-anchor="${a}" font-family="${F}" font-size="${size}" font-weight="${w}" fill="${fill}"${ls ? ` letter-spacing="${ls}"` : ''}>${s}</text>`;

  /* ---- shared definitions --------------------------------------------------------------- */
  const defsHTML = `
    <linearGradient id="hzWall" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="400"><stop offset="0" stop-color="#2b3b62"/><stop offset=".8" stop-color="#1d2846"/><stop offset="1" stop-color="#172039"/></linearGradient>
    <linearGradient id="hzFloor" gradientUnits="userSpaceOnUse" x1="0" y1="400" x2="0" y2="760"><stop offset="0" stop-color="#1f2b4b"/><stop offset="1" stop-color="#0e152e"/></linearGradient>
    <linearGradient id="hzSun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe3b5" stop-opacity=".30"/><stop offset="1" stop-color="#ffe3b5" stop-opacity="0"/></linearGradient>
    <radialGradient id="hzShadow"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <linearGradient id="hzSkyN" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050a1c"/><stop offset="1" stop-color="#15234a"/></linearGradient>
    <linearGradient id="hzSkyD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fb9ec"/><stop offset="1" stop-color="#ffd7a3"/></linearGradient>
    <linearGradient id="hzWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b7c97"/><stop offset="1" stop-color="#0a3555"/></linearGradient>
    <linearGradient id="hzDeck" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4d7c"/><stop offset="1" stop-color="#2a3a64"/></linearGradient>
    <radialGradient id="hzDoorGlow" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`;

  /* ---- people: side-on, facing right; flip with face:-1. The .arm group rotates from the shoulder
     (negative = forward). sit:true seats the figure with its hips about 44 units above the floor (×s).
     s scales the whole figure; the room scenes use ROOM_S so people match the bed, desk and window. ---- */
  const ROOM_S = 1.65;
  const person = ({ x = 0, s = 1, face = 1, top = '#3f5c9c', pants = '#27334f', skin = '#c99f7e', hair = '#2a2230', long = false, sit = false, arm = 6, cls = '', phone = false } = {}) => {
    const legs = sit
      ? `<rect x="-10" y="-52" width="38" height="12" rx="6" fill="${pants}"/><rect x="17" y="-47" width="11" height="45" rx="5" fill="${pants}"/><path d="M15 0h17a3 3 0 0 0 0-7H15z" fill="#151c33"/>`
      : `<rect x="-10" y="-54" width="11" height="52" rx="5" fill="${pants}"/><rect x="-1" y="-54" width="11" height="52" rx="5" fill="${pants}" opacity=".86"/>
         <path d="M-12 0h17a3 3 0 0 0 0-7H-12z" fill="#151c33"/><path d="M-2 0h17a3 3 0 0 0 0-7H-2z" fill="#151c33"/>`;
    const up = `<g${sit ? ' transform="translate(0 8)"' : ''}>
      ${long ? `<path d="M-9 -119c-6 9-6 25-1 34h9c-3-9-3-21 0-30z" fill="${hair}"/>` : ''}
      <path d="M-14 -52C-17 -78-13 -96-5 -101h13c8 5 11 23 8 49z" fill="${top}"/>
      <rect x="-1" y="-105" width="6" height="7" fill="${skin}"/><circle cx="2" cy="-113" r="9" fill="${skin}"/>
      <path d="M-7 -114a9.5 9 0 0 1 19 0c-4-3-12-3-19 0z" fill="${hair}"/>
      <g transform="translate(3 -94)"><g class="arm" style="transform:rotate(${arm}deg)"><rect x="-4.2" y="-2" width="8.5" height="38" rx="4.2" fill="${top}"/><circle cx="0" cy="38" r="5.2" fill="${skin}"/>
        ${phone ? '<rect x="-4" y="36" width="8" height="14" rx="2" fill="#0d1428"/><rect x="-3" y="37.5" width="6" height="10" rx="1" fill="#7fe9ff" opacity=".85"/>' : ''}</g></g>
    </g>`;
    return `<g class="person ${cls}" transform="translate(${x} 400) scale(${face < 0 ? -s : s} ${s})"><ellipse cx="4" cy="2" rx="26" ry="5" fill="url(#hzShadow)"/>${legs}${up}</g>`;
  };

  /* speech bubble; lines are pre-broken. tail points down-left (tx<x) or down-right */
  const bubble = (x, y, lines, cls = '', tx = null) => {
    const w = Math.max(...lines.map(l => l.length)) * 7.6 + 30, h = lines.length * 19 + 20, l = x - w / 2;
    const t = tx === null ? x : tx;
    return `<g class="bub ${cls}"><path d="M${l + 10} ${y}h${w - 20}a10 10 0 0 1 10 10v${h - 20}a10 10 0 0 1-10 10H${t + 10}l-12 14 2-14H${l + 10}a10 10 0 0 1-10-10v-${h - 20}a10 10 0 0 1 10-10z" fill="#f3f7fd"/>
      ${lines.map((s, i) => T(x, y + 24 + i * 19, s, { size: 14, w: 600, fill: '#0c1633' })).join('')}</g>`;
  };

  /* ---- scene: the dorm room (5.1 story, 01B variant, the reprise). Night and day are both drawn;
     the page's CSS crossfades .sky-d/.sun/.nightveil/.strobe by step. ------------------------------- */
  const dorm = (variant = 'base') => {
    const P = (o) => person({ s: ROOM_S, ...o });
    const cast = variant === 'trio'
      ? P({ x: 250, sit: true, top: '#2e7f8f', long: true, hair: '#3a2418', skin: '#b98868', arm: -32, cls: 'p-dana' }) +
        P({ x: 400, face: -1, top: '#7a4e9c', hair: '#151018', skin: '#8d5f45', arm: 4, cls: 'p-soph' }) +
        P({ x: 520, face: -1, top: '#3f5c9c', hair: '#5a3a22', skin: '#d8ad8c', arm: -18, cls: 'p-room' })
      : `<g class="in-d">${P({ x: 290, sit: true, top: '#2e7f8f', long: true, hair: '#3a2418', skin: '#b98868', arm: -34, cls: 'p-dana' })}</g>` +
        `<g class="in-r">${P({ x: 470, face: -1, top: '#3f5c9c', hair: '#5a3a22', skin: '#d8ad8c', arm: variant === 'reprise' ? -40 : 4, cls: 'p-room', phone: variant === 'reprise' })}</g>`;
    const stars = [[560, 92], [598, 120], [640, 84], [688, 110], [712, 150], [574, 168]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#cfe0ff" opacity=".7"/>`).join('');
    return `<g class="cam">
      <rect x="-2400" y="-2400" width="5600" height="2802" fill="url(#hzWall)"/>
      <path d="${Array.from({ length: 46 }, (_, i) => `M${-2320 + i * 120} -2400V384`).join('')}" stroke="#fff" stroke-opacity=".035" stroke-width="2"/>
      <g class="win"><rect x="540" y="70" width="190" height="150" rx="4" fill="url(#hzSkyN)"/>${stars}
        <rect class="sky-d" x="540" y="70" width="190" height="150" rx="4" fill="url(#hzSkyD)"/>
        <rect class="strobe-w" x="540" y="70" width="190" height="150" rx="4"/>
        <rect x="540" y="70" width="190" height="150" rx="4" fill="none" stroke="#141c38" stroke-width="6"/><path d="M635 70v150M540 145h190" stroke="#141c38" stroke-width="5"/>
        <rect x="532" y="218" width="206" height="9" rx="3" fill="#43557f"/></g>
      <polygon class="sun" points="548,226 726,226 660,400 380,400" fill="url(#hzSun)"/>
      <g transform="translate(150 112)"><rect x="-5" y="-6" width="6" height="60" rx="2" fill="#8d9bbf"/><path d="M0 0L120 24L0 48Z" fill="#14b8a6"/>${T(14, 29, 'SWIM', { size: 14, w: 800, fill: '#04121a', a: 'start', ls: 2 })}</g>
      <rect x="300" y="150" width="96" height="70" rx="3" fill="#3a4a76"/><rect x="308" y="158" width="36" height="26" fill="#cfd8ea" opacity=".75"/><rect x="350" y="160" width="38" height="22" fill="#ffcf7a" opacity=".6"/><rect x="314" y="190" width="70" height="20" fill="#9fb0d2" opacity=".5"/>
      <rect x="-2400" y="384" width="5600" height="16" fill="#151d36"/>
      <rect x="-2400" y="400" width="5600" height="800" fill="url(#hzFloor)"/>
      <ellipse cx="400" cy="436" rx="210" ry="24" fill="#2a3a66" opacity=".55"/>
      <g><rect x="30" y="256" width="14" height="144" rx="4" fill="#4a5a86"/><rect x="40" y="338" width="300" height="14" rx="4" fill="#4a5a86"/>
        <rect x="44" y="318" width="292" height="24" rx="9" fill="#c9d4ea"/><path d="M128 314h208v28H128z" fill="#2f6aa8"/><path d="M128 314h208v6H128z" fill="#4a86c6"/>
        <rect x="52" y="300" width="64" height="22" rx="10" fill="#eef3fb"/><rect x="48" y="352" width="10" height="48" fill="#33416a"/><rect x="322" y="352" width="10" height="48" fill="#33416a"/></g>
      <g><rect x="560" y="300" width="200" height="12" rx="3" fill="#5a70a6"/><rect x="570" y="312" width="10" height="88" fill="#394b79"/><rect x="740" y="312" width="10" height="88" fill="#394b79"/>
        <rect x="672" y="312" width="68" height="44" fill="#475a8c"/><rect x="700" y="330" width="14" height="4" rx="2" fill="#8d9bbf"/>
        <path d="M602 300v-40" stroke="#8d9bbf" stroke-width="4"/><path d="M586 262l18-22 24 15z" fill="#ffcf7a"/>
        <rect x="638" y="270" width="58" height="30" rx="3" fill="#26324f"/><rect x="642" y="274" width="50" height="22" rx="1" fill="#3d5d99" opacity=".7"/>
        <g class="deskphone"><rect x="712" y="293" width="24" height="7" rx="2" fill="#0d1428"/><rect class="glow" x="714" y="294.4" width="20" height="3" rx="1" fill="#7fe9ff"/></g></g>
      <g class="cast">${cast}</g>
      ${variant === 'trio'
        ? bubble(300, 84, ['I want to talk to someone.', 'I don’t want to file anything.'], 'b-d', 262) +
          bubble(400, 84, ['I want to report it, but', 'not with my name on it.'], 'b-s', 400) +
          bubble(500, 84, ['What can the school', 'actually do?'], 'b-r', 512)
        : bubble(450, 96, ['Who on campus', 'should hear about this?'], 'b-ask', 452)}
      <rect class="nightveil" x="-2400" y="-2400" width="5600" height="3600" fill="#030716"/>
      <rect class="strobe" x="-2400" y="-2400" width="5600" height="3600"/>
    </g>`;
  };

  /* ---- scene: the pool deck (01R, a week later at practice) ----------------------------------- */
  const pool = () => `
    <rect x="-800" y="-300" width="2400" height="640" fill="url(#hzWall)"/>
    ${[120, 330, 540].map(x => `<rect x="${x}" y="50" width="150" height="120" rx="4" fill="#86a6dc" opacity=".22"/><rect x="${x}" y="50" width="150" height="120" rx="4" fill="none" stroke="#141c38" stroke-width="5"/><path d="M${x + 75} 50v120" stroke="#141c38" stroke-width="4"/><polygon class="shaft" points="${x + 6},170 ${x + 144},170 ${x + 250},330 ${x + 90},330" fill="#cfe0ff" opacity=".06"/>`).join('')}
    <g transform="translate(640 66)"><rect width="128" height="74" rx="6" fill="#0b1124" stroke="#2d3e69" stroke-width="3"/>${T(64, 26, 'LANE TIMES', { size: 10, w: 800, fill: '#8793ab', ls: 1 })}${T(64, 54, '1:04.38', { size: 22, w: 700, fill: '#ffb547' })}</g>
    <rect x="-800" y="322" width="2400" height="10" fill="#2d3e69"/>
    <rect x="-800" y="332" width="2400" height="70" fill="url(#hzDeck)"/>
    <path d="${Array.from({ length: 26 }, (_, i) => `M${-700 + i * 80} 332v70`).join('')}" stroke="#fff" stroke-opacity=".05" stroke-width="2"/>
    <rect x="-800" y="400" width="2400" height="8" fill="#e8eef9" opacity=".8"/>
    <rect x="-800" y="408" width="2400" height="400" fill="url(#hzWater)"/>
    <g class="ripples">${Array.from({ length: 9 }, (_, i) => `<path d="M${-200 + i * 140} ${430 + (i % 3) * 22}q20 -6 40 0t40 0" stroke="#bff3ff" stroke-opacity=".25" stroke-width="2" fill="none"/>`).join('')}</g>
    ${[452, 500].map(y => `<path d="M-800 ${y}H1600" stroke="#ffb547" stroke-width="5" stroke-dasharray="10 8" opacity=".75"/>`).join('')}
    ${[90, 690].map(x => `<g><rect x="${x}" y="368" width="44" height="12" rx="2" fill="#d8e1f2"/><rect x="${x + 6}" y="380" width="8" height="22" fill="#8d9bbf"/><rect x="${x + 30}" y="380" width="8" height="22" fill="#8d9bbf"/></g>`).join('')}
    <g transform="translate(240 372)"><rect width="70" height="10" rx="4" fill="#2ee6cf" opacity=".7"/><rect y="10" width="70" height="8" rx="3" fill="#14b8a6" opacity=".6"/></g>
    ${person({ x: 360, s: ROOM_S, top: '#3f5c9c', hair: '#5a3a22', skin: '#d8ad8c', arm: 4, cls: 'p-room' })}
    ${person({ x: 452, s: ROOM_S, face: -1, top: '#2a6f6a', hair: '#1a1418', skin: '#a8765a', long: true, arm: -26, cls: 'p-fresh' })}
    ${bubble(470, 92, ['Where could someone report', 'without the team knowing?'], 'b-ask2', 452)}`;

  /* ---- scene: the corridor of channels (5.1). Five doors; the camera pans along them. -------------- */
  const DOORS = [
    { k: 'em',   x: 200,  name: 'EMERGENCY',        sub: '911 · campus emergency', col: '#ff5d6c', ic: 'f0f9' },
    { k: 'hot',  x: 520,  name: 'HOTLINE',          sub: '1-888-NOT-HAZE',         col: '#2ee6cf', ic: 'f095' },
    { k: 'web',  x: 840,  name: 'REPORT ONLINE',    sub: 'Anonymous option',       col: '#7fb2ff', ic: 'f109' },
    { k: 'care', x: 1160, name: 'COUNSELING',       sub: 'Confidential',           col: '#c7a6ff', ic: 'f086' },
    { k: 'dean', x: 1480, name: 'DEAN OF STUDENTS', sub: 'Explains your options',  col: '#ffb547', ic: 'f19c' }];
  /* A door swings INTO the room on a left hinge: the flat closed leaf folds to the hinge (.leaf), then the
     open leaf, drawn in perspective so its far edge is shorter, unfolds from the same hinge (.leaf-open).
     Light from the room falls through onto the floor as a fading pool (.spill). */
  const door = (d) => {
    const L = d.x - 63, R = d.x + 63;
    return `
    <g class="door d-${d.k}" data-k="${d.k}" style="--c:${d.col}">
      <linearGradient id="sp-${d.k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${d.col}" stop-opacity=".9"/><stop offset="1" stop-color="${d.col}" stop-opacity="0"/></linearGradient>
      <polygon class="spill" points="${L},400 ${R},400 ${R + 52},468 ${L - 18},468" fill="url(#sp-${d.k})"/>
      <g class="sign"><rect x="${d.x - 100}" y="112" width="200" height="44" rx="9" fill="#0b1124"/><rect class="sign-lit" x="${d.x - 100}" y="112" width="200" height="44" rx="9" fill="${d.col}" fill-opacity=".2" stroke="${d.col}" stroke-width="2.5"/>
        <rect class="sign-edge" x="${d.x - 100}" y="112" width="200" height="44" rx="9" fill="none" stroke="${d.col}" stroke-opacity=".55" stroke-width="2"/>
        ${T(d.x, 131, d.name, { size: 13, w: 800, fill: d.col, ls: 1.4 })}${T(d.x, 148, d.sub, { size: 11, w: 600, fill: '#cfd8ea' })}</g>
      <rect x="${d.x - 73}" y="162" width="146" height="240" rx="4" fill="#4a5a86"/>
      <rect x="${L}" y="172" width="126" height="228" fill="#0b1124"/>
      <rect x="${L}" y="172" width="126" height="228" fill="${d.col}" opacity=".2"/>
      <rect class="inglow" x="${L}" y="172" width="126" height="228" fill="url(#hzDoorGlow)"/>
      <g class="dicon">${d.k === 'em' ? T(d.x + 10, 262, '911', { size: 38, w: 800, fill: '#fff' }) + FA(d.ic, d.x + 10, 312, 32, '#ffd0d5') : FA(d.ic, d.x + 10, 282, 44, '#fff')}</g>
      <g class="leaf-open"><polygon points="${L},172 ${L + 30},186 ${L + 30},388 ${L},400" fill="#2b3961"/><polygon points="${L + 7},190 ${L + 24},197 ${L + 24},268 ${L + 7},270" fill="none" stroke="#45578a" stroke-width="2"/><polygon points="${L + 7},282 ${L + 24},282 ${L + 24},376 ${L + 7},382" fill="none" stroke="#45578a" stroke-width="2"/><path d="M${L + 30} 186V388" stroke="${d.col}" stroke-opacity=".5" stroke-width="2"/></g>
      <g class="leaf"><rect x="${L}" y="172" width="126" height="228" rx="2" fill="#3b4b78"/><rect x="${d.x - 50}" y="186" width="100" height="86" rx="3" fill="none" stroke="#56689a" stroke-width="3"/><rect x="${d.x - 50}" y="284" width="100" height="100" rx="3" fill="none" stroke="#56689a" stroke-width="3"/><circle cx="${d.x + 48}" cy="292" r="5" fill="#cfd8ea"/></g>
      ${d.k === 'em' ? `<circle class="beacon" cx="${d.x}" cy="98" r="7" fill="#ff5d6c"/>` : ''}
    </g>`;
  };
  const corridor = () => `<g class="cam">
      <rect x="-3000" y="-1400" width="7600" height="1802" fill="url(#hzWall)"/>
      <path d="${Array.from({ length: 62 }, (_, i) => `M${-2920 + i * 120} -1400V384`).join('')}" stroke="#fff" stroke-opacity=".03" stroke-width="2"/>
      ${[360, 680, 1000, 1320].map(x => `<rect x="${x - 24}" y="30" width="48" height="10" rx="5" fill="#cfe0ff" opacity=".35"/><polygon points="${x - 22},40 ${x + 22},40 ${x + 70},400 ${x - 70},400" fill="#cfe0ff" opacity=".035"/>`).join('')}
      <rect x="-3000" y="384" width="7600" height="16" fill="#151d36"/><rect x="-3000" y="400" width="7600" height="700" fill="url(#hzFloor)"/>
      ${DOORS.map(door).join('')}
    </g>`;

  /* ---- the hotline route: your message → the hotline (law-firm monitor) → the right organization,
     with that jurisdiction's hazing laws attached on the way. .pkt and .pdoc animate in CSS. -------- */
  // the labels are page text under the drawing (not SVG text), so they keep a readable size however small the drawing gets
  const ROUTE = [[150, 'f0e0', '#7fb2ff', 'Your message', 'Anonymous, or with your contact information for a direct response'],
                 [450, 'f095', '#2ee6cf', 'The hotline', 'Monitored by a representative from the law firm of Manley Burke'],
                 [750, 'f19c', '#ffb547', 'The right organization', 'Your message arrives with the hazing laws from the relevant jurisdiction']];
  const route = () => `<div class="route-wrap" role="img" aria-label="Your message goes to the hotline, where a representative from the law firm of Manley Burke forwards it to the appropriate organization along with the hazing laws from that jurisdiction.">
    <svg class="route" viewBox="0 0 900 190" aria-hidden="true">
      <path d="M150 120H450M450 120H750" stroke="#2ee6cf" stroke-opacity=".35" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>
      ${ROUTE.map(([x, ic, c]) => `<g><circle cx="${x}" cy="120" r="50" fill="#0e1631" stroke="${c}" stroke-width="2.5"/>${FA(ic, x, 120, 34, c)}</g>`).join('')}
      <g class="pkt"><circle r="15" fill="#eaf0fb"/>${FA('f0e0', 0, 0, 14, '#0b1124')}<g class="pdoc"><rect x="6" y="-30" width="22" height="27" rx="3" fill="#ffb547"/>${FA('f24e', 17, -16, 12, '#3b2300')}</g></g>
    </svg>
    <div class="route-labels" aria-hidden="true">${ROUTE.map(([, , , h, sub]) => `<div><b>${h}</b><span>${sub}</span></div>`).join('')}</div>
  </div>`;

  /* ---- 5.2 timeline: the night as four marks on one line; the liability arc reaches back from the
     hospital to the plan. Hooks: .tm1–.tm4, .pres (captain present), .arc, .arclbl. --------------- */
  const timeline = () => {
    const N = [
      [140, 'f46d', 'Earlier that week', ['The captain plans', 'rookie night']],
      [340, 'f79f', 'Friday, 9:00 p.m.', ['Rookie night', 'begins']],
      [520, 'f52b', '11:15 p.m.', ['The captain', 'leaves']],
      [690, 'f0f9', '1:40 a.m.', ['A freshman is', 'hospitalized']]];
    return `<svg class="art" viewBox="0 0 800 520" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <path d="M70 330H760" stroke="#56689a" stroke-width="3" stroke-linecap="round"/>
      <g class="pres"><rect x="340" y="398" width="180" height="8" rx="4" fill="#2ee6cf" opacity=".7"/>${T(430, 428, 'Captain at the event', { size: 13, w: 600, fill: '#2ee6cf' })}
        <rect x="520" y="398" width="170" height="8" rx="4" fill="none" stroke="#8793ab" stroke-dasharray="4 5"/>${T(605, 428, 'Captain gone', { size: 13, w: 600, fill: '#8793ab' })}</g>
      ${N.map(([x, ic, t, ev], i) => `<g class="tm tm${i + 1}">
        ${T(x, 268, t, { size: 13, w: 700, fill: '#aab6cc', ls: .4 })}
        <circle class="ring" cx="${x}" cy="330" r="30" fill="#0e1631" stroke="${i === 3 ? '#ff5d6c' : '#eaf0fb'}" stroke-width="2.5"/>${FA(ic, x, 330, 22, i === 3 ? '#ff8a96' : '#eaf0fb')}
        ${ev.map((s, k) => T(x, 482 + k * 20, s, { size: 15, w: 600 })).join('')}</g>`).join('')}
      <path class="arc" d="M690 248C640 40 190 40 140 248" pathLength="1" fill="none" stroke="#ff5d6c" stroke-width="3.5" stroke-linecap="round"/>
      <path class="arch" d="M131 234l9 15 10-14" fill="none" stroke="#ff5d6c" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      <g class="arclbl"><rect x="250" y="112" width="300" height="38" rx="19" fill="rgba(255,93,108,.14)" stroke="#ff5d6c"/>${T(400, 137, 'The planner can be held responsible', { size: 15, w: 700, fill: '#ffb3bb' })}</g>
    </svg>`;
  };

  /* ---- 5.2 three tracks: one incident forks into criminal, civil and campus consequences. Each path
     uses pathLength=1 so the page can draw it from scroll progress. ------------------------------- */
  const tracks = () => {
    const B = [
      [60,  '#ff5d6c', 'Criminal law', ['A misdemeanor in most states; a felony in a', 'handful when there is significant injury or death']],
      [190, '#ffb547', 'Civil suits', ['A separate track from any criminal case']],
      [320, '#7fb2ff', 'Campus policy', ['Academic consequences for students,', 'and sanctions for the group']]];
    return `<svg viewBox="0 0 1000 400" role="img" aria-label="One hazing incident can lead to criminal, civil and campus consequences, each on its own track.">
      <circle cx="44" cy="190" r="10" fill="#eaf0fb"/>${T(30, 160, 'One incident', { size: 19, w: 700, a: 'start' })}
      <path class="tk tk0" d="M44 190H300" pathLength="1" stroke="#eaf0fb" stroke-width="5" fill="none" stroke-linecap="round"/>
      ${B.map(([y, c, h, s], i) => `<path class="tk tk${i + 1}" d="M300 190C380 190 380 ${y} 470 ${y}H960" pathLength="1" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round"/>
        <g class="tl tl${i + 1}">${T(490, y - 16, h, { size: 26, w: 700, fill: c, a: 'start' })}${s.map((l, k) => T(490, y + 34 + k * 24, l, { size: 19, w: 400, fill: '#c4cee2', a: 'start' })).join('')}</g>`).join('')}
    </svg>`;
  };

  /* ---- the "Your turn" pictures ---------------------------------------------------------------- */
  const decVis = (n) => {
    if (n === 0) return `<svg viewBox="0 0 800 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="800" height="200" fill="#0b1328"/>
      ${[[90, 30], [250, 60], [620, 26], [720, 70], [480, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.5" fill="#cfe0ff" opacity=".7"/>`).join('')}
      <path d="M430 160V80l90-50 90 50v80z" fill="#1d2a4d"/><rect x="456" y="96" width="34" height="30" fill="#ff5d6c" opacity=".55"/><rect x="550" y="96" width="34" height="30" fill="#7fb2ff" opacity=".55"/><rect x="505" y="118" width="30" height="42" fill="#0b1124"/>
      <rect y="160" width="800" height="40" fill="#141d38"/>
      <g transform="translate(250 -175) scale(.82)">${person({ x: 0, top: '#3f5c9c', hair: '#5a3a22', skin: '#d8ad8c', arm: -40, phone: true })}</g></svg>`;
    if (n === 1) return `<svg viewBox="0 0 800 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="800" height="200" fill="#16213f"/>
      <rect x="430" y="40" width="96" height="160" fill="#0b1124"/><rect x="436" y="46" width="84" height="154" fill="#c7a6ff" opacity=".2"/>${FA('f086', 478, 110, 34, '#e7dbff')}
      <rect x="408" y="22" width="140" height="22" rx="6" fill="#0b1124" stroke="#c7a6ff" stroke-opacity=".6"/>${T(478, 37, 'COUNSELING', { size: 11, w: 800, fill: '#c7a6ff', ls: 1.2 })}
      <rect y="186" width="800" height="14" fill="#101934"/>
      <g transform="translate(320 -214) scale(.82)">${person({ x: 0, top: '#2a6f6a', hair: '#1a1418', skin: '#a8765a', long: true, arm: 2 })}</g></svg>`;
    return `<svg viewBox="0 0 800 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="800" height="200" fill="#1a1020"/>
      <rect width="800" height="200" fill="#ff5d6c" opacity=".06"/><rect y="168" width="800" height="32" fill="#120b18"/>
      <g transform="translate(300 170)"><ellipse cx="40" cy="4" rx="70" ry="6" fill="url(#hzShadow)"/><rect x="-20" y="-12" width="90" height="16" rx="8" fill="#3f5c9c"/><circle cx="-30" cy="-6" r="9" fill="#c99f7e"/><rect x="70" y="-10" width="50" height="11" rx="5" fill="#27334f"/></g>
      <g transform="translate(560 100)"><rect x="-26" y="-50" width="52" height="96" rx="9" fill="#0d1428" stroke="#ff5d6c" stroke-width="2"/>${T(0, 0, '911', { size: 20, w: 800, fill: '#fff' })}${FA('f095', 0, 26, 14, '#2ee6cf')}</g></svg>`;
  };

  window.HZART = { defsHTML, person, dorm, pool, corridor, DOORS, route, timeline, tracks, decVis, FA, T };
})();
