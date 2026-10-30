// Clockvane labs — shared runtime for the Gate 2c WebGL worlds (design prototype).
// Raw WebGL2 + GLSL, no library, no third-party requests. Follows the ADR-005 policy on the main
// thread for the prototype: load after first paint, tier detection, DPR cap, adaptive quality,
// pause when hidden, static poster for reduced motion / data saver / no WebGL2 / low tier.
// Production moves this into the ADR-005 worker; the shaders port to three.js ShaderMaterial as-is.

const q = new URLSearchParams(location.search);
const mq = (s) => matchMedia(s).matches;

export function policy() {
  if (q.has('static')) return { ok: false, why: 'forced' };
  if (mq('(prefers-reduced-motion: reduce)'))
    return { ok: false, why: 'reduced-motion' };
  if (navigator.connection && navigator.connection.saveData)
    return { ok: false, why: 'data-saver' };
  if (typeof WebGL2RenderingContext === 'undefined')
    return { ok: false, why: 'no-webgl2' };
  return { ok: true };
}

export function pickTier() {
  if (q.has('tier')) return Math.max(0, Math.min(3, +q.get('tier')));
  const coarse = mq('(pointer: coarse)');
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 8;
  if (mem <= 2) return 0;
  if (coarse || cores <= 4 || innerWidth < 768) return 1;
  return cores >= 8 && mem >= 8 ? 3 : 2;
}
export const TIERS = {
  1: { dpr: 1.5, scale: 0.6, particles: 30000, steps: 56 },
  2: { dpr: 1.75, scale: 0.8, particles: 120000, steps: 80 },
  3: { dpr: 2, scale: 1, particles: 200000, steps: 96 },
};

export function compile(gl, vs, fs) {
  const p = gl.createProgram();
  for (const [type, src] of [
    [gl.VERTEX_SHADER, vs],
    [gl.FRAGMENT_SHADER, fs],
  ]) {
    const s = gl.createShader(type);
    gl.shaderSource(s, '#version 300 es\nprecision highp float;\n' + src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(s));
    gl.attachShader(p, s);
  }
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(p));
  const u = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const a = gl.getActiveUniform(p, i);
    u[a.name] = gl.getUniformLocation(p, a.name);
  }
  return { p, u };
}

export const FULLSCREEN_VS =
  'void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.-1.,0.,1.);}';

// One combined post pass: chromatic-aberration transition (driven by scroll speed), mip-chain bloom,
// vignette, film grain. The scene renders into `target`, the post pass draws it to the canvas.
export function makePost(gl) {
  const prog = compile(
    gl,
    FULLSCREEN_VS,
    `
    uniform sampler2D uTex; uniform vec2 uRes; uniform float uT, uCA, uBloom; out vec4 o;
    float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
    void main(){
      vec2 uv=gl_FragCoord.xy/uRes, c=uv-.5; float k=uCA*(.25+dot(c,c)*3.);
      vec3 col=vec3(texture(uTex,uv+c*k).r,texture(uTex,uv).g,texture(uTex,uv-c*k).b);
      vec3 b=textureLod(uTex,uv,2.).rgb*.35+textureLod(uTex,uv,4.).rgb*.4+textureLod(uTex,uv,6.).rgb*.5;
      col+=b*b*uBloom;
      col*=1.-.55*dot(c*1.25,c*1.25);
      col+=(hash(gl_FragCoord.xy+fract(uT)*91.)-.5)*.035;
      o=vec4(col,1.);
    }`,
  );
  const tex = gl.createTexture(),
    fb = gl.createFramebuffer();
  const vao = gl.createVertexArray();
  let w = 0,
    h = 0;
  return {
    resize(nw, nh) {
      w = nw;
      h = nh;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA8,
        w,
        h,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
      );
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR_MIPMAP_LINEAR,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        tex,
        0,
      );
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    },
    begin() {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.viewport(0, 0, w, h);
    },
    end(t, ca, bloom) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.disable(gl.BLEND);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.useProgram(prog.p);
      gl.bindVertexArray(vao);
      gl.uniform2f(prog.u.uRes, w, h);
      gl.uniform1f(prog.u.uT, t);
      gl.uniform1f(prog.u.uCA, ca);
      gl.uniform1f(prog.u.uBloom, bloom);
      gl.uniform1i(prog.u.uTex, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}

