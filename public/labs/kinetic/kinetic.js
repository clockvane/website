// Concept 6 · Kinetic Editorial — type is the spectacle. Native scroll only (no scroll-jacking);
// transforms follow the scroll with a little inertia. One WebGL ripple on the CLOCKWORK band.
const still = document.documentElement.classList.contains('still');
const saveData = navigator.connection && navigator.connection.saveData;
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (x, a = 0, b = 1) => Math.min(Math.max(x, a), b);

// ticker: duplicate for a seamless loop, with a pause button (WCAG 2.2.2)
const list = document.querySelector('.tick-list');
for (const li of [...list.children]) {
  const c = li.cloneNode(true);
  c.setAttribute('aria-hidden', 'true');
  list.appendChild(c);
}
const ticker = document.querySelector('.ticker'),
  tbtn = document.querySelector('.tick-toggle');
tbtn.addEventListener('click', () => {
  const p = ticker.classList.toggle('paused');
  tbtn.setAttribute('aria-pressed', String(p));
  tbtn.textContent = p ? 'Play' : 'Pause';
});

if (!still) {
  // split headings into characters (SplitType-style), keeping the accessible name intact
  for (const el of $$('[data-split]')) {
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    const lines = el.querySelector('.ln') ? $$('.ln', el) : [el];
    for (const ln of lines) {
      const walk = (node) => {
        for (const n of [...node.childNodes]) {
          if (n.nodeType === 3) {
            const frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach((w) => {
              if (!w) return;
              if (/^\s+$/.test(w)) return frag.append(' ');
              const ws = document.createElement('span');
              ws.className = 'w';
              for (const ch of w) {
                const s = document.createElement('span');
                s.className = 'ch';
                s.textContent = ch;
                ws.append(s);
              }
              frag.append(ws);
            });
            n.replaceWith(frag);
          } else if (n.nodeType === 1) walk(n);
        }
      };
      walk(ln);
      ln.setAttribute('aria-hidden', 'true');
    }
  }
  // intro: characters rise out of their line masks
  const heroCh = $$('.hero .ch');
  heroCh.forEach((c, i) => {
    c.style.transform = 'translateY(110%)';
    c.style.transition = `transform 0.9s cubic-bezier(.16,1,.3,1) ${0.15 + i * 0.022}s`;
  });
  requestAnimationFrame(() =>
    requestAnimationFrame(() =>
      heroCh.forEach((c) => (c.style.transform = '')),
    ),
  );
  setTimeout(() => heroCh.forEach((c) => (c.style.transition = '')), 2400);

  const services = document.querySelector('.services'),
    track = document.querySelector('.track');
  const panels = $$('.panel'),
    pnum = document.querySelector('.pnum');
  const pch = panels.map((p) => ({
    ch: $$('.title .ch', p),
    mask: p.querySelector('.mask span'),
    num: p.querySelector('.num'),
  }));
  const words = $$('.recombine span'),
    statement = document.querySelector('.statement');
  const endCh = $$('.end .ch');
  let sy = scrollY,
    vel = 0,
    tx = 0,
    introDone = false;
  setTimeout(() => (introDone = true), 2400);
  const loop = () => {
    requestAnimationFrame(loop);
    const y = scrollY,
      vh = innerHeight,
      vw = innerWidth;
    vel += (y - sy - vel) * 0.18;
    sy = y;
    const sk = clamp(vel * 0.06, -10, 10);
    // hero: weight thins and characters stretch apart as you leave; velocity skews them
    if (introDone && y < vh * 1.5) {
      const hp = clamp(y / vh);
      heroCh.forEach((c, i) => {
        const wave = Math.sin(i * 0.55 - y * 0.012);
        c.style.fontVariationSettings = `"wght" ${Math.round(800 - hp * 560 + wave * 90 * hp)}`;
        c.style.transform = `translate3d(0, ${(wave * 12 * hp).toFixed(1)}px, 0) skewX(${(-sk).toFixed(2)}deg) scaleY(${(1 + hp * 0.25 * (wave + 1)).toFixed(3)})`;
      });
    }
    // services: vertical scroll drives a horizontal track; content snaps bold as a panel centres
    const r = services.getBoundingClientRect();
    if (r.top < vh && r.bottom > 0) {
      const p = clamp(-r.top / (r.height - vh));
      const goal = p * (panels.length - 1) * vw;
      tx += (goal - tx) * 0.12;
      track.style.transform = `translate3d(${(-tx).toFixed(1)}px,0,0)`;
      const f = tx / vw;
      pnum.textContent = String(Math.round(f) + 1).padStart(2, '0');
      pch.forEach((o, i) => {
        const d = i - f,
          ad = Math.min(Math.abs(d), 1.5);
        if (ad > 1.4) return;
        o.ch.forEach((c, j) => {
          const local = clamp(1 - ad * 1.6 + Math.sin(j * 0.7) * 0.08);
          c.style.fontVariationSettings = `"wght" ${Math.round(150 + 700 * local)}`;
          c.style.transform = `translate3d(${(d * (40 + j * 6)).toFixed(1)}px,0,0) skewX(${(-sk).toFixed(2)}deg)`;
        });
        o.mask.style.transform = `translate3d(0, ${(clamp(ad * 1.8) * 110).toFixed(1)}%, 0)`;
        o.num.style.transform = `translate3d(${(d * 35).toFixed(1)}vw,0,0)`;
      });
    }
    // statement: words fly in from both sides and recombine into one line
    const s = statement.getBoundingClientRect();
    if (s.top < vh && s.bottom > 0) {
      const sp = clamp((vh - s.top) / (vh * 0.9));
      const e = 1 - (1 - sp) ** 3;
      words.forEach(
        (w, i) =>
          (w.style.transform = `translate3d(${((i % 2 ? 1 : -1) * (1 - e) * (30 + i * 8)).toFixed(2)}vw, 0, 0) rotate(${((1 - e) * (i % 2 ? 6 : -6)).toFixed(2)}deg)`),
      );
    }
    // end: weight wakes up as the call to action arrives
    const en = document.querySelector('.end').getBoundingClientRect();
    if (en.top < vh) {
      const ep = clamp((vh - en.top) / vh);
      endCh.forEach(
        (c, i) =>
          (c.style.fontVariationSettings = `"wght" ${Math.round(200 + 650 * clamp(ep * 1.6 - (i % 9) * 0.04))}`),
      );
    }
  };
  requestAnimationFrame(loop);
}

