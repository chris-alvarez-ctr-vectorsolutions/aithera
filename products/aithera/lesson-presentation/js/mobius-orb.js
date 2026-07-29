/* ============================================================================
   mobius-orb.js — the Möbius "AI presence" as a reusable, drop-anywhere,
   TRANSPARENT component. Extracted from experiments/mobius-strip.html (same
   shaders, geometry and motion) with two changes: it renders on a transparent
   canvas (no background — it floats on whatever is behind it) and it mounts
   into any element at any size instead of filling the window.

   Usage:
       <div class="my-orb" style="width:64px;height:64px"></div>
       const orb = MobiusOrb.create(document.querySelector('.my-orb'));
       // …later
       orb.destroy();

   Options (all optional):
       MobiusOrb.create(el, {
         config: { zoom: 4.05, speed: 2, green: '#66f729', ... },  // overrides
         paused: false,       // start paused
       });

   Each tiled instance is a "volume" — a rounded box that morphs toward a sphere
   as `round` goes 0→1. `volume` sets its footprint on the band; `thick` sets its
   depth off the surface (equal = a cube, small = a thin plate). A legacy `cube`
   config still works: it sets `volume` and `thick` together (a uniform cube).

   The default config is the Vector "CLARA" look. Colours accept either a
   [r,g,b] 0–1 array or a '#rrggbb' string. The component sizes itself to the
   host element (per-frame), uses devicePixelRatio for crispness, and pauses
   its render loop whenever it scrolls out of view (so you can place many).
   ========================================================================== */