// Chapter weights: section i of n is "on" around scroll s = i (holds, then hands over).
export const bump = (s, k) => {
  const ss = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  return ss(k - 0.75, k - 0.15, s) * (1 - ss(k + 0.35, k + 0.9, s));
};

// Magnetic call to action: the button leans toward the cursor inside a radius.
function magnetic() {
  if (mq('(pointer: coarse)') || mq('(prefers-reduced-motion: reduce)')) return;
  for (const el of document.querySelectorAll('[data-magnetic]')) {
    const r = 120;
    addEventListener(
      'pointermove',
      (e) => {
        const b = el.getBoundingClientRect();
        const dx = e.clientX - (b.left + b.width / 2),
          dy = e.clientY - (b.top + b.height / 2);
        const d = Math.hypot(dx, dy),
          k = d < r ? (1 - d / r) * 0.35 : 0;
        el.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
      },
      { passive: true },
    );
  }
}

// Optional sound, off by default, synthesised (no audio files). `voice(ctx, out)` returns update(state).
function sound(voice) {
  const btn = document.querySelector('[data-sound]');
  if (!btn) return () => {};
  let ctx,
    out,
    update = () => {};
  btn.addEventListener('click', async () => {
    const on = btn.getAttribute('aria-pressed') !== 'true';
    btn.setAttribute('aria-pressed', String(on));
    btn.textContent = on ? 'Sound on' : 'Sound off';
    if (on && !ctx) {
      ctx = new AudioContext();
      out = ctx.createGain();
      out.connect(ctx.destination);
      update = voice(ctx, out);
    }
    if (ctx) {
      out.gain.setTargetAtTime(on ? 0.5 : 0, ctx.currentTime, 0.2);
      if (on) ctx.resume();
    }
  });
  return (s) => update(s);
}

// Chapter rail + current chapter for the scene.
function chapters() {
  const els = [...document.querySelectorAll('[data-chapter]')];
  const rail = document.querySelector('.rail');
  if (rail) rail.innerHTML = els.map(() => '<li></li>').join('');
  const dots = rail ? [...rail.children] : [];
  // Returns a continuous chapter position s (0 = hero, 1 = first service, …) for the scene.
  return () => {
    const mid = innerHeight * 0.5,
      tops = els.map((el) => el.getBoundingClientRect().top);
    let s = 0;
    for (let i = 0; i < tops.length; i++) {
      if (tops[i] <= mid) {
        const next = tops[i + 1] ?? tops[i] + innerHeight;
        s = i + Math.min(1, (mid - tops[i]) / (next - tops[i]));
      }
    }
    s = Math.max(0, s - 0.5);
    const cur = Math.round(s);
    dots.forEach((d, i) => d.classList.toggle('on', i === cur));
    return s;
  };
}

export function run(scene) {
  magnetic();
  const chap = chapters();
  const world = document.querySelector('.world');
  const pol = policy();
  document.documentElement.dataset.mode = pol.ok
    ? 'pending'
    : 'static:' + pol.why;
  addEventListener('scroll', () => chap(), { passive: true });
  if (!pol.ok) return;
  const start = () => boot(scene, world, chap);
  // After first paint: idle callback with a 2 s cap (setTimeout for Safari).
  const later = () =>
    'requestIdleCallback' in window
      ? requestIdleCallback(start, { timeout: 2000 })
      : setTimeout(start, 300);
  if (document.readyState === 'complete') later();
  else addEventListener('load', later, { once: true });
}

