# ConfigProvider

Vue subtree configuration with stable config, theme, locale, form, icon, size, disabled and warning provide chains. Current contracts live in [Chinese API](./index.zh-CN.md), [English API](./index.en-US.md) and the [grouped migration](../../../../docs/migrations/config-provider-contracts.md).

The default renderless tree remains valid in native HTML / SVG contexts. Client Alias projection follows actual roots and Portal content with the shared Theme CSSVarScope primitive. Native CSS-variable declarations have priority; nested providers retain their own source and release their own writes. An optional scopeTag creates an explicit native host for complete SSR scoping of opaque components or text. Theme/locale/form changes preserve the business subtree.

ThemeContext.config remains a writable deep ref, isolated from props and parent state. Replacing it replaces the effective config; external source changes reset runtime edits. ConfigProvider-specific theme merging preserves token and per-component inheritance. Component configurations merge by name and replace each same-name object; precise aliases win over map entries.

The locale API has one computed-ref tuple. Form validation reads effective map/direct configuration and inherited messages, and form-core synchronizes the entire current source. IconProvider receives the current independent icon prefix. Inactive theme sources preserve CSS-only inheritance.

The directory owns 8 paired Demos, unit/interaction, DOM, accessibility, theme, public-type, browser and actual Node SSR coverage. Associated consumer fixes close configuration propagation defects; they do not claim full acceptance of those components or the locale/form-core/icons packages. Historical reports remain dated evidence.
