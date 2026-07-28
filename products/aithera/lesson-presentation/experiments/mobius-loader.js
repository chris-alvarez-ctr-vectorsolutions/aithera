/*
 * Möbius loader — a self-contained "AI is thinking" indicator.
 * An everting Möbius strip of glossy tiles, lit in the Vector brand ramp
 * (blue -> teal -> green). No libraries, no build step.
 *
 * Usage (JS):
 *   const loader = initMobiusLoader('#target', { speed: 1 });
 *   ...
 *   loader.destroy();
 *
 * Usage (declarative): any element with a data-mobius-loader attribute is
 * auto-initialised on load. Control the size with the element's own CSS.
 *   <span class="thinking" data-mobius-loader data-speed="1.1"></span>
 *
 * The loader FILLS its container, so you set the size on the container:
 *   .thinking { width: 28px; height: 28px; }
 *
 * Options:
 *   size        — px number to force a square canvas; omit to fill the container
 *   speed       — animation speed multiplier (default 1)
 *   background  — CSS color painted behind the strip (default: transparent)
 *   colors      — { blue:[r,g,b], green:[r,g,b], deep:[r,g,b] } in 0..1
 *   density     — { around, across } tile counts (default 52 x 6)
 *   saturation  — post saturation multiplier (default 1.35)
 *   dprCap      — max devicePixelRatio (default 2)
 *
 * Respects prefers-reduced-motion (slows down and drops the positional wave).
 */