function boot(scene, world, chap) {
  let tier = pickTier();
  if (tier === 0) {
    document.documentElement.dataset.mode = 'static:low-tier';
    return;
  }
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl2', {
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance',
    failIfMajorPerformanceCaveat: true,
  });
  if (!gl) {
    document.documentElement.dataset.mode = 'static:no-webgl2';
    return;
  }
  // Software rasterisers (SwiftShader, llvmpipe, Microsoft Basic Render) = no real GPU → static.
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = String(
    gl.getParameter(dbg ? dbg.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
  );
  if (
    /swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer) &&
    !q.has('tier')
  ) {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    document.documentElement.dataset.mode = 'static:software-gl';
    return;
  }
  world.appendChild(canvas);
  let api;
  try {
    api = scene.init(gl, TIERS[tier], tier);
  } catch (e) {
    console.warn(e);
    canvas.remove();
    document.documentElement.dataset.mode = 'static:error';
    return;
  }
  const voice = sound(scene.voice || (() => () => {}));

  const st = { t: 0, p: 0, pTarget: 0, mx: 0, my: 0, mxT: 0, myT: 0, vel: 0 };
  const fixedP = q.has('s') ? +q.get('s') : null; // ?s=3 renders chapter 3 (posters, screenshots)
  const readScroll = () => {
    st.pTarget = chap();
  };
  addEventListener('scroll', readScroll, { passive: true });
  addEventListener(
    'pointermove',
    (e) => {
      st.mxT = (e.clientX / innerWidth) * 2 - 1;
      st.myT = -((e.clientY / innerHeight) * 2 - 1);
    },
    { passive: true },
  );
  readScroll();

  let w = 0,
    h = 0;
  const resize = () => {
    const T = TIERS[tier],
      dpr = Math.min(devicePixelRatio || 1, T.dpr) * T.scale;
    w = Math.max(2, Math.round(innerWidth * dpr));
    h = Math.max(2, Math.round(innerHeight * dpr));
    canvas.width = w;
    canvas.height = h;
    if (api.resize) api.resize(w, h);
  };
  resize();
  addEventListener('resize', resize);

  // Adaptive quality: p90 frame time over 2 s windows; step down, never up.
  let times = [],
    winStart = performance.now(),
    last = performance.now(),
    running = true,
    frames = 0,
    fpsT = last;
  const stats = (window.__lab = { tier, fps: 0, p90: 0, downgrades: 0 });
  const tick = (now) => {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    times.push(dt * 1000);
    frames++;
    if (now - fpsT > 1000) {
      stats.fps = Math.round((frames * 1000) / (now - fpsT));
      frames = 0;
      fpsT = now;
    }
    if (now - winStart > 2000) {
      times.sort((a, b) => a - b);
      const p90 = times[Math.floor(times.length * 0.9)] || 0;
      stats.p90 = +p90.toFixed(1);
      const target = tier === 1 ? 34 : 17.5;
      if (p90 > target && !q.has('tier')) {
        if (tier > 1) {
          tier--;
          stats.tier = tier;
          stats.downgrades++;
          if (api.setTier) api.setTier(TIERS[tier], tier);
          resize();
        } else if (++stats.downgrades > 3) {
          running = false;
          world.classList.remove('is-live');
          document.documentElement.dataset.mode = 'static:slow';
          return;
        }
      }
      times = [];
      winStart = now;
    }
    const k = 1 - Math.pow(0.0015, dt);
    const prev = st.p;
    st.p = fixedP ?? st.p + (st.pTarget - st.p) * k;
    st.vel = (st.p - prev) / Math.max(dt, 1e-3);
    st.mx += (st.mxT - st.mx) * k * 0.6;
    st.my += (st.myT - st.my) * k * 0.6;
    st.t += dt;
    gl.viewport(0, 0, w, h);
    api.frame(st, w, h);
    voice(st);
    requestAnimationFrame(tick);
  };
  // Pause when the tab is hidden.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) running = false;
    else if (!running && document.documentElement.dataset.mode === 'live') {
      running = true;
      last = performance.now();
      requestAnimationFrame(tick);
    }
  });
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    running = false;
    world.classList.remove('is-live');
  });
  requestAnimationFrame((t) => {
    last = t;
    fpsT = t;
    tick(t);
    requestAnimationFrame(() => world.classList.add('is-live'));
  });
  document.documentElement.dataset.mode = 'live';
}
