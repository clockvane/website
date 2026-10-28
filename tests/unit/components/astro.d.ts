/** Plain tsc does not load Astro's language server; runtime factories are tested here. */
declare module '*.astro' {
  const component: Parameters<
    import('astro/container').experimental_AstroContainer['renderToString']
  >[0];
  export default component;
}