// ---------- WebGL ripple over the CLOCKWORK band ----------
const band = document.querySelector('.ripple');
const startRipple = () => {
  const canvas = band.querySelector('canvas');
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
  if (!gl || still || saveData) return;
  const vs = `#version 300 es
  in vec2 p; out vec2 uv; void main(){ uv=p*.5+.5; gl_Position=vec4(p,0,1); }`;
  const fs = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform sampler2D tex; uniform vec2 m, res; uniform float t, amp, vel;
  void main(){
    vec2 a = vec2(res.x/res.y, 1.);
    float d = distance(uv*a, m*a);
    float w = sin(d*38. - t*7.) * exp(-d*5.5) * amp;
    vec2 dir = normalize(uv*a - m*a + 1e-4);
    vec2 q = uv + dir*w*.035/a + vec2(sin(uv.y*9. + t*2.)*vel*.012, 0.);
    q.x = fract(q.x + t*.015);
    float k = texture(tex, vec2(q.x, 1.-q.y)).r;
    float edge = smoothstep(.0, .9, abs(w)) * .35;
    vec3 ink = vec3(.051,.055,.043), lime = vec3(.776,.957,.196);
    o = vec4(mix(ink, lime, clamp(k + edge*k, 0., 1.)), 1.);
  }`;
  const sh = (t, s) => {
    const x = gl.createShader(t);
    gl.shaderSource(x, s);
    gl.compileShader(x);
    return x;
  };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs));
  gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const u = (n) => gl.getUniformLocation(pr, n);
  const [uM, uR, uT, uA, uV] = ['m', 'res', 't', 'amp', 'vel'].map(u);
  const tx = gl.createTexture();
  const paint = () => {
    const dpr = Math.min(devicePixelRatio || 1, 1.5),
      w = band.clientWidth,
      h = band.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    const c = document.createElement('canvas');
    c.width = 2048;
    c.height = Math.round((2048 * h) / w);
    const x = c.getContext('2d');
    x.fillStyle = '#000';
    x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = '#fff';
    x.textBaseline = 'middle';
    x.textAlign = 'center';
    x.font = `900 ${Math.round(c.height * 0.78)}px "Public Sans", sans-serif`;
    x.letterSpacing = `-${Math.round(c.height * 0.04)}px`;
    x.fillText('CLOCKWORK', c.width / 2, c.height * 0.53);
    gl.bindTexture(gl.TEXTURE_2D, tx);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.R8,
      c.width,
      c.height,
      0,
      gl.RED,
      gl.UNSIGNED_BYTE,
      toRed(x, c),
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  };
  const toRed = (x, c) => {
    const d = x.getImageData(0, 0, c.width, c.height).data,
      r = new Uint8Array(c.width * c.height);
    for (let i = 0; i < r.length; i++) r[i] = d[i * 4];
    return r;
  };
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  document.fonts.ready.then(paint);
  addEventListener('resize', paint);
  let m = [0.5, 0.5],
    amp = 0,
    last = 0,
    raf = 0,
    visible = false,
    sy = scrollY,
    v = 0;
  band.addEventListener('pointermove', (e) => {
    const b = band.getBoundingClientRect();
    m = [(e.clientX - b.left) / b.width, 1 - (e.clientY - b.top) / b.height];
    amp = 1;
    last = performance.now();
  });
  const t0 = performance.now();
  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    if (now - last > 1800) {
      const t = now / 1000;
      m = [0.5 + Math.sin(t * 0.4) * 0.35, 0.5 + Math.cos(t * 0.6) * 0.3];
      amp += (0.55 - amp) * 0.02;
    } else amp *= 0.985;
    v += (scrollY - sy - v) * 0.2;
    sy = scrollY;
    gl.uniform2fv(uM, m);
    gl.uniform2f(uR, canvas.width, canvas.height);
    gl.uniform1f(uT, (now - t0) / 1000);
    gl.uniform1f(uA, amp);
    gl.uniform1f(uV, clamp(v * 0.08, -2, 2));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const run = () => {
    if (visible && !document.hidden && !raf) raf = requestAnimationFrame(frame);
  };
  const halt = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    visible ? run() : halt();
  }).observe(band);
  document.addEventListener('visibilitychange', () =>
    document.hidden ? halt() : run(),
  );
  band.classList.add('live');
};
addEventListener('load', () =>
  'requestIdleCallback' in window
    ? requestIdleCallback(startRipple, { timeout: 1000 })
    : setTimeout(startRipple, 150),
);
