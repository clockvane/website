// Motion controller of the v3 prototype (ADR-004): marquees, reveals, tabs, AI demo, disclosures.
(() => {
  const root = document.documentElement;
  const reduced =
    matchMedia('(prefers-reduced-motion: reduce)').matches ||
    matchMedia('(prefers-reduced-data: reduce)').matches ||
    navigator.connection?.saveData === true;

  // Disclosures close on Escape and on a click elsewhere.
  const discs = [...document.querySelectorAll('[data-disc]')];
  const closeDiscs = (except) =>
    discs.forEach((d) => {
      if (d !== except) d.open = false;
    });
  document.addEventListener('click', (e) =>
    closeDiscs(e.target.closest('[data-disc]')),
  );
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = discs.find((d) => d.open);
    if (open) {
      open.open = false;
      open.querySelector('summary').focus();
    }
  });

  // Tabs: all panels are visible without script; this turns them into a tablist.
  const tablist = document.querySelector('[data-tabs]');
  if (tablist) {
    const tabs = [...tablist.querySelectorAll('[role="tab"]')];
    const panels = tabs.map((t) =>
      document.getElementById(t.getAttribute('aria-controls')),
    );
    const select = (i, focus) => {
      tabs.forEach((t, n) => {
        t.setAttribute('aria-selected', String(n === i));
        t.tabIndex = n === i ? 0 : -1;
        panels[n].hidden = n !== i;
      });
      if (focus) tabs[i].focus();
    };
    panels.forEach((p, i) => {
      p.setAttribute('role', 'tabpanel');
      p.setAttribute('aria-labelledby', tabs[i].id);
    });
    tablist.hidden = false;
    select(0);
    tabs.forEach((t, i) => t.addEventListener('click', () => select(i)));
    tablist.addEventListener('keydown', (e) => {
      const i = tabs.indexOf(document.activeElement);
      const to = {
        ArrowRight: (i + 1) % tabs.length,
        ArrowLeft: (i - 1 + tabs.length) % tabs.length,
        Home: 0,
        End: tabs.length - 1,
      }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      select(to, true);
    });
  }

  // AI demo: the finished script is in the HTML; with motion it replays from the start.
  const demo = document.querySelector('[data-demo]');
  let startDemo = null;
  if (demo && !reduced) {
    const controls = demo.querySelector('[data-demo-controls]');
    const toggle = demo.querySelector('[data-demo-toggle]');
    const replay = demo.querySelector('[data-demo-replay]');
    const status = demo.querySelector('[data-demo-status]');
    const prompt = demo.querySelector('[data-demo-prompt]');
    const result = demo.querySelector('[data-demo-result]');
    const steps = [...demo.querySelectorAll('[data-step]')];
    const text = prompt.textContent;
    prompt.textContent = '';
    const typed = document.createElement('span');
    const caret = document.createElement('span');
    const rest = document.createElement('span');
    caret.className = 'is-caret';
    caret.setAttribute('aria-hidden', 'true');
    rest.className = 'is-typing-rest';
    prompt.append(typed, caret, rest);

    const TYPE = 2400;
    const STEP = 750;
    const END = TYPE + STEP * steps.length + 300;
    let elapsed = 0;
    let timer = 0;
    let last = 0;

    const label = (name) => {
      toggle.textContent = `${name} example`;
      toggle.setAttribute('aria-label', `${name} example: AI reply example`);
    };
    const draw = () => {
      const n = Math.min(
        text.length,
        Math.round((elapsed / TYPE) * text.length),
      );
      typed.textContent = text.slice(0, n);
      rest.textContent = text.slice(n);
      caret.hidden = n === text.length;
      steps.forEach((s, i) => {
        const from = TYPE + STEP * i;
        s.classList.toggle(
          'is-active',
          elapsed >= from && elapsed < from + STEP,
        );
        s.classList.toggle('is-done', elapsed >= from + STEP);
      });
      result.classList.toggle('is-waiting', elapsed < END);
    };
    const stop = () => {
      clearInterval(timer);
      timer = 0;
    };
    const finish = () => {
      stop();
      elapsed = END;
      draw();
      demo.dataset.state = 'done';
      label('Replay');
      toggle.hidden = true;
      status.textContent =
        'Example finished. The draft waits for review and is not sent.';
    };
    const run = () => {
      demo.dataset.state = 'running';
      label('Pause');
      toggle.hidden = false;
      status.textContent = '';
      last = performance.now();
      timer = setInterval(() => {
        const now = performance.now();
        elapsed += now - last;
        last = now;
        if (elapsed >= END) finish();
        else draw();
      }, 40);
    };
    const pause = () => {
      stop();
      demo.dataset.state = 'paused';
      label('Play');
    };
    startDemo = () => {
      stop();
      elapsed = 0;
      draw();
      run();
    };
    toggle.addEventListener('click', () =>
      demo.dataset.state === 'running' ? pause() : run(),
    );
    replay.addEventListener('click', startDemo);
    demo.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && demo.dataset.state === 'running') pause();
    });
    controls.hidden = false;
    demo.dataset.state = 'ready';
    draw();
  }

  if (reduced) return;

  // Marquees: the controller adds loop copies that assistive technology never sees.
  root.classList.add('js-motion');
  const groups = document.querySelectorAll('.track > .group');
  groups.forEach((group) => {
    const copy = group.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    copy.querySelectorAll('img').forEach((img) => (img.alt = ''));
    group.after(copy);
  });

  // One pause state for the page; once paused it stays paused until pressed again.
  const buttons = document.querySelectorAll('[data-pause]');
  buttons.forEach((b) => {
    b.hidden = false;
    b.addEventListener('click', () => {
      const paused = root.toggleAttribute('data-paused');
      buttons.forEach((x) => {
        x.textContent = paused ? 'Resume examples' : 'Pause examples';
      });
    });
  });
  document.addEventListener('visibilitychange', () =>
    root.toggleAttribute('data-hidden-tab', document.hidden),
  );

  // One observer per threshold set: one-shot reveals and demo start, then off-screen pause.
  const seen = new IntersectionObserver(
    (entries) => {
      for (const { target, isIntersecting } of entries) {
        if (isIntersecting) {
          target.classList.add('is-in');
          seen.unobserve(target);
          if (target.matches('.demo-stage') && startDemo) startDemo();
        }
      }
    },
    { threshold: 0.12 },
  );
  document
    .querySelectorAll('.reveal, .demo-stage')
    .forEach((el) => seen.observe(el));
  const onScreen = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      target.toggleAttribute('data-offscreen', !isIntersecting);
    }
  });
  document
    .querySelectorAll('[data-marquee]')
    .forEach((el) => onScreen.observe(el));
})();
