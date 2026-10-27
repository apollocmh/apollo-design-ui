---
category: General
title: Button
subtitle: Button
---

A button triggers an action or navigates through a native anchor.

## When To Use

Use a button to submit a form, confirm an operation or trigger an action. Use `href` for navigation through a native link.

## Examples

All 20 original demos remain: `basic`, `block`, `chinese-chars-loading`, `chinese-space`, `color-variant`, `component-token`, `custom-disabled-bg`, `danger`, `disabled`, `ghost`, `href`, `icon`, `icon-placement`, `linear-gradient`, `loading`, `multiple`, `semantic`, `shape`, `size`, `style-class`.

## API

### Props

| Property | Description | Type | Default |
|---|---|---|---|
| type | Visual shorthand; color/variant independently override it | `ButtonType` | 'default' |
| color | Independent semantic or preset color | `ButtonColorType` | — |
| variant | Independent visual variant | `ButtonVariantType` | — |
| icon | Icon data or Vue component; #icon takes precedence | `ButtonIcon` | — |
| iconPosition | Existing deprecated alias; use iconPlacement | `ButtonIconPlacement` | — |
| iconPlacement | Icon position, ahead of the existing alias | `ButtonIconPlacement` | 'start' |
| shape | Shape; square has zero corner radius | `ButtonShape` | 'default' |
| size | Size: local, Compact, then Provider | `ButtonSize` | — |
| disabled | Disabled; explicit false overrides inherited true | `boolean` | — |
| loading | Immediately blocks activation; delay postpones the indicator | `ButtonLoading` | false |
| prefixCls | Root class prefix | `string` | apollo-btn |
| ghost | Transparent background; solid maps to outlined | `boolean` | false |
| danger | Danger color shorthand, below explicit color | `boolean` | false |
| block | Full container width | `boolean` | false |
| href | Defined renders an anchor, including an empty string | `string` | — |
| htmlType | Native button type | `ButtonHTMLType` | 'button' |
| autoInsertSpace | Visual spacing for two Chinese characters; original text is retained | `boolean` | true |
| classNames | Object classes for root/icon/content | `ButtonSemanticClassNames` | — |
| styles | Object styles for root/icon/content | `ButtonSemanticStyles` | — |

`ButtonType`: default / primary / dashed / link / text. `ButtonShape`: default / circle / round / square.
`ButtonSize`: small / medium / middle / large. `ButtonVariantType`: outlined / dashed / solid / filled / text / link.
`ButtonColorType`: default / primary / danger / blue / purple / cyan / green / magenta / pink / red / orange / yellow / volcano / geekblue / lime / gold.
`ButtonHTMLType`: button / submit / reset. `ButtonIconPlacement`: start / end.
`ButtonIcon = VNodeChild | Component`; `ButtonLoading = boolean | { delay?: number; icon?: ButtonIcon }`.

### Current configuration and native attributes

Each explicit color/variant wins independently, followed by type/danger shorthand, then current Provider values. Without a color, solid uses primary; other variants use default. Ghost maps solid to outlined. Provider replacement, removal and restoration use current values.

Vue class and all native style forms merge onto the real button/anchor root. Native style wins over semantic root style and source tokens. Native events and form attributes retain their normal behavior. Enabled anchors respect caller tabindex; disabled anchors lose href and force tabindex=-1. Prefixes require matching static CSS; genButtonStyle('my-app') generates .my-app-btn styles.

### Slots

| Name | Content |
|---|---|
| default | Complete Vue content; comments and empty fragments do not create an empty host |
| icon | Complete Vue icon content, before icon data; an intentionally empty slot hides the fallback |

The owned .apollo-btn-content receives content classes/styles. Business child VNodes, text, state and refs remain intact. Chinese spacing uses CSS and preserves the accessible text. Semantics accept objects; function forms are not part of this API.

### Emits and ref

click emits one native MouseEvent. Disabled or requested loading prevents activation/default submission and propagation; the pending delay already blocks click. Loading retains focus and exposes aria-busy/aria-disabled. Only the indicator waits for a finite positive delay; cancellation/unmount clears it, icon replacement does not restart it, and SSR creates no delay timer. Owned loading graphics are decorative. Give icon-only buttons an accessible name through aria-label.

The only expose is nativeElement: HTMLButtonElement | HTMLAnchorElement | null, including null before mount/after unmount. There is no v-model or additional focus/blur service.

