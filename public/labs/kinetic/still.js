// Runs synchronously in <head> (before first paint and before kinetic.js) so the
// static render is chosen without a flash. External file: the CSP allows no inline scripts (ADR-004).
if (
  /[?&]static\b/.test(location.search) ||
  matchMedia('(prefers-reduced-motion: reduce)').matches
)
  document.documentElement.classList.add('still');
