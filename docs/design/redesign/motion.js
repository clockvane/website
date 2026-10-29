// ADR-004: a single controller; CSS supplies every visual and animation.
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const reducedData = matchMedia('(prefers-reduced-data: reduce)');
const connection = navigator.connection;
const scenes = [...document.querySelectorAll('.system')];
const visible = new Set();
const visited = new Set();
const allowed = () =>
  !reduced.matches && !reducedData.matches && !connection?.saveData;
function stop(scene) {
  scene.classList.remove('playing');
  scene.removeAttribute('data-running');
}
function sync() {
  for (const scene of scenes) {
    scene.querySelector('button').hidden = !allowed();
    if (!allowed()) stop(scene);
    scene.toggleAttribute(
      'data-running',
      allowed() &&
        !document.hidden &&
        visible.has(scene) &&
        scene.classList.contains('playing'),
    );
  }
}
function play(scene) {
  if (!allowed()) return;
  stop(scene);
  // Restart a bounded CSS sequence only after a visitor requests it.
  void scene.offsetWidth;
  scene.classList.add('playing');
  sync();
}
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        visible.add(entry.target);
        if (!visited.has(entry.target)) {
          visited.add(entry.target);
          play(entry.target);
        }
      } else visible.delete(entry.target);
    }
    sync();
  },
  { threshold: 0.15 },
);
for (const scene of scenes) {
  observer.observe(scene);
  scene.querySelector('button').addEventListener('click', () => play(scene));
  scene.addEventListener('animationend', (event) => {
    if (event.target.classList.contains('finish')) stop(scene);
  });
}
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') scenes.forEach(stop);
});
document.addEventListener('visibilitychange', sync);
reduced.addEventListener('change', sync);
reducedData.addEventListener('change', sync);
connection?.addEventListener('change', sync);
window.addEventListener('pagehide', () => {
  observer.disconnect();
  scenes.forEach(stop);
});
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    scenes.forEach((scene) => observer.observe(scene));
    sync();
  }
});
sync();
