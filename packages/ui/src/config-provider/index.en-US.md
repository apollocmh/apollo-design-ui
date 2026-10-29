---
category: Other
title: ConfigProvider
subtitle: Global Configuration
---

Provide current theme, language, size, disabled state, direction and component defaults to an application or feature subtree.

## Demos

Eight paired examples cover prefixes, language, component defaults, size/disabled, themes, dynamic size, direction and `useConfig`.

## API

### Props

| Prop | Description | Type | Default |
|---|---|---|---|
| scopeTag | Optional native scope host. Omit to remain renderless; choose a tag valid in its HTML / SVG context | `ConfigProviderScopeTag` | — |
| prefixCls | Component DOM class prefix; custom prefixes require matching static CSS | `string` | `'apollo'` |
| iconPrefixCls | Independent icon class prefix | `string` | `'apollo-icon'` |
| getPopupContainer | Current floating-content container resolver | `(trigger?: HTMLElement) => HTMLElement \| ShadowRoot` | — |
| getTargetContainer | Scroll-target resolver for consumers such as Affix / Anchor | `() => HTMLElement \| Window` | — |
| renderEmpty | Empty-content factory; null, undefined, false and empty strings intentionally render nothing | `RenderEmptyHandler`, returning `VNodeChild` | Consumer default |
| locale | Current language data; replacement, deep edits and withdrawal preserve business content | `Locale` | Inherited; missing fragments fall back to English |
| componentSize | Control size default; explicit component props win | `'small' \| 'medium' \| 'middle' \| 'large'` | Inherited |
| componentDisabled | Disabled default; explicit false overrides inherited true | `boolean` | `false` |
| direction | Layout direction | `'ltr' \| 'rtl'` | Inherited |
| virtual | Default virtualization flag for supporting consumers | `boolean` | `true` |
| variant | Default appearance for input, selection and form controls | `'outlined' \| 'borderless' \| 'filled' \| 'underlined'` | Inherited |
| popupMatchSelectWidth | Popup-width default for Select / TreeSelect / Cascader; local props win | `boolean` | Consumer default |
| theme | Tokens, component tokens, algorithm(s) and CSS-variable prefix | `ConfigProviderThemeConfig` | Inherited |
| warning | Development warning behavior; strict=false aggregates deprecated usage | `{ strict?: boolean }` | `{}` |
| components | Defaults supported by each component contract, keyed by its consumer name; arbitrary props are not applied automatically | `Record<string, ComponentConfigLike>` | — |
| divider | Precise Divider configuration alias | `DividerConfig` | — |
| empty | Precise Empty configuration alias | `EmptyConfig` | — |
| spin | Precise Spin configuration alias | `SpinConfig` | — |
| form | Consumed Form defaults: validation messages, required marks, colon, labels and semantic styles | `FormConfig` | — |

### Inheritance and content

Undefined local values inherit, including after withdrawing a previous override. Component names merge across providers; the same component configuration is replaced as a whole. Precise aliases override the corresponding map entry, and explicit component props take precedence.

Theme tokens merge by key; component tokens merge by component name and token key. inherit=false resets inherited tokens and component tokens while retaining the CSS-variable prefix. Validation messages combine defaults, the parent FormProvider, local language and effective form configuration. Map and direct form aliases share the same channel.

The default slot accepts complete Vue content, multiple roots and conditional children. There are no business emits, model or exposed methods. Without scopeTag, provider attrs are ignored. With an explicit scopeTag, attrs land on that native host and native styles win. Choosing another host tag follows Vue's structural root-replacement behavior; theme and language updates preserve the logical content tree.

### Theme, SSR and styles

The default provider stays renderless. Client-side variable projection follows actual native roots, dynamic roots and Portal content. It preserves business nodes, respects native CSS-variable declarations and releases its own writes on withdrawal or unmount.

SSR serializes Alias variables on direct native slot roots. An opaque component that does not forward attrs, or plain text, cannot receive an automatic server-side scope. For a complete first paint, provide a valid native host, such as `<ConfigProvider scope-tag="section" :theme="theme">`. A table can use `<table><ConfigProvider scope-tag="tbody"><tr>…</tr></ConfigProvider></table>`. The default renderless provider also works inside existing tbody, ul, select and SVG contexts. Hydrate with matching configuration and content.

Published CSS includes the apollo prefix. The prefix demo imports separate build-time brand CSS. Custom CSS-variable prefixes likewise require matching consumer styles. Component tokens take effect where the component consumes them. Theme updates change variables; they do not generate selectors at runtime.

### Deprecated aliases

| Old | Replacement |
|---|---|
| autoInsertSpaceInButton | components.button.autoInsertSpace |
| dropdownMatchSelectWidth | popupMatchSelectWidth |

### Static API and composables

| API | Behavior |
|---|---|
| ConfigProvider.ConfigContext | An InjectionKey; prefer useConfigContext() for its default value |
| ConfigProvider.config / setGlobalConfig | Module-level setter accepting prefixCls, iconPrefixCls and theme; returns void. Static consumers such as Modal read their supported values; use provider props for reactive application state |
| ConfigProvider.useConfig / useConfig | Returns componentDisabled and componentSize ComputedRefs |
| useDirection / useThemeConfig | Current computed direction / theme; absent inactive theme sources yield undefined |
| useComponentConfig(name) | Lazy current configuration view; read in render/computed rather than destructuring primitive values during setup |

Locale useLocale(name) returns `[ComputedRef<fragment>, ComputedRef<code>]`; read `.value` in script. Theme useTheme().config is a writable instance ref: assignment replaces the effective configuration, deep edits do not mutate props or parents, and external source changes restore external authority.

The current development version removes unused csp, wave, popupOverflow, theme.prefixCls and the useLocaleReactive duplicate API. See the [grouped migration](../../../../docs/migrations/config-provider-contracts.md).

The nearest explicit `ThemeProvider` is a current theme source, including an empty `{}` reset to defaults. Nested `ConfigProvider` instances project that source onto their native roots. With no explicit source, existing CSS-variable inheritance remains intact.
