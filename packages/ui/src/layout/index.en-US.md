---
category: Layout
title: Layout
subtitle: Layout
---

Compose page structure with Layout, LayoutHeader, LayoutFooter, LayoutContent and LayoutSider. Layout.Header / Footer / Content / Sider remain available.

## Examples

All eleven paired demos use real Apollo components: basic, top, side, top-side, top-side-2, fixed, fixed-sider, custom-trigger, responsive, component-token and collapsible-overlay.

## Layout and structural regions

| Prop | Meaning | Type | Default |
| --- | --- | --- | --- |
| prefixCls | Complete DOM class prefix | string | Provider prefix + -layout |
| hasSider | Explicit boolean wins; otherwise current Sider nodes, arrays/Fragments and registered Siders are detected | boolean | Automatic |

Header/Footer/Content accept prefixCls only. A local prefix is used as-is. Tags are div/header/footer/main/aside. Every default slot accepts complete Vue content, including arrays, Fragments and zero, and is read during render. Nested Layout instances own independent Sider registrations. For an opaque component wrapper during SSR, supply hasSider explicitly.

## LayoutSider

| Prop | Meaning | Type | Default |
| --- | --- | --- | --- |
| collapsible | Show an owned toggle | boolean | false |
| collapsed | Controlled state; supports v-model:collapsed | boolean | Uncontrolled |
| defaultCollapsed | Uncontrolled initialization only | boolean | false |
| width | Expanded width; numbers/numeric strings use px, other CSS lengths remain intact | number or string | 200 |
| collapsedWidth | Collapsed width; zero uses the side toggle | number or string | 80 |
| reverseArrow | Reverse icon and zero-width toggle placement | boolean | false |
| trigger | Content of the owned button; null hides it unless a trigger slot exists | VNodeChild | Default icon |
| zeroWidthTriggerStyle | Native zero-width button style | CSSProperties | — |
| breakpoint | Responsive breakpoint subscription | xs/sm/md/lg/xl/xxl/xxxl | — |
| theme | Sidebar and toggle appearance | light or dark | dark |
| prefixCls | Complete DOM prefix | string | Provider prefix + -layout-sider |
| classNames | root/body classes; object or function receiving current { props } | SiderSemanticClassNames | — |
| styles | root/body styles; object or function receiving current { props } | SiderSemanticStyles | — |

Controlled requests preserve the current state until accepted by the parent. Releasing control retains the last accepted state. Later defaultCollapsed changes do not reset uncontrolled state. Collapsing retains content instances and editor drafts.

| Vue event | Payload |
| --- | --- |
| update:collapsed | boolean |
| collapse | (collapsed: boolean, type: clickTrigger or responsive) |
| breakpoint | broken: boolean |

JavaScript onCollapse/onBreakpoint listeners remain supported and update immediately. Business listeners are consumed as component events; other native listeners target the aside root.

Media listeners attach on mount. SSR never subscribes or emits business events. Enabling a breakpoint immediately reports its current match and requests responsive collapse when necessary. Replacing/removing a breakpoint cleans its listener; removal clears below while retaining collapsed state and emits no synthetic event. Unmount cleans all listeners. Maximum widths are 479.98 / 575.98 / 767.98 / 991.98 / 1199.98 / 1599.98 / 1839.98px.

## Slots, keyboard and refs

Sider #trigger takes precedence whenever present, including an intentionally empty result. Removing it restores trigger data/default content. Trigger data and the slot supply contents of the owned native button. Use text/icons; put independent interactive controls outside and set trigger=null to avoid nested buttons.

Owned toggles support Tab, Enter and Space, use type=button and expose an accessible name, expanded state and body association. A zero-width body is inert/aria-hidden while its instances remain mounted. Collapsing a focused body to zero moves focus to the owned toggle; external focus is retained. External controls own their labels, state and focus.

CSS-variable/expression collapsedWidth values use measured geometry to identify zero width and restore body interaction when nonzero. Toggle corners, borders and placement follow the current direction and reverseArrow together.

All five refs expose only nativeElement: HTMLElement or null. Menu reads the current Sider collapsed context; an explicit Menu inlineCollapsed value takes precedence.

## Attrs, Provider and theme

Native class/style, data/ARIA and listeners target each root. Style supports Vue objects, strings and arrays. Layout priority is current theme data → components.layout.style → native style. components.layout.className applies to Layout/Sider; its style configures Layout itself. Header/Footer/Content use their own attrs. Sider priority is theme data → styles.root → native style → width/collapsedWidth geometry; styles.body configures the content region.

All existing nineteen fields consume current theme.components.Layout with ConfigProvider, ThemeProvider without global injection, nested scopes and SSR. Finite nonnegative numeric lengths include zero and use px; valid CSS strings remain intact. Replacing/removing configuration restores current defaults.

Fields: bodyBg; headerBg/headerColor/headerHeight/headerPadding; footerBg/footerPadding; siderBg; triggerBg/triggerColor/triggerHeight; zeroTriggerWidth/zeroTriggerHeight; lightSiderBg/lightTriggerBg/lightTriggerColor. Deprecated colorBgBody/colorBgHeader/colorBgTrigger remain effective background fallbacks; modern fields win.

The default dark-blue Header uses colorTextLightSolid text. Dark/light sidebar text uses colorTextLightSolid/colorText. Existing native and stylesheet --apollo-layout-* variables override theme data. Internal -source-* variables carry existing field data and are not new component tokens or public API. Independent structural regions and Sider retain complete static defaults.

Family descendants in the same theme inherit native Alias overrides from their parent Layout. An unconfigured ConfigProvider preserves CSS-only variables. An explicit empty ThemeProvider isolates a distant theme, including through another unconfigured ConfigProvider.

## Styles and exports

    import '@apollo-design/theme/tokens.css';
    import '@apollo-design/ui/layout/style.css';
    import '@apollo-design/ui/layout-sider/style.css';

Layout/Header/Footer/Content use layout/style.css. Sider has its own layout-sider entry; aggregate ui/style.css is also available. Components supplied through business slots retain their own CSS imports. Custom prefixCls changes DOM names; generate matching static styles with genLayoutStyle/genSiderStyle.

Existing props/refs/semantic types remain; LayoutSlots, SiderSlots and SiderEmits describe current slots/events. Sider root-package types use LayoutSider aliases. See docs/migrations/layout-contracts.md for the native Vue corrections.