(function (global) {
  "use strict";

  const VS = `
    attribute vec3 aCubePos;
    attribute vec3 aCubeNormal;
    attribute vec2 aParam;
    uniform mat4 uProj, uView, uModel;
    uniform mat3 uNormalMat;
    uniform float uPhase, uTwist, uWavePhase, uWaveAmp, uCube;
    varying vec3 vNormalW;
    varying vec3 vWorldPos;
    const float R = 1.1;
    void main() {
      float u = aParam.x + uPhase;
      float v = aParam.y;
      float tw = u * 0.5 + uTwist;
      float c = cos(tw), s = sin(tw);
      float C = cos(u), S = sin(u);
      float rad = R + v * c;
      vec3 P = vec3(rad * C, rad * S, v * s);
      P.z += uWaveAmp * sin(3.0 * u + uWavePhase);
      vec3 Pv = vec3(c * C, c * S, s);
      float dr = -0.5 * v * s;
      vec3 Pu = vec3(dr * C - rad * S, dr * S + rad * C, 0.5 * v * c);
      Pu.z += uWaveAmp * 3.0 * cos(3.0 * u + uWavePhase);
      vec3 T   = normalize(Pu);
      vec3 Nrm = normalize(cross(Pu, Pv));
      vec3 Bt  = cross(Nrm, T);
      vec3 local = aCubePos * uCube;
      vec3 objPos = P + local.x * T + local.y * Bt + local.z * Nrm;
      vec3 nBand  = aCubeNormal.x * T + aCubeNormal.y * Bt + aCubeNormal.z * Nrm;
      vec4 world = uModel * vec4(objPos, 1.0);
      vWorldPos = world.xyz;
      vNormalW = uNormalMat * nBand;
      gl_Position = uProj * uView * world;
    }`;

  const FS = `
    precision highp float;
    varying vec3 vNormalW;
    varying vec3 vWorldPos;
    uniform vec3 uCamPos;
    uniform vec3 uWarmPos;
    uniform vec3 uBlue, uGreen, uDeep;
    uniform float uSat;
    void main() {
      vec3 N = normalize(vNormalW);
      vec3 V = normalize(uCamPos - vWorldPos);
      vec3 blueDir = normalize(vec3(0.12, 0.90, 0.42));
      float dBlue = max(dot(N, blueDir), 0.0);
      vec3 greenDir = normalize(uWarmPos - vWorldPos);
      float dGreen = max(dot(N, greenDir), 0.0);
      vec3 rimDir = normalize(vec3(-0.15, -0.45, -0.65));
      float dRim = max(dot(N, rimDir), 0.0);
      vec3 Hb = normalize(blueDir + V);
      vec3 Hg = normalize(greenDir + V);
      float spec = pow(max(dot(N, Hb), 0.0), 90.0) * 0.16
                 + pow(max(dot(N, Hg), 0.0), 70.0) * 0.09;
      vec3 col = 0.9 * (uDeep
               + uBlue  * dBlue  * dBlue  * 1.35
               + uGreen * dGreen * dGreen * 1.85
               + uBlue  * dRim   * 0.08);
      col += vec3(0.7, 1.0, 0.9) * spec;
      col = vec3(1.0) - exp(-col * 1.5);
      float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = clamp(mix(vec3(luma), col, uSat), 0.0, 1.0);
      gl_FragColor = vec4(col, 1.0);
    }`;

  /* ---------- math (column-major) ---------- */
  function perspective(fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return new Float32Array([f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)*nf,-1, 0,0,2*far*near*nf,0]);
  }
  function rotX(a){const c=Math.cos(a),s=Math.sin(a);return new Float32Array([1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]);}
  function rotY(a){const c=Math.cos(a),s=Math.sin(a);return new Float32Array([c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1]);}
  function mul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return o;}
  function mat3Rot(m){return new Float32Array([m[0],m[1],m[2],m[4],m[5],m[6],m[8],m[9],m[10]]);}

  function makeCube() {
    const faces = [
      { n:[0,0,1],  v:[[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]] },
      { n:[0,0,-1], v:[[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]] },
      { n:[1,0,0],  v:[[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1]] },
      { n:[-1,0,0], v:[[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1]] },
      { n:[0,1,0],  v:[[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1]] },
      { n:[0,-1,0], v:[[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]] },
    ];
    const pos=[], nor=[], idx=[];
    faces.forEach((f,fi)=>{ f.v.forEach(p=>{pos.push(p[0]*0.5,p[1]*0.5,p[2]*0.5);nor.push(f.n[0],f.n[1],f.n[2]);}); const b=fi*4; idx.push(b,b+1,b+2,b,b+2,b+3); });
    return { pos:new Float32Array(pos), nor:new Float32Array(nor), idx:new Uint16Array(idx) };
  }

  function compile(gl, type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error("mobius-loader shader:", gl.getShaderInfoLog(sh));
    return sh;
  }

  function initMobiusLoader(target, opts) {
    opts = opts || {};
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) { console.warn("mobius-loader: target not found", target); return null; }

    const o = {
      size: opts.size || null,
      speed: opts.speed != null ? +opts.speed : 1,
      background: opts.background || null,
      colors: opts.colors || { blue:[0.03,0.45,0.92], green:[0.40,0.97,0.16], deep:[0.01,0.05,0.15] },
      density: opts.density || { around:52, across:6 },
      saturation: opts.saturation != null ? +opts.saturation : 1.35,
      dprCap: opts.dprCap != null ? +opts.dprCap : 2,
    };

    const reduce = global.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const speed = o.speed * (reduce ? 0.45 : 1);
    const waveAmp = reduce ? 0.0 : 0.12;

    const canvas = document.createElement("canvas");
    canvas.style.cssText = "display:block;width:100%;height:100%;";
    canvas.setAttribute("role", "progressbar");
    canvas.setAttribute("aria-label", opts.label || "Loading");
    if (o.size) { el.style.width = o.size + "px"; el.style.height = o.size + "px"; }
    if (o.background) canvas.style.background = o.background;
    el.appendChild(canvas);

    const gl = canvas.getContext("webgl", { antialias:true, alpha:true, premultipliedAlpha:false });
    const ext = gl && gl.getExtension("ANGLE_instanced_arrays");
    if (!gl || !ext) {
      // Graceful fallback: a simple pulsing brand dot.
      canvas.remove();
      const dot = document.createElement("div");
      dot.style.cssText = "width:100%;height:100%;border-radius:50%;background:#1CC5C0;animation:mobius-fallback 1s ease-in-out infinite;";
      if (!document.getElementById("mobius-fallback-kf")) {
        const st = document.createElement("style"); st.id = "mobius-fallback-kf";
        st.textContent = "@keyframes mobius-fallback{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}";
        document.head.appendChild(st);
      }
      el.appendChild(dot);
      return { destroy(){ dot.remove(); }, setSpeed(){}, canvas:null };
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog); gl.useProgram(prog);

    const cube = makeCube();
    const posVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posVBO); gl.bufferData(gl.ARRAY_BUFFER, cube.pos, gl.STATIC_DRAW);
    const aCubePos = gl.getAttribLocation(prog, "aCubePos");
    gl.enableVertexAttribArray(aCubePos); gl.vertexAttribPointer(aCubePos, 3, gl.FLOAT, false, 0, 0);

    const norVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, norVBO); gl.bufferData(gl.ARRAY_BUFFER, cube.nor, gl.STATIC_DRAW);
    const aCubeNormal = gl.getAttribLocation(prog, "aCubeNormal");
    gl.enableVertexAttribArray(aCubeNormal); gl.vertexAttribPointer(aCubeNormal, 3, gl.FLOAT, false, 0, 0);

    const cubeIBO = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIBO); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cube.idx, gl.STATIC_DRAW);

    // instances
    const NU = o.density.around, NV = o.density.across, HALF_W = 0.34;
    const inst = [];
    for (let i=0;i<NU;i++){ const u=i/NU*Math.PI*2; for(let j=0;j<NV;j++){ inst.push(u, (j/(NV-1)*2-1)*HALF_W); } }
    const INSTANCES = NU*NV;
    const instVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, instVBO); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(inst), gl.STATIC_DRAW);
    const aParam = gl.getAttribLocation(prog, "aParam");
    gl.enableVertexAttribArray(aParam); gl.vertexAttribPointer(aParam, 2, gl.FLOAT, false, 0, 0);
    ext.vertexAttribDivisorANGLE(aParam, 1);

    const U = {};
    ["uProj","uView","uModel","uNormalMat","uPhase","uTwist","uWavePhase","uWaveAmp","uCube","uCamPos","uWarmPos","uBlue","uGreen","uDeep","uSat"]
      .forEach(n => U[n] = gl.getUniformLocation(prog, n));

    const CAM_Z = 4.3, CUBE = 0.10;
    gl.uniform1f(U.uCube, CUBE);
    gl.uniform1f(U.uWaveAmp, waveAmp);
    gl.uniform1f(U.uSat, o.saturation);
    gl.uniform3f(U.uWarmPos, 0, 0, 0.35);
    gl.uniform3f(U.uCamPos, 0, 0, CAM_Z);
    gl.uniform3fv(U.uBlue, o.colors.blue);
    gl.uniform3fv(U.uGreen, o.colors.green);
    gl.uniform3fv(U.uDeep, o.colors.deep);
    gl.uniformMatrix4fv(U.uView, false, new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,-CAM_Z,1]));

    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.clearColor(0, 0, 0, 0);

    let proj = null;
    function resize() {
      const dpr = Math.min(global.devicePixelRatio || 1, o.dprCap);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      proj = perspective(40*Math.PI/180, w/h, 0.1, 100);
    }

    let ro = null;
    if (global.ResizeObserver) { ro = new ResizeObserver(resize); ro.observe(canvas); } else { global.addEventListener("resize", resize); }
    resize();

    const BASE_TILT = -0.62;
    let raf = 0, running = true, spd = speed, t0 = performance.now();
    function frame(now) {
      if (!running) return;
      if (!proj || canvas.clientWidth === 0) { raf = requestAnimationFrame(frame); return; }
      const t = (now - t0) * 0.001 * spd;
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const model = mul(rotX(BASE_TILT), rotY(0));
      gl.uniformMatrix4fv(U.uProj, false, proj);
      gl.uniformMatrix4fv(U.uModel, false, model);
      gl.uniformMatrix3fv(U.uNormalMat, false, mat3Rot(model));
      gl.uniform1f(U.uPhase, t * 0.12);
      gl.uniform1f(U.uTwist, t * 0.7);
      gl.uniform1f(U.uWavePhase, t * 0.5);
      ext.drawElementsInstancedANGLE(gl.TRIANGLES, cube.idx.length, gl.UNSIGNED_SHORT, 0, INSTANCES);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return {
      canvas,
      setSpeed(x){ spd = +x; },
      destroy() {
        running = false;
        cancelAnimationFrame(raf);
        if (ro) ro.disconnect(); else global.removeEventListener("resize", resize);
        const lose = gl.getExtension("WEBGL_lose_context"); if (lose) lose.loseContext();
        canvas.remove();
      }
    };
  }

  // Declarative auto-init: <span data-mobius-loader data-speed="1.1"></span>
  function autoInit() {
    document.querySelectorAll("[data-mobius-loader]").forEach((el) => {
      if (el.__mobius) return;
      el.__mobius = initMobiusLoader(el, {
        speed: el.dataset.speed ? +el.dataset.speed : 1,
        background: el.dataset.background || null,
      });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", autoInit);
  else autoInit();

  global.initMobiusLoader = initMobiusLoader;
})(window);
