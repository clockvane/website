# Components — design system v3

Status: for approval at Gate 2e · Owner: UX/UI Designer · Ticket: #125
Tokens: [tokens.json](tokens.json) · Contrast: [contrast.md](contrast.md) · Motion: [motion.md](motion.md) · Live: `public/labs/v3/`

All controls share these rules: a 2 px `color.light.focus` outline with a 2 px offset on `:focus-visible` (`color.dark.focus` in the footer), real `<a>` or `<button>` elements, and no change in size on hover.

## Pill button
| | Primary | Secondary |
|---|---------|-----------|
| Default | Fill `light.action`, label `light.onAction` | Fill `light.canvas`, 1 px `light.controlBorder`, label `light.text` |
| Hover | Fill `light.actionHover` | Fill `light.secondaryHover` |
| Active | Fill `light.actionActive`, scale 0.98 | Fill `light.secondaryActive`, scale 0.98 |
| Focus | Ring | Ring |
| Disabled | Fill `light.disabledFill`, 1 px `light.controlBorder`, label `light.disabledText`, `aria-disabled` | Same |
| Loading | Label reads "Sending…", 16 px spinner ring in `light.controlBorder`, `aria-busy`, stays the same width | Same |
| Error | Pills have no error state; the message sits beside the field in `light.error` | |

- **Sizes:** default 44 px high, 20 px side padding, 16 px, weight 600. Small 40 px high, 16 px side padding, 14 px, for the header, toolbars and demo controls.
- **On the dark band:** fill `dark.action`, label `dark.onAction`, hover `dark.actionHover`; outline `dark.controlBorder`.
- **Icon:** optional trailing arrow, 1.25em, `aria-hidden`; moves 3 px on hover.
- **Wrap:** in a `cta-row`, which centres and wraps; on phones they wrap to two lines rather than shrink.

## Text link
`light.link` with an underline at all times, hover `light.linkHover`, minimum height 44 px when it stands alone. In the footer: `dark.link` with no underline at rest, `dark.linkHover` and an underline on hover. The underline isn't needed at rest there because the group is a list of links.

## Header
Sticky at `top: 0`, height 64 px, canvas fill, 1 px `light.hairline` below.
- **Wordmark:** plain text from config, 20 px, weight 680. Link to home.
- **Below 64rem:** wordmark, small primary pill and menu button. The menu is a `<details>` with a real `<summary>`, labelled "Menu", opening a panel of 44 px links. Works without JavaScript. Escape closes it and returns focus; a click elsewhere closes it.
- **From 64rem:** adds nav links (44 px, pill hover in `light.surface`) and the Services disclosure, with the same behaviour as the menu. Panel: `lg` radius, hairline ring, `shadow.lift`, with a token beside each service.

## Service token
A rounded square in a service colour with a white glyph (`service.onService`, 5.09:1 or better).
- **Sizes:** inline 0.92em of the surrounding text, small 24 px (tabs, disclosure), large 44 px (service heading), closing row 37 px. Radius 26%.
- **Glyphs:** speech bubble (expert support), four-point spark (AI automation), browser window (website creation), four blocks (solutions). Never faces, gears or clocks.
- **Accessibility:** always `aria-hidden`; the words beside it carry the meaning, and the sentence is complete without it.
- **Motion:** in the hero only, scale 0.6 to 1 and fade, 500 ms, staggered 80 ms.

## Example screen (`shot`)
`<figure>` with `<picture>` and a `<figcaption>` label.
- **Image:** AVIF with WebP fallback, `srcset` at 320, 640 and 960 w, `sizes`, `width`, `height`, `alt`, lazy, async decoding. Pre-rendered at twice the display size so text stays crisp.
- **Card:** `lg` radius, `shadow.card`, white behind the image.
- **Label:** pill at bottom left: `light.card` fill, `light.text`, 12 px weight 600, hairline ring. Reads "Example website", "Example support request", "DRAFT · Scripted example" and so on (copy deck §3.5). Always HTML, on every copy.
- **States:** static instances lift by 4 px with `shadow.lift` on hover, where the device has hover. Screens in a moving track don't, and are never interactive. No focus state, since they aren't controls. If an image fails, the white card and the label remain, and the browser shows the alt text.
- **Loading:** the card holds its space through `width` and `height`, so there is no layout shift.