### Component tokens and exports

All 45 explicit fields below and the 13 existing preset shadow fields are consumed by current theme.components.Button. Native root variables win, such as --apollo-btn-content-font-size. Numeric lengths use px; font weight and line-height remain unitless. Finite nonnegative sizes, including zero, are retained; invalid numeric sizes fall back. Removing source configuration restores inherited/static defaults.

| Token | Target |
|---|---|
| fontWeight | Font weight |
| iconGap | Icon/content gap |
| defaultShadow | Shadow |
| primaryShadow | Shadow |
| dangerShadow | Shadow |
| primaryColor | Corresponding color/state foreground, background or border |
| defaultColor | Corresponding color/state foreground, background or border |
| defaultBg | Corresponding color/state foreground, background or border |
| defaultBorderColor | Corresponding color/state foreground, background or border |
| dangerColor | Corresponding color/state foreground, background or border |
| defaultHoverBg | Corresponding color/state foreground, background or border |
| defaultHoverColor | Corresponding color/state foreground, background or border |
| defaultHoverBorderColor | Corresponding color/state foreground, background or border |
| defaultActiveBg | Corresponding color/state foreground, background or border |
| defaultActiveColor | Corresponding color/state foreground, background or border |
| defaultActiveBorderColor | Corresponding color/state foreground, background or border |
| borderColorDisabled | Corresponding color/state foreground, background or border |
| defaultBorderColorDisabled | Corresponding color/state foreground, background or border |
| groupBorderColor | Group/Compact seams |
| defaultGhostColor | Corresponding color/state foreground, background or border |
| ghostBg | Corresponding color/state foreground, background or border |
| defaultGhostBorderColor | Corresponding color/state foreground, background or border |
| solidTextColor | Corresponding color/state foreground, background or border |
| textTextColor | Corresponding color/state foreground, background or border |
| textTextHoverColor | Corresponding color/state foreground, background or border |
| textTextActiveColor | Corresponding color/state foreground, background or border |
| paddingInline | Size-specific padding |
| paddingInlineLG | Size-specific padding |
| paddingInlineSM | Size-specific padding |
| paddingBlock | Size-specific padding |
| paddingBlockLG | Size-specific padding |
| paddingBlockSM | Size-specific padding |
| onlyIconSize | Icon-only size |
| onlyIconSizeLG | Icon-only size |
| onlyIconSizeSM | Icon-only size |
| linkHoverBg | Corresponding color/state foreground, background or border |
| textHoverBg | Corresponding color/state foreground, background or border |
| contentFontSize | Size-specific font size |
| contentFontSizeLG | Size-specific font size |
| contentFontSizeSM | Size-specific font size |
| contentLineHeight | Size-specific line height |
| contentLineHeightLG | Size-specific line height |
| contentLineHeightSM | Size-specific line height |
| defaultBgDisabled | Corresponding color/state foreground, background or border |
| dashedBgDisabled | Corresponding color/state foreground, background or border |

Preset shadows: `blueShadowColor`, `purpleShadowColor`, `cyanShadowColor`, `greenShadowColor`, `magentaShadowColor`, `pinkShadowColor`, `redShadowColor`, `orangeShadowColor`, `yellowShadowColor`, `volcanoShadowColor`, `geekblueShadowColor`, `limeShadowColor`, `goldShadowColor`.

```vue
<ConfigProvider :theme="{components:{Button:{contentFontSize:18,paddingInline:24}}}">
  <Button type="primary">Save</Button>
</ConfigProvider>
```

Default solid foreground and colored text use native CSS color functions within @supports; existing foreground tokens and native styles keep explicit control. The original fallback remains for unsupported functions. Transparent/gradient surfaces require paired caller colors. The audit records the actual browser/theme scope; this does not claim every browser has been tested.

Button, genButtonStyle and prepareButtonComponentToken are exported from @apollo-design/ui and @apollo-design/ui/button. Types include ButtonProps, ButtonRef, ButtonSlots, ButtonSlot, ButtonConfig, the enums/semantic types above, ButtonComponentToken and ButtonTokenInput. The old documented button/style/token path is not a package export.

```ts
import '@apollo-design/theme/tokens.css';
import '@apollo-design/ui/button/style.css';
// Or import '@apollo-design/ui/style.css';
```

[Contract migration](../../../../docs/migrations/button-contracts.md).
