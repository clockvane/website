# Evidence — ADR-005 engine bundle sizes

Measured 2026-10-30 by the tech lead for [ADR-005](../../adr/ADR-005-immersive-layer.md) (issue #109).

## Method
- Separate throw-away package (not committed, not added to `package.json`), versions from `npm view`
  on 2026-10-30: `three@0.187.0`, `ogl@1.0.11`, `@react-three/fiber@9.8.2` + `react@19.3.1` +
  `react-dom@19.3.1`, `detect-gpu@5.0.70`.
- Built with the repo's own Vite (`vite/8.3.5`, Node 24.22.1): one production build per entry,
  `target: 'es2022'`, minified, tree-shaken, `process.env.NODE_ENV = "production"`.
- Each entry imports what a realistic scene needs, not just one symbol:
  - **three-core** — `WebGLRenderer`, `Scene`, `PerspectiveCamera`, `ShaderMaterial`, `BufferGeometry`,
    `Points`, `Mesh`, `InstancedMesh`, three geometries, `FogExp2`, `DataTexture`, `Clock`, maths.
  - **three-full** — three-core plus `GLTFLoader`, `KTX2Loader`, `MeshoptDecoder`, `EffectComposer`,
    `RenderPass`, `UnrealBloomPass`, `OutputPass`, `MeshStandardMaterial`, `MeshPhysicalMaterial`,
    `PMREMGenerator`.
  - **three-webgpu** — `three/webgpu` `WebGPURenderer` (WebGL2 backend included) + one TSL node material.
  - **ogl** — the three-core scene rebuilt in OGL, plus its `GLTFLoader` and `Post`.
  - **r3f** — React root + `<Canvas>` with one mesh (React, react-dom, fiber, three).
  - **detect-gpu** — `getGPUTier()`.
- Sizes: sum of all emitted `.js` files per entry; gzip level 9 and Brotli quality 11 via `node:zlib`.

## Results (kB = 1024 bytes)
| Entry | JS files | Raw kB | gzip kB | Brotli kB |
|-------|---------:|-------:|--------:|----------:|
| three-core | 1 | 521.7 | 127.7 | 104.9 |
| three-full | 2 | 764.6 | 199.8 | 164.6 |
| three-webgpu | 1 | 792.6 | 211.6 | 171.6 |
| ogl | 1 | 79.3 | 22.9 | 19.7 |
| r3f | 1 | 1111.3 | 299.6 | 230.1 |
| detect-gpu | 1 | 6.3 | 3.1 | 2.8 |

## Other observations from the same build
- No `eval(` or `new Function(` in the three, three/webgpu or OGL output (checked with `grep`).
- `KTX2Loader` (three-full) creates its transcoder worker from a `Blob` URL (`new Worker`,
  `createObjectURL`) and needs WebAssembly; `MeshoptDecoder` also instantiates WebAssembly. Both need
  CSP changes (`worker-src blob:`, `'wasm-unsafe-eval'`) — see ADR-005 §8.
- `detect-gpu` fetches its benchmark tables from `unpkg.com` at run time by default — a third-party
  request that SEC-1 `connect-src` blocks.
- `postprocessing@6.39.5` declares `peer three >= 0.168.0 < 0.187.0`, so it cannot be installed with
  the current three release without forcing peers.