## Marquee
- **Columns:** a fixed-height stage (`light.surface`, `xxl` radius) of 3, 4 or 5 columns. Tops and bottoms fade into the surface. Alternate columns move in opposite directions.
- **Row:** full-bleed track of wide screens, maximum 120rem so the loop never shows a gap.
- **Toolbar before each marquee, in DOM order:** note "All screens are examples we designed, not client work." and a small secondary "Pause examples" button, which reads "Resume examples" when paused. All buttons share one state.
- **Pauses on:** the button (it stays paused until pressed again), hover, keyboard focus inside, off-screen, hidden tab.
- **Stopped layout (no JavaScript, reduced motion, save-data):** no loop copies, no fades, no pause button; the stage scrolls by itself, and it is focusable so keyboard users can scroll it.
- **Accessibility:** `role="group"` with a label and `aria-describedby` to the note. Copies are added by script, are `aria-hidden` with `alt=""`.

## Tabs (one place)
- **Tab:** pill 44 px with a small token and a label. Default as the secondary pill, hover `light.secondaryHover`, active `light.secondaryActive`, selected `light.action` with `light.onAction`.
- **Keyboard:** roving `tabindex`; Left, Right, Home, End move and select.
- **Without JavaScript:** the tablist is `hidden` and all four panels stack, each with its own h3. The script adds `role="tabpanel"`, so the roles exist only when they work.
- **Panel:** `light.surface`, `xl` then `xxl` radius, 20 px then 32 px padding. Head: h3, summary, "For" line, primary and secondary pills. Then 2 thumbnails on phones, 3 from 48rem.
- **Jump pills** on the overview look the same but are plain links in a named `nav`.

## AI demo
- **Copy column:** "DRAFT · Scripted example" tag, h2, lead, the explanation that it isn't live, controls.
- **Stage:** `light.surface` with a white card: example input, typed prompt (`light.surface` box), four steps, result box (`light.controlBorder` inset line), then the closing line.
- **Step states:** waiting: 20 px ring in `light.controlBorder`, `light.textMuted`. Active: ring spins, `service.automation` with a gap, `light.text`. Done: tick in `light.success`, `light.text`.
- **Result states:** waiting: `opacity: 0`, 8 px lower, space held, so nothing shifts. Shown: fades up over 500 ms.
- **Controls:** one primary toggle, "Pause example" or "Play example", hidden when finished, and a secondary "Replay example". Accessible names add "AI reply example", keeping the visible words first (WCAG 2.5.3). Escape pauses.
- **Without playback:** without JavaScript or with reduced motion, the finished state shows and the controls stay hidden. All script text stays in the DOM during playback, including the untyped part of the prompt, so assistive technology reads it in full; a text alternative and one polite status message at the end complete it.
- **Never shows** live status, run times, savings, scores or client identities.

## Story placeholder
1 px dashed `light.controlBorder`, `xl` radius, 20 px padding, "Placeholder" tag (`light.placeholderFill`, `light.placeholderText`), h3 and body with the literal `[[PLACEHOLDER: …]]` text. Prototype only. The live site omits the section until approved stories exist.

## Closing band
`light.surface`, `xl` then `xxl` radius, centred, row of four tokens, h2, lead, one primary pill. Used on Home, Services, How we work and About.

## Footer
`dark.canvas` with rounded top corners. Wordmark, tagline, footer line, Services and Company groups (`<nav>` with a labelled heading), 44 px links. Base line: copyright and location in `dark.textMuted`, above a `dark.hairline` divider. No large wordmark: the design must not lean on the name.

## Form fields (specified for the engineering ticket; not in this prototype)
Label above in `light.text` 14 px weight 600, helper in `light.textMuted`. Field: 44 px minimum, `md` radius, `light.canvas`, 1 px `light.controlBorder`.
- **Hover:** border `light.text`. **Focus:** ring. **Disabled:** `light.disabledFill`, `light.disabledText`.
- **Error:** message in `light.error` under the field, linked with `aria-describedby` and `aria-invalid`; never colour alone, since the message says what to fix.
- **Loading and success:** per copy deck §6 and §7 and [microcopy](../content/microcopy.md).