(function (global) {
  'use strict';

  // ---- shaders (verbatim from the toy) -------------------------------------
  var VS = [
    'attribute vec3 aVolumePos;',
    'attribute vec3 aSpherePos;',
    'attribute vec3 aVolumeNormal;',
    'attribute vec2 aParam;',
    'uniform mat4 uProj; uniform mat4 uView; uniform mat4 uModel; uniform mat3 uNormalMat;',
    'uniform float uPhase; uniform float uTwist; uniform float uWavePhase; uniform float uWaveAmp;',
    'uniform float uVolume; uniform float uThick; uniform float uRound; uniform float uSeg; uniform float uRows; uniform float uWidth;',
    'varying vec3 vNormalW; varying vec3 vWorldPos;',
    'const float R = 1.1;',
    'void main() {',
    '  float i = aParam.x, j = aParam.y;',
    '  float u = (i / uSeg) * 6.2831853 + uPhase;',
    '  float vnorm = uRows > 1.0 ? (j / (uRows - 1.0) * 2.0 - 1.0) : 0.0;',
    '  float v = vnorm * uWidth;',
    '  float pres = clamp(uSeg - i, 0.0, 1.0) * clamp(uRows - j, 0.0, 1.0);',
    '  float tw = u * 0.5 + uTwist;',
    '  float c = cos(tw), s = sin(tw);',
    '  float C = cos(u), S = sin(u);',
    '  float rad = R + v * c;',
    '  vec3 P = vec3(rad * C, rad * S, v * s);',
    '  float wave = uWaveAmp * sin(3.0 * u + uWavePhase);',
    '  P.z += wave;',
    '  vec3 Pv = vec3(c * C, c * S, s);',
    '  float dr = -0.5 * v * s;',
    '  vec3 Pu = vec3(dr * C - rad * S, dr * S + rad * C, 0.5 * v * c);',
    '  Pu.z += uWaveAmp * 3.0 * cos(3.0 * u + uWavePhase);',
    '  vec3 T   = normalize(Pu);',
    '  vec3 Nrm = normalize(cross(Pu, Pv));',
    '  vec3 Bt  = cross(Nrm, T);',
    '  vec3 rPos = mix(aVolumePos, aSpherePos, uRound);',
    '  vec3 rNrm = normalize(mix(aVolumeNormal, normalize(aSpherePos), uRound));',
    '  vec3 local = rPos * vec3(uVolume, uVolume, uThick) * pres;',
    '  vec3 nScaled = normalize(vec3(rNrm.x / uVolume, rNrm.y / uVolume, rNrm.z / uThick));',
    '  vec3 objPos = P + local.x * T + local.y * Bt + local.z * Nrm;',
    '  vec3 nBand  = nScaled.x * T + nScaled.y * Bt + nScaled.z * Nrm;',
    '  vec4 world = uModel * vec4(objPos, 1.0);',
    '  vWorldPos = world.xyz;',
    '  vNormalW = uNormalMat * nBand;',
    '  gl_Position = uProj * uView * world;',
    '}'
  ].join('\n');

  var FS = [
    'precision highp float;',
    'varying vec3 vNormalW; varying vec3 vWorldPos;',
    'uniform vec3 uCamPos; uniform vec3 uWarmPos; uniform vec3 uBlue, uGreen, uDeep;',
    'void main() {',
    '  vec3 N = normalize(vNormalW);',
    '  vec3 V = normalize(uCamPos - vWorldPos);',
    '  vec3 blueDir = normalize(vec3(0.12, 0.90, 0.42));',
    '  float dBlue = max(dot(N, blueDir), 0.0);',
    '  vec3 greenDir = normalize(uWarmPos - vWorldPos);',
    '  float dGreen = max(dot(N, greenDir), 0.0);',
    '  vec3 rimDir = normalize(vec3(-0.15, -0.45, -0.65));',
    '  float dRim = max(dot(N, rimDir), 0.0);',
    '  vec3 Hb = normalize(blueDir + V);',
    '  vec3 Hg = normalize(greenDir + V);',
    '  float spec = pow(max(dot(N, Hb), 0.0), 90.0) * 0.16 + pow(max(dot(N, Hg), 0.0), 70.0) * 0.09;',
    '  vec3 blue = uBlue; vec3 green = uGreen; vec3 deep = uDeep; float albedo = 0.9;',
    '  vec3 col = vec3(albedo) * (deep + blue * dBlue * dBlue * 1.35 + green * dGreen * dGreen * 1.85 + blue * dRim * 0.08);',
    '  col += vec3(0.7, 1.0, 0.9) * spec;',
    '  col = vec3(1.0) - exp(-col * 1.5);',
    '  float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));',
    '  col = clamp(mix(vec3(luma), col, 1.35), 0.0, 1.0);',
    '  gl_FragColor = vec4(col, 1.0);',   // opaque volumes; the CLEAR is transparent
    '}'
  ].join('\n');

  // Default "CLARA" preset (no bg — the component is always transparent).
  var PRESET = {
    interactive: false,
    tilt: 0.0, zoom: 4.05, fov: 75, speed: 2.0, eversion: 0.2,
    wobble: 0.47, sway: 0.0, wave: 0.24, reverse: true,
    rows: 5, segments: 75, volume: 0.05, thick: 0.05, width: 0.19, round: 0.28,
    green: [0.400, 0.969, 0.161], blue: [0.031, 0.451, 0.922], deep: [0.012, 0.051, 0.149]
  };

  function hexToRgb(h) {
    return [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
  }
  function col(c) { return Array.isArray(c) ? c : hexToRgb(c); }

  // ---- matrix helpers (verbatim) -------------------------------------------
  function perspective(fovy, aspect, near, far) {
    var f = 1.0 / Math.tan(fovy / 2), nf = 1.0 / (near - far);
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
  }
  function translate(x, y, z) { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]); }
  function rotX(a) { var c = Math.cos(a), s = Math.sin(a); return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]); }
  function rotY(a) { var c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]); }
  function mul(a, b) {
    var o = new Float32Array(16);
    for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++)
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    return o;
  }
  function mat3Rotation(m) { return new Float32Array([m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]]); }

  function makeRoundedVolume(S) {
    var sph = function (x, y, z) {
      return [
        x * Math.sqrt(1 - y * y / 2 - z * z / 2 + y * y * z * z / 3),
        y * Math.sqrt(1 - z * z / 2 - x * x / 2 + z * z * x * x / 3),
        z * Math.sqrt(1 - x * x / 2 - y * y / 2 + x * x * y * y / 3)
      ];
    };
    var faces = [
      { o: [1, 0, 0], a: [0, 1, 0], b: [0, 0, 1] }, { o: [-1, 0, 0], a: [0, 0, 1], b: [0, 1, 0] },
      { o: [0, 1, 0], a: [0, 0, 1], b: [1, 0, 0] }, { o: [0, -1, 0], a: [1, 0, 0], b: [0, 0, 1] },
      { o: [0, 0, 1], a: [1, 0, 0], b: [0, 1, 0] }, { o: [0, 0, -1], a: [0, 1, 0], b: [1, 0, 0] }
    ];
    var pos = [], sphere = [], nor = [], idx = [];
    faces.forEach(function (f) {
      var base = pos.length / 3;
      for (var i = 0; i <= S; i++) for (var j = 0; j <= S; j++) {
        var s = i / S * 2 - 1, t = j / S * 2 - 1;
        var cx = f.o[0] + f.a[0] * s + f.b[0] * t, cy = f.o[1] + f.a[1] * s + f.b[1] * t, cz = f.o[2] + f.a[2] * s + f.b[2] * t;
        var q = sph(cx, cy, cz);
        pos.push(cx * 0.5, cy * 0.5, cz * 0.5);
        sphere.push(q[0] * 0.5, q[1] * 0.5, q[2] * 0.5);
        nor.push(f.o[0], f.o[1], f.o[2]);
      }
      for (var i2 = 0; i2 < S; i2++) for (var j2 = 0; j2 < S; j2++) {
        var a = base + i2 * (S + 1) + j2, b = a + (S + 1);
        idx.push(a, b, a + 1, a + 1, b, b + 1);
      }
    });
    return { pos: new Float32Array(pos), sphere: new Float32Array(sphere), nor: new Float32Array(nor), idx: new Uint16Array(idx) };
  }

  // ---- one instance --------------------------------------------------------
  function create(host, opts) {
    opts = opts || {};
    var P = Object.assign({}, PRESET, opts.config || {});
    P.green = col(P.green); P.blue = col(P.blue); P.deep = col(P.deep);
    // Legacy: a `cube` config once meant a uniform cube — map it to volume + thick
    // (an explicit volume/thick still wins).
    if (opts.config && opts.config.cube != null) {
      if (opts.config.volume == null) P.volume = opts.config.cube;
      if (opts.config.thick == null) P.thick = opts.config.cube;
    }

    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;background:transparent;pointer-events:none;';
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    host.appendChild(canvas);

    var gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false });
    var ext = gl && gl.getExtension('ANGLE_instanced_arrays');
    if (!gl || !ext) { return { destroy: function () { canvas.remove(); }, canvas: canvas, unsupported: true }; }

    function compile(type, src) {
      var sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error('mobius shader:', gl.getShaderInfoLog(sh));
      return sh;
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) console.error('mobius link:', gl.getProgramInfoLog(prog));
    gl.useProgram(prog);

    var volume = makeRoundedVolume(6);
    function bindAttrib(name, data) {
      var vbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(prog, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
    }
    bindAttrib('aVolumePos', volume.pos);
    bindAttrib('aSpherePos', volume.sphere);
    bindAttrib('aVolumeNormal', volume.nor);
    var volumeIBO = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, volumeIBO);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, volume.idx, gl.STATIC_DRAW);

    var SEG_MAX = 140, ROW_MAX = 12;
    var aParam = gl.getAttribLocation(prog, 'aParam');
    var instVBO = gl.createBuffer();
    var gridArr = [];
    for (var i = 0; i < SEG_MAX; i++) for (var j = 0; j < ROW_MAX; j++) gridArr.push(i, j);
    var INSTANCES = SEG_MAX * ROW_MAX;
    gl.bindBuffer(gl.ARRAY_BUFFER, instVBO);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gridArr), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(aParam);
    gl.vertexAttribPointer(aParam, 2, gl.FLOAT, false, 0, 0);
    ext.vertexAttribDivisorANGLE(aParam, 1);

    var U = {};
    ['uProj', 'uView', 'uModel', 'uNormalMat', 'uPhase', 'uTwist', 'uWavePhase', 'uWaveAmp',
     'uVolume', 'uThick', 'uRound', 'uSeg', 'uRows', 'uWidth', 'uCamPos', 'uWarmPos', 'uBlue', 'uGreen', 'uDeep']
      .forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
    gl.uniform3f(U.uWarmPos, 0, 0, 0.35);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);

    var aspect = 1;
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      var h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, canvas.width, canvas.height);
      aspect = canvas.width / canvas.height || 1;
    }

    var clock = 0, everClock = 0, last = performance.now(), raf = null, dead = false, visible = true;

    // Draw ONE frame at the current clock. Kept separate from the loop so a
    // ResizeObserver can repaint at the right size even while the loop is
    // paused (e.g. off-screen, or a backgrounded tab) — the canvas is never
    // stuck blank or mis-sized waiting on requestAnimationFrame.
    function render() {
      if (dead) return;
      resize();
      var proj = perspective(P.fov * Math.PI / 180, aspect, 0.1, 100);
      var twist = everClock, phase = clock * 0.12, wave = clock * 0.5;
      var tilt = P.tilt + P.wobble * Math.sin(clock * 0.5);
      var wob = P.sway * Math.sin(clock * 0.37);
      var model = mul(rotX(tilt), rotY(wob));

      gl.clearColor(0, 0, 0, 0);                    // TRANSPARENT — the whole point
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(U.uProj, false, proj);
      gl.uniformMatrix4fv(U.uView, false, translate(0, 0, -P.zoom));
      gl.uniform3f(U.uCamPos, 0, 0, P.zoom);
      gl.uniformMatrix4fv(U.uModel, false, model);
      gl.uniformMatrix3fv(U.uNormalMat, false, mat3Rotation(model));
      gl.uniform1f(U.uPhase, phase);
      gl.uniform1f(U.uTwist, twist);
      gl.uniform1f(U.uWavePhase, wave);
      gl.uniform1f(U.uVolume, P.volume);
      gl.uniform1f(U.uThick, P.thick);
      gl.uniform1f(U.uRound, P.round);
      gl.uniform1f(U.uSeg, P.segments);
      gl.uniform1f(U.uRows, P.rows);
      gl.uniform1f(U.uWidth, P.width);
      gl.uniform1f(U.uWaveAmp, P.wave);
      gl.uniform3fv(U.uBlue, P.blue);
      gl.uniform3fv(U.uGreen, P.green);
      gl.uniform3fv(U.uDeep, P.deep);
      ext.drawElementsInstancedANGLE(gl.TRIANGLES, volume.idx.length, gl.UNSIGNED_SHORT, 0, INSTANCES);
    }

    function frame(now) {
      raf = null;
      if (dead) return;
      var dt = (now - last) * 0.001; last = now;
      if (dt > 0.1) dt = 0.1;                       // clamp after a pause/tab-switch
      clock += dt * P.speed;
      everClock += dt * P.speed * P.eversion * (P.reverse ? -1 : 1);
      render();
      if (visible && !dead) raf = requestAnimationFrame(frame);
    }

    render();                                       // paint immediately (correct size once laid out)
    if (!opts.paused) raf = requestAnimationFrame(frame);

    // Repaint on size changes independently of the loop (fires even when the
    // host is sized AFTER mount, which is common).
    var ro = ('ResizeObserver' in window) ? new ResizeObserver(function () { render(); }) : null;
    if (ro) ro.observe(host);

    // Pause the loop while off-screen so many instances stay cheap.
    var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (e) {
      visible = e[0].isIntersecting;
      if (visible && !raf && !dead && !opts.paused) { last = performance.now(); raf = requestAnimationFrame(frame); }
    }, { threshold: 0 }) : null;
    if (io) io.observe(host);

    return {
      canvas: canvas,
      render: render,
      setConfig: function (cfg) {
        Object.assign(P, cfg || {});
        if (cfg && cfg.green) P.green = col(cfg.green);
        if (cfg && cfg.blue) P.blue = col(cfg.blue);
        if (cfg && cfg.deep) P.deep = col(cfg.deep);
        if (cfg && cfg.cube != null) {          // legacy alias — see create()
          if (cfg.volume == null) P.volume = cfg.cube;
          if (cfg.thick == null) P.thick = cfg.cube;
        }
        render();
      },
      pause: function () { visible = false; if (raf) { cancelAnimationFrame(raf); raf = null; } },
      resume: function () { if (!raf && !dead) { visible = true; last = performance.now(); raf = requestAnimationFrame(frame); } },
      destroy: function () {
        dead = true;
        if (raf) cancelAnimationFrame(raf);
        if (ro) ro.disconnect();
        if (io) io.disconnect();
        var lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
        canvas.remove();
      }
    };
  }

  global.MobiusOrb = { create: create, PRESET: PRESET };
})(window);
