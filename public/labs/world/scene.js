// Concept 5 · Miniature World — a toy-like island where the work runs by itself.
// Raw WebGL2, no dependencies. Loads after first paint; static poster otherwise.
const q = new URLSearchParams(location.search);
const mqReduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = navigator.connection && navigator.connection.saveData;
const wrap = document.querySelector('.world');
const tag = document.querySelector('.tag');
if (q.has('poster')) document.documentElement.classList.add('poster');

const start = () => {
  if (q.has('static') || mqReduce || saveData) return;
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2', {
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  if (!gl) return;
  // ---------- GPU tier ----------
  let tier = 2;
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const rend = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : '';
  // software rendering (no real GPU) gets the static render unless a tier is forced
  if (/SwiftShader|llvmpipe|softpipe/i.test(rend) && !q.get('tier')) return;
  if (/Mali-[GT]?[0-7]\d\b|Adreno \(TM\) [3-5]\d\d|PowerVR/i.test(rend))
    tier = 1;
  if (
    matchMedia('(pointer: coarse)').matches ||
    (navigator.deviceMemory || 8) < 4
  )
    tier = 1;
  if (q.get('tier')) tier = +q.get('tier') === 1 ? 1 : 2;
  let dprCap = tier === 1 ? 1.5 : 2;
  wrap.appendChild(canvas);

  // ---------- math ----------
  const I = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  const mul = (a, b) => {
    const o = new Array(16);
    for (let c = 0; c < 4; c++)
      for (let r = 0; r < 4; r++)
        o[c * 4 + r] =
          a[r] * b[c * 4] +
          a[4 + r] * b[c * 4 + 1] +
          a[8 + r] * b[c * 4 + 2] +
          a[12 + r] * b[c * 4 + 3];
    return o;
  };
  const T = (x, y, z) => {
    const m = I();
    m[12] = x;
    m[13] = y;
    m[14] = z;
    return m;
  };
  const Ry = (a) => {
    const m = I(),
      c = Math.cos(a),
      s = Math.sin(a);
    m[0] = c;
    m[2] = -s;
    m[8] = s;
    m[10] = c;
    return m;
  };
  const Rx = (a) => {
    const m = I(),
      c = Math.cos(a),
      s = Math.sin(a);
    m[5] = c;
    m[6] = s;
    m[9] = -s;
    m[10] = c;
    return m;
  };
  const Rz = (a) => {
    const m = I(),
      c = Math.cos(a),
      s = Math.sin(a);
    m[0] = c;
    m[1] = s;
    m[4] = -s;
    m[5] = c;
    return m;
  };
  const Sc = (x, y, z) => {
    const m = I();
    m[0] = x;
    m[5] = y;
    m[10] = z;
    return m;
  };
  // node: position, size, yaw, pitch, roll, parent
  const node = (p, s, ry = 0, rx = 0, rz = 0, P = null) => {
    let m = mul(T(p[0], p[1], p[2]), Ry(ry));
    if (rx) m = mul(m, Rx(rx));
    if (rz) m = mul(m, Rz(rz));
    m = mul(m, Sc(s[0], s[1], s[2]));
    return { M: P ? mul(P, m) : m, S: s };
  };
  const hex = (h) => [
    parseInt(h.slice(1, 3), 16) / 255,
    parseInt(h.slice(3, 5), 16) / 255,
    parseInt(h.slice(5, 7), 16) / 255,
  ];
  const sstep = (x) => x * x * (3 - 2 * x);
  const fr = (x) => x - Math.floor(x);

  // ---------- shaders ----------
  const vs = `#version 300 es
  layout(location=0) in vec3 aP; layout(location=1) in vec3 aN;
  uniform mat4 uVP, uM; uniform vec3 uS;
  out vec3 vW, vN, vL;
  void main(){ vec4 w = uM*vec4(aP,1.); vW=w.xyz; vL=aP; vN=mat3(uM)*(aN/uS); gl_Position=uVP*w; }`;
  const fs = `#version 300 es
  precision highp float;
  in vec3 vW, vN, vL; uniform vec3 uC, uEye; uniform int uMode; uniform float uT, uA;
  out vec4 o;
  const vec3 FOG = vec3(.89,.95,.95);
  void main(){
    float d = length(vW-uEye);
    float fog = smoothstep(26., 70., d);
    if(uMode==1){ float r=length(vL.xz); o=vec4(vec3(.16,.24,.33)*.0, (1.-smoothstep(.15,1.,r))*.26*uA); o.rgb=vec3(.12,.2,.3)*o.a; return; }
    if(uMode==2){
      vec2 p=vW.xz; float r=length(p);
      float w=sin(p.x*.9+uT*1.1)*sin(p.y*.8-uT*.9)*.5+.5;
      vec3 c=mix(vec3(.33,.70,.80),vec3(.52,.82,.87),w*.6+smoothstep(30.,11.,r)*.4);
      float shore=11.45+.18*sin(uT*1.4+atan(p.y,p.x)*7.);
      c=mix(c,vec3(.98,.99,.97),smoothstep(.45,.0,abs(r-shore))*.85);
      o=vec4(mix(c,FOG,fog),1.); return;
    }
    if(uMode==3){ o=vec4(mix(uC,FOG,fog*.6),1.); return; }
    vec3 n=normalize(vN); vec3 L=normalize(vec3(.55,.9,.38));
    float dif=max(dot(n,L),0.);
    vec3 hemi=mix(vec3(.62,.58,.52),vec3(.86,.93,1.),n.y*.5+.5);
    float ao=mix(.78,1.,smoothstep(0.,1.1,vW.y+.05));
    vec3 V=normalize(uEye-vW); float rim=pow(1.-max(dot(n,V),0.),3.);
    vec3 c=uC*(hemi*.74+vec3(1.,.95,.86)*dif*.55)*ao + rim*vec3(1.,.9,.8)*.12;
    o=vec4(mix(c,FOG,fog),1.);
  }`;
  const sh = (t, s) => {
    const x = gl.createShader(t);
    gl.shaderSource(x, s);
    gl.compileShader(x);
    return x;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    canvas.remove();
    return;
  }
  gl.useProgram(prog);
  const U = {};
  for (const n of ['uVP', 'uM', 'uS', 'uC', 'uEye', 'uMode', 'uT', 'uA'])
    U[n] = gl.getUniformLocation(prog, n);

  // ---------- meshes ----------
  const mesh = (v) => {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
    return { vao, n: v.length / 6 };
  };
  const quadV = (a, b, c, d, n, out) => {
    for (const p of [a, b, c, a, c, d]) out.push(...p, ...n);
  };
  const box = (() => {
    const v = [];
    const ax = [
      [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
      [
        [0, 1, 0],
        [0, 0, 1],
        [1, 0, 0],
      ],
      [
        [0, 0, 1],
        [1, 0, 0],
        [0, 1, 0],
      ],
    ];
    for (const [n, u, w] of ax)
      for (const sg of [1, -1]) {
        const c = (a, b) =>
          [0, 1, 2].map(
            (i) =>
              n[i] * 0.5 * sg +
              u[i] * 0.5 * a +
              w[i] * 0.5 * b +
              (i === 1 ? 0.5 : 0),
          );
        quadV(
          c(-1, -1),
          c(1, -1),
          c(1, 1),
          c(-1, 1),
          n.map((x) => x * sg),
          v,
        );
      }
    return mesh(v);
  })();
  const cyl = (seg, cone) => {
    const v = [];
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2,
        a1 = ((i + 1) / seg) * Math.PI * 2;
      const p = (a, y, r = 1) => [Math.cos(a) * r, y, Math.sin(a) * r];
      const nn = (a) =>
        cone
          ? [Math.cos(a) / 1.41, 0.71, Math.sin(a) / 1.41]
          : [Math.cos(a), 0, Math.sin(a)];
      if (cone) {
        v.push(
          ...p(a0, 0),
          ...nn(a0),
          ...p(a1, 0),
          ...nn(a1),
          0,
          1,
          0,
          ...nn((a0 + a1) / 2),
        );
      } else {
        for (const [a, y] of [
          [a0, 0],
          [a1, 0],
          [a1, 1],
          [a0, 0],
          [a1, 1],
          [a0, 1],
        ])
          v.push(...p(a, y), ...nn(a));
        v.push(0, 1, 0, 0, 1, 0, ...p(a0, 1), 0, 1, 0, ...p(a1, 1), 0, 1, 0);
      }
      v.push(0, 0, 0, 0, -1, 0, ...p(a1, 0), 0, -1, 0, ...p(a0, 0), 0, -1, 0);
    }
    return mesh(v);
  };
  const cylM = cyl(tier === 1 ? 28 : 48),
    coneM = cyl(18, true),
    pyrM = cyl(4, true),
    discM = cyl(24);
  const sphM = (() => {
    const v = [],
      la = 7,
      lo = 12;
    const P = (i, j) => {
      const t = (i / la) * Math.PI,
        f = (j / lo) * Math.PI * 2;
      return [
        Math.sin(t) * Math.cos(f),
        Math.cos(t),
        Math.sin(t) * Math.sin(f),
      ];
    };
    for (let i = 0; i < la; i++)
      for (let j = 0; j < lo; j++) {
        const a = P(i, j),
          b = P(i + 1, j),
          c = P(i + 1, j + 1),
          d = P(i, j + 1);
        for (const p of [a, b, c, a, c, d]) v.push(...p, ...p);
      }
    return mesh(v);
  })();
  const quadM = mesh([
    -1, 0, -1, 0, 1, 0, 1, 0, -1, 0, 1, 0, 1, 0, 1, 0, 1, 0, -1, 0, -1, 0, 1, 0,
    1, 0, 1, 0, 1, 0, -1, 0, 1, 0, 1, 0,
  ]);

  // ---------- palette ----------
  const C = {
    grass: hex('#b4e09a'),
    grass2: hex('#8fc77c'),
    earth: hex('#d9a46e'),
    sand: hex('#f3deaf'),
    pave: hex('#f1e8d6'),
    cream: hex('#f8f0e2'),
    sun: hex('#ff7a3d'),
    ink: hex('#2a3644'),
    slate: hex('#3f5a78'),
    sky: hex('#cfe3ec'),
    kraft: hex('#d69a5c'),
    blueA: hex('#4a8cc0'),
    blueB: hex('#6fb0d6'),
    leaf: hex('#6fbf73'),
    leaf2: hex('#88cf6e'),
    trunk: hex('#9a6b45'),
    white: hex('#fffdf7'),
    pink: hex('#f4b6a6'),
    mint: hex('#bfe6d0'),
    butter: hex('#f6dc8a'),
    lav: hex('#cfd3f2'),
  };

  // ---------- static scene ----------
  const stat = [],
    shadows = [];
  const add = (m, n, c, mode = 0) => stat.push([m, n, c, mode]);
  const blob = (x, z, r, y = 0.05, a = 1) =>
    shadows.push([node([x, y, z], [r, 1, r]), a]);
  add(quadM, node([0, -0.62, 0], [140, 1, 140]), C.sky, 2);
  add(cylM, node([0, -1.0, 0], [11.4, 0.66, 11.4]), C.sand);
  add(cylM, node([0, -1.7, 0], [10.4, 1.4, 10.4]), C.earth);
  add(cylM, node([0, -0.3, 0], [10.5, 0.3, 10.5]), C.grass);
  add(cylM, node([0, 0, 0], [9.25, 0.03, 9.25]), C.pave);
  add(cylM, node([0, 0, 0], [8.65, 0.04, 8.65]), C.grass);
  add(cylM, node([0, 0, 0], [2.7, 0.07, 2.7]), C.pave);
  const sleepers = tier === 1 ? 56 : 84;
  for (let i = 0; i < sleepers; i++) {
    const a = (i / sleepers) * Math.PI * 2;
    add(
      box,
      node(
        [Math.sin(a) * 8.95, 0.02, Math.cos(a) * 8.95],
        [0.14, 0.05, 0.62],
        a + Math.PI / 2,
      ),
      C.trunk,
    );
  }
  for (const r of [8.72, 9.18])
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2,
        a2 = ((i + 1) / 72) * Math.PI * 2;
      add(
        box,
        node(
          [Math.sin((a + a2) / 2) * r, 0.06, Math.cos((a + a2) / 2) * r],
          [0.05, 0.05, r * 0.0875 + 0.01],
          (a + a2) / 2 + Math.PI / 2,
        ),
        C.ink,
      );
    }

  // clock tower (the Clockvane mark)
  add(box, node([0, 0.07, 0], [2.1, 0.35, 2.1]), C.pave);
  add(box, node([0, 0.4, 0], [1.35, 4.0, 1.35]), C.cream);
  add(box, node([0, 3.2, 0], [1.5, 0.22, 1.5]), C.sun);
  add(box, node([0, 4.4, 0], [1.55, 0.18, 1.55]), C.ink);
  add(pyrM, node([0, 4.58, 0], [1.1, 1.5, 1.1], Math.PI / 4), C.sun);
  add(box, node([0, 5.9, 0], [0.07, 1.1, 0.07]), C.ink);
  blob(0, 0, 2.6, 0.09);
  const faces = [0, 1, 2, 3].map((k) => (k * Math.PI) / 2);
  for (const f of faces)
    add(
      discM,
      node(
        [Math.sin(f) * 0.68, 3.85, Math.cos(f) * 0.68],
        [0.46, 0.04, 0.46],
        f,
        Math.PI / 2,
      ),
      C.white,
      3,
    );
  // paths
  const DA = [0, 1, 2, 3, 4, 5].map((i) => (i * Math.PI) / 3 + Math.PI / 6);
  for (const a of DA)
    add(
      box,
      node([Math.sin(a) * 3.6, 0.0, Math.cos(a) * 3.6], [0.7, 0.075, 2.2], a),
      C.pave,
    );

  // districts
  const DR = 6.1;
  const dc = DA.map((a) => [Math.sin(a) * DR, 0, Math.cos(a) * DR]);
  const DP = DA.map((a, i) => mul(T(dc[i][0], 0, dc[i][2]), Ry(a)));
  const L = (i, p, s, c, ry = 0, m = box, mode = 0, rx = 0) =>
    add(m, node(p, s, ry, rx, 0, DP[i]), c, mode);
  const lblob = (i, x, z, r) => {
    const w = mul(DP[i], [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, 0, z, 1]);
    blob(w[12], w[14], r);
  };
  // 1 sorting yard
  L(0, [-0.9, 0, -0.6], [1.9, 1.3, 1.5], C.butter);
  L(0, [-0.9, 1.3, -0.6], [2.0, 0.12, 1.6], C.ink);
  lblob(0, -0.9, -0.6, 1.6);
  L(0, [0.3, 0.25, 0.7], [3.2, 0.1, 0.5], C.ink);
  L(0, [0.3, 0, 0.7], [3.0, 0.25, 0.3], C.slate);
  L(0, [2.15, 0, 0.7], [0.8, 0.55, 0.6], C.sun);
  L(0, [2.15, 0.55, 0.55], [0.5, 0.3, 0.3], C.white);
  lblob(0, 2.1, 0.7, 0.8);
  // 2 mail room
  L(1, [-0.4, 0, -0.5], [1.7, 1.6, 1.7], C.lav);
  L(1, [-0.4, 1.6, -0.5], [1.3, 0.9, 1.3], C.slate, Math.PI / 4, pyrM);
  lblob(1, -0.4, -0.5, 1.7);
  L(1, [1.4, 0, 0.9], [0.9, 0.5, 0.6], C.trunk);
  L(1, [1.65, 0.5, 0.75], [0.04, 0.5, 0.04], C.ink);
  L(1, [1.55, 0.95, 0.75], [0.18, 0.18, 0.18], C.sun, 0, coneM, 3);
  lblob(1, 1.4, 0.9, 0.8);
  L(1, [-1.6, 0, 1.2], [0.4, 0.7, 0.4], C.sun);
  lblob(1, -1.6, 1.2, 0.5);
  // 3 water tower + garden
  for (const [x, z] of [
    [-0.5, -0.5],
    [0.5, -0.5],
    [-0.5, 0.5],
    [0.5, 0.5],
  ])
    L(2, [x - 0.6, 0, z - 0.3], [0.1, 1.9, 0.1], C.ink);
  L(2, [-0.6, 1.9, -0.3], [0.85, 1.1, 0.85], C.cream, 0, cylM);
  L(2, [-0.6, 3.0, -0.3], [0.95, 0.5, 0.95], C.slate, 0, coneM);
  lblob(2, -0.6, -0.3, 1.4);
  for (const [x, z, r] of [
    [1.1, 0.4, 0.45],
    [1.7, -0.5, 0.38],
    [0.6, 1.4, 0.4],
    [1.6, 1.2, 0.5],
  ]) {
    L(2, [x, 0, z], [0.08, 0.4, 0.08], C.trunk);
    L(2, [x, 0.4 + r, z], [r, r, r], C.leaf2, 0, sphM);
    lblob(2, x, z, r * 1.4);
  }
  // 4 depot
  L(3, [0, 0, 1.3], [2.6, 1.3, 0.12], C.cream);
  L(3, [0, 1.3, 1.1], [2.8, 0.12, 1.0], C.sun);
  for (let r = 0; r < 3; r++)
    for (let k = 0; k < 2; k++)
      for (let h = 0; h < (tier === 1 ? 2 : 3); h++)
        L(
          3,
          [-1.0 + r * 0.95, h * 0.5, -0.9 + k * 0.62],
          [0.88, 0.48, 0.58],
          (r + h) % 2 ? C.blueA : C.blueB,
        );
  lblob(3, 0, -0.6, 2.0);
  // 5 high street
  const shopC = [C.pink, C.mint, C.butter, C.lav];
  for (let k = 0; k < 4; k++) {
    const x = -1.8 + k * 1.05;
    L(4, [x, 0, -0.6], [0.95, 1.1 + (k % 2) * 0.35, 0.9], shopC[k]);
    L(4, [x, 0.75, -0.08], [0.95, 0.08, 0.3], k % 2 ? C.white : C.sun);
    lblob(4, x, -0.6, 0.9);
  }
  L(4, [1.3, 0, 1.0], [0.08, 0.9, 0.08], C.ink);
  L(4, [1.3, 0.9, 1.0], [1.8, 1.1, 0.08], C.ink);
  // 6 workshop
  L(5, [-1.2, 0, -0.4], [0.18, 3.4, 0.18], C.sun);
  L(5, [-0.3, 3.4, -0.4], [2.2, 0.16, 0.16], C.sun);
  L(5, [-1.7, 3.2, -0.4], [0.5, 0.35, 0.4], C.ink);
  L(5, [0.55, 0, -0.4], [0.9, 0.35, 0.9], C.blueA);
  L(5, [0.2, 0.35, -0.4], [0.2, 0.3, 0.9], C.blueA);
  L(5, [0.9, 0.35, -0.4], [0.2, 0.3, 0.9], C.blueA);
  lblob(5, 0.55, -0.4, 1.0);
  lblob(5, -1.2, -0.4, 0.5);
  L(5, [1.3, 0, 1.1], [1.2, 0.8, 1.0], C.cream);
  L(5, [1.3, 0.8, 1.1], [0.9, 0.6, 0.9], C.ink, Math.PI / 4, pyrM);

  // trees (seeded)
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const nTrees = tier === 1 ? 22 : 40;
  for (let k = 0, tries = 0; k < nTrees && tries < 600; tries++) {
    const a = rnd() * Math.PI * 2,
      r = 3.2 + rnd() * 5.2,
      x = Math.sin(a) * r,
      z = Math.cos(a) * r;
    if (
      dc.some((c) => Math.hypot(c[0] - x, c[2] - z) < 2.5) ||
      (r > 3.2 &&
        DA.some(
          (d) =>
            Math.abs(Math.atan2(Math.sin(a - d), Math.cos(a - d))) * r < 0.7 &&
            r < 4.9,
        ))
    )
      continue;
    const s = 0.7 + rnd() * 0.6;
    k++;
    if (rnd() < 0.5) {
      add(box, node([x, 0, z], [0.1, 0.35 * s, 0.1]), C.trunk);
      add(
        sphM,
        node([x, 0.35 * s + 0.4 * s, z], [0.42 * s, 0.45 * s, 0.42 * s]),
        rnd() < 0.5 ? C.leaf : C.leaf2,
      );
    } else {
      add(box, node([x, 0, z], [0.1, 0.25 * s, 0.1]), C.trunk);
      add(
        coneM,
        node([x, 0.25 * s, z], [0.42 * s, 1.1 * s, 0.42 * s]),
        C.grass2.map((v) => v * 0.85),
      );
    }
    blob(x, z, 0.6 * s);
  }

  // ---------- districts for tags ----------
  const names = [
    ['The sorting yard', 'Business process automation'],
    ['The mail room', 'AI automation'],
    ['The water tower', 'AI cost optimization'],
    ['The depot', 'Cloud and DevOps'],
    ['The high street', 'Websites and apps'],
    ['The workshop', 'Custom software'],
  ];

  // ---------- frame ----------
  let W = 0,
    H = 0,
    dpr = 1;
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, dprCap);
    W = innerWidth;
    H = innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  addEventListener('resize', resize);
  resize();
  const secs = [...document.querySelectorAll('[data-ch]')];
  const chapterF = () => {
    const y = scrollY + H * 0.5;
    for (let i = secs.length - 1; i >= 0; i--) {
      const s = secs[i],
        t = s.offsetTop;
      if (y >= t)
        return Math.min(i + (y - t) / s.offsetHeight, secs.length - 1);
    }
    return 0;
  };
  // camera states: [azimuth, distance, elevation, targetX, targetY, targetZ]
  const state = (k, t) => {
    if (k <= 0)
      return [DA[0] - 0.9 + t * 0.03, W < 768 ? 42 : 33, 0.6, 0, 1.2, 0];
    if (k >= 7)
      return [DA[5] + 0.9 + t * 0.03, W < 768 ? 40 : 30, 0.95, 0, 0.5, 0];
    const i = k - 1;
    return [DA[i] + 0.3, W < 768 ? 15 : 13, 0.68, dc[i][0], 1.0, dc[i][2]];
  };
  const cam = { v: null };
  let yaw = 0,
    drag = null,
    dragV = 0,
    hover = null;
  canvas.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, y: e.clientY, moved: 0 };
    canvas.style.cursor = 'grabbing';
  });
  addEventListener('pointerup', (e) => {
    if (drag && drag.moved < 6 && e.target === canvas)
      hover = [e.clientX, e.clientY];
    drag = null;
    canvas.style.cursor = '';
  });
  addEventListener('pointermove', (e) => {
    if (drag) {
      const dx = e.clientX - drag.x;
      drag.moved += Math.abs(dx);
      drag.x = e.clientX;
      dragV = -dx * 0.006;
      yaw += dragV;
    } else if (e.pointerType === 'mouse')
      hover = e.target === canvas ? [e.clientX, e.clientY] : null;
  });
  let VP = I(),
    eye = [0, 0, 0];
  const project = (p) => {
    const x = VP[0] * p[0] + VP[4] * p[1] + VP[8] * p[2] + VP[12],
      y = VP[1] * p[0] + VP[5] * p[1] + VP[9] * p[2] + VP[13],
      w = VP[3] * p[0] + VP[7] * p[1] + VP[11] * p[2] + VP[15];
    return [((x / w) * 0.5 + 0.5) * W, (0.5 - (y / w) * 0.5) * H, w];
  };
  const draw = (m, n, c, mode = 0, a = 1) => {
    gl.bindVertexArray(m.vao);
    gl.uniformMatrix4fv(U.uM, false, n.M);
    gl.uniform3fv(U.uS, n.S);
    gl.uniform3fv(U.uC, c);
    gl.uniform1i(U.uMode, mode);
    gl.uniform1f(U.uA, a);
    gl.drawArrays(gl.TRIANGLES, 0, m.n);
  };

  const t0 = performance.now();
  let last = t0,
    raf = 0,
    frames = 0,
    acc = 0,
    adapted = false;
  window.__fps = 0;
  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const t = (now - t0) / 1000;
    frames++;
    acc += dt;
    if (acc > 1) {
      window.__fps = Math.round(frames / acc);
      if (!adapted && t > 3 && window.__fps < 40 && dprCap > 1) {
        dprCap = 1;
        resize();
        adapted = true;
      }
      frames = 0;
      acc = 0;
    }
    // camera
    const f = chapterF(),
      k = Math.floor(f),
      u = sstep(Math.min(Math.max((f - k - 0.15) / 0.7, 0), 1));
    const A = state(k, t),
      B = state(Math.min(k + 1, 7), t);
    const goal = A.map((v, i) => v + (B[i] - v) * u);
    if (!drag) {
      yaw *= 0.97;
      dragV *= 0.9;
      yaw += dragV * 0.2;
    }
    goal[0] += yaw;
    if (!cam.v) cam.v = goal.slice();
    cam.v = cam.v.map((v, i) => v + (goal[i] - v) * Math.min(dt * 3.2, 1));
    const [az, dist, el, tx, ty, tz] = cam.v;
    eye = [
      tx + Math.sin(az) * Math.cos(el) * dist,
      ty + Math.sin(el) * dist,
      tz + Math.cos(az) * Math.cos(el) * dist,
    ];
    const zf = [eye[0] - tx, eye[1] - ty, eye[2] - tz],
      zl = Math.hypot(...zf),
      z = zf.map((v) => v / zl);
    const xr = [z[2], 0, -z[0]],
      xl = Math.hypot(...xr),
      x = xr.map((v) => v / xl);
    const y = [
      z[1] * x[2] - z[2] * x[1],
      z[2] * x[0] - z[0] * x[2],
      z[0] * x[1] - z[1] * x[0],
    ];
    const V = [
      x[0],
      y[0],
      z[0],
      0,
      x[1],
      y[1],
      z[1],
      0,
      x[2],
      y[2],
      z[2],
      0,
      -(x[0] * eye[0] + x[1] * eye[1] + x[2] * eye[2]),
      -(y[0] * eye[0] + y[1] * eye[1] + y[2] * eye[2]),
      -(z[0] * eye[0] + z[1] * eye[1] + z[2] * eye[2]),
      1,
    ];
    const asp = W / H,
      fov = W < 768 ? 0.78 : 0.62,
      fl = 1 / Math.tan(fov / 2),
      nr = 0.5,
      fa = 140;
    const P = [
      fl / asp,
      0,
      0,
      0,
      0,
      fl,
      0,
      0,
      0,
      0,
      (fa + nr) / (nr - fa),
      -1,
      0,
      0,
      (2 * fa * nr) / (nr - fa),
      0,
    ];
    if (W >= 768) P[8] = -0.3;
    else P[9] = -0.32;
    VP = mul(P, V);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    gl.uniformMatrix4fv(U.uVP, false, VP);
    gl.uniform3fv(U.uEye, eye);
    gl.uniform1f(U.uT, t);
    for (const s of stat) draw(...s);

    // --- living parts ---
    const dyn = [];
    const D = (m, n, c, mode = 0) => {
      draw(m, n, c, mode);
    };
    // clock hands + vane
    for (const fA of faces) {
      const Pf = mul(
        mul(T(Math.sin(fA) * 0.72, 3.85, Math.cos(fA) * 0.72), Ry(fA)),
        I(),
      );
      D(box, node([0, 0, 0], [0.05, 0.34, 0.03], 0, 0, -t * 0.6, Pf), C.ink);
      D(
        box,
        node([0, 0, 0.01], [0.06, 0.22, 0.03], 0, 0, -t * 0.05 - 1.2, Pf),
        C.ink,
      );
    }
    const vaneA = Math.sin(t * 0.35) * 0.9 + Math.sin(t * 0.13) * 0.6;
    const PV = mul(T(0, 6.75, 0), Ry(vaneA));
    D(box, node([0, -0.04, -0.1], [0.06, 0.06, 1.5], 0, 0, 0, PV), C.ink);
    D(
      coneM,
      node([0, 0, 0.62], [0.16, 0.42, 0.16], 0, Math.PI / 2, 0, PV),
      C.sun,
    );
    D(box, node([0, -0.25, -0.8], [0.04, 0.45, 0.42], 0, 0, 0, PV), C.sun);
    // parcels on the belt
    const np = tier === 1 ? 5 : 8;
    for (let k2 = 0; k2 < np; k2++) {
      const ph = fr(t * 0.18 + k2 / np),
        xx = -1.3 + ph * 3.4,
        drop = ph > 0.92 ? (ph - 0.92) * 6 : 0;
      D(
        box,
        node([xx, 0.35 - drop, 0.7], [0.3, 0.26, 0.3], ph * 0.4, 0, 0, DP[0]),
        C.kraft,
      );
    }
    // documents flying to their desks; the unclear one waits under the lamp
    const nd = tier === 1 ? 5 : 8;
    for (let k2 = 0; k2 < nd; k2++) {
      const ph = fr(t * 0.22 + k2 / nd),
        odd = k2 === 0;
      const a = [-1.6, 0.9, 1.2],
        b = odd ? [1.45, 1.05, 0.75] : [-0.4, 1.2, -0.5];
      const e = sstep(Math.min(ph * 1.6, 1));
      const p = a.map((v, i) => v + (b[i] - v) * e);
      p[1] += Math.sin(e * Math.PI) * 1.6;
      if (odd && ph > 0.62) p[1] += Math.sin(t * 3) * 0.05;
      if (!odd && ph > 0.62) continue;
      D(
        box,
        node(
          p,
          [0.34, 0.02, 0.44],
          ph * 6 * (odd ? 0.3 : 1),
          Math.sin(ph * 9) * 0.5,
          0,
          DP[1],
        ),
        C.white,
      );
    }
    // water tower gauge (spend drains slower)
    const lvl = 0.25 + 0.7 * (1 - fr(t * 0.05));
    D(box, node([0.3, 1.95, -0.3], [0.08, 1.0, 0.08], 0, 0, 0, DP[2]), C.ink);
    D(box, node([0.31, 1.95, -0.3], [0.1, lvl, 0.1], 0, 0, 0, DP[2]), C.sun, 3);
    // release train on the outer loop: dwells at the depot, then runs a lap
    const cyc = fr(t / 14),
      run = cyc < 0.2 ? 0 : sstep((cyc - 0.2) / 0.8);
    const th0 = DA[3] + 0.1 + run * Math.PI * 2;
    for (let c = 0; c < 4; c++) {
      const th = th0 - c * 0.105,
        x2 = Math.sin(th) * 8.95,
        z2 = Math.cos(th) * 8.95;
      D(
        box,
        node([x2, 0.1, z2], [0.62, c ? 0.55 : 0.68, 0.85], th + Math.PI / 2),
        c ? (c % 2 ? C.blueA : C.cream) : C.sun,
      );
      if (!c)
        D(box, node([x2, 0.78, z2], [0.4, 0.25, 0.4], th + Math.PI / 2), C.ink);
      dyn.push([x2, z2]);
    }
    // high street billboard: the new site lights up
    const glow = 0.75 + 0.25 * Math.max(0, Math.sin(t * 1.4));
    const PB = mul(DP[4], T(1.3, 0.9, 1.05));
    D(
      box,
      node([0, 0.06, 0], [1.66, 0.98, 0.04], 0, 0, 0, PB),
      C.white.map((v) => v * glow),
      3,
    );
    D(box, node([0, 0.88, 0.03], [1.5, 0.08, 0.02], 0, 0, 0, PB), C.ink, 3);
    D(box, node([-0.2, 0.55, 0.03], [1.0, 0.14, 0.02], 0, 0, 0, PB), C.ink, 3);
    D(
      box,
      node([-0.35, 0.36, 0.03], [0.7, 0.06, 0.02], 0, 0, 0, PB),
      C.slate,
      3,
    );
    D(box, node([-0.45, 0.15, 0.03], [0.5, 0.13, 0.02], 0, 0, 0, PB), C.sun, 3);
    // workshop crane: lower a part made to fit; it clicks into place
    const cc = fr(t / 5),
      down =
        cc < 0.45
          ? sstep(cc / 0.45)
          : cc < 0.6
            ? 1
            : 1 - sstep((cc - 0.6) / 0.4);
    const hy = 3.3 - down * 2.6,
      carry = cc < 0.6;
    D(
      box,
      node([0.55, hy, -0.4], [0.03, 3.4 - hy, 0.03], 0, 0, 0, DP[5]),
      C.ink,
    );
    if (carry)
      D(
        box,
        node([0.55, hy - 0.32, -0.4], [0.48, 0.3, 0.86], 0, 0, 0, DP[5]),
        C.sun,
      );
    if (cc > 0.45 && cc < 0.6)
      D(
        box,
        node([0.55, 0.36, -0.4], [0.95, 0.02, 0.95], 0, 0, 0, DP[5]),
        C.white,
        3,
      );
    // drifting clouds
    for (let c = 0; c < 3; c++) {
      const a = t * 0.02 + c * 2.1,
        x2 = Math.sin(a) * (17 + c * 3),
        z2 = Math.cos(a) * (17 + c * 3),
        yy = 11 + c * 1.5;
      for (const [ox, oy, r] of [
        [0, 0, 1.0],
        [0.9, -0.15, 0.75],
        [-0.9, -0.2, 0.7],
      ])
        D(
          sphM,
          node(
            [x2 + ox * Math.cos(a), yy + oy, z2 - ox * Math.sin(a)],
            [r * 1.2, r * 0.8, r],
          ),
          C.white,
          3,
        );
    }
    // soft contact shadows
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    for (const [n, a] of shadows) draw(quadM, n, C.ink, 1, a);
    for (const [x2, z2] of dyn)
      draw(quadM, node([x2, 0.09, z2], [0.75, 1, 0.75]), C.ink, 1, 1);

    // in-world tag on hover / tap
    if (hover) {
      let best = -1,
        bd = 90;
      dc.forEach((c, i) => {
        const s = project([c[0], 1.4, c[2]]);
        const d = Math.hypot(s[0] - hover[0], s[1] - hover[1]);
        if (s[2] > 0 && d < bd) {
          bd = d;
          best = i;
        }
      });
      if (best >= 0) {
        const s = project([dc[best][0], 2.2, dc[best][2]]);
        tag.hidden = false;
        tag.style.left = s[0] + 'px';
        tag.style.top = s[1] + 'px';
        tag.firstChild.textContent = names[best][0];
        tag.lastChild.textContent = names[best][1];
      } else tag.hidden = true;
    } else tag.hidden = true;
  };
  const go = () => {
    if (!raf && !document.hidden) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };
  document.addEventListener('visibilitychange', () =>
    document.hidden ? stop() : go(),
  );
  wrap.classList.add('live');
  go();
};
// load the world after first paint
const idle = () =>
  'requestIdleCallback' in window
    ? requestIdleCallback(start, { timeout: 1200 })
    : setTimeout(start, 200);
if (document.readyState === 'complete') idle();
else addEventListener('load', idle);
