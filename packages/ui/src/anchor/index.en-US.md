---
category: Navigation
title: Anchor
subtitle: Anchor
---

# Anchor

Native links form a table of contents and track sections in the actual scrolling container. Items and default-slot composition share the same scrolling, indicator and Affix chain.

```vue
<Anchor :get-container="() => scrollArea" :affix="false" @click="onClick" @change="onChange">
  <AnchorLink href="#intro">
    <template #title><strong>Introduction</strong></template>
    <AnchorLink href="#details" title="Details" />
  </AnchorLink>
</Anchor>
```

## Anchor Props

| Prop | Description | Type | Default |
| --- | --- | --- | --- |
| items | Recursive link data; a present default slot overrides it, including an empty slot | AnchorLinkItemProps[] | — |
| direction | Navigation arrangement | vertical \| horizontal | vertical |
| offsetTop | Affix top offset, wrapper maximum height and fallback scroll offset | number | — |
| bounds | Active-section tolerance | number | 5 |
| targetOffset | Scroll and detection offset, before offsetTop | number | — |
| affix | Use Affix; an object retains dynamic offsetBottom/prefixCls configuration | boolean \| AnchorAffixConfig | true |
| showInkInFixed | Show the indicator without Affix | boolean | false |
| getContainer | Actual scroll target; omitted: Provider.getTargetContainer, then window | () => HTMLElement \| Window \| null \| undefined | — |
| getCurrentAnchor | Pure highlight mapping; removal restores the raw href without changing event payloads | (activeLink: string) => string | — |
| replace | Use replaceState; link-level settings take precedence | boolean | false |
| prefixCls | Current component prefix and the default prefix of its Links | string | apollo-anchor |
| classNames | root/item/itemTitle/indicator classes or a function receiving { props } | AnchorSemanticClassNames \| function | — |
| styles | Corresponding Vue CSSProperties or a function receiving { props } | AnchorSemanticStyles \| function | — |

A null/undefined container is explicitly pending: it releases the old listener and active detection without selecting window. Reactive template refs, Provider replacement and offset changes synchronize the current chain.

## Owned events

| Component/event | Payload | Description |
| --- | --- | --- |
| Anchor change | currentActiveLink: string | The original href; highlight mapping does not change it |
| Anchor click | event: MouseEvent, link: AnchorLinkInfo | Before selection, scrolling and history operations |
| AnchorLink click | event: MouseEvent, link: AnchorLinkInfo | The same native event, before Anchor's aggregate notification |

Link info is `{ href, title }`, preserving full title content. Any click listener may preventDefault to cancel selection, scrolling and history. Notification uses emits once, without manually invoking listeners again. Templates use @click/@change; programmatic listeners retain onClick/onChange.

Modifiers, nonprimary buttons, download, new browsing contexts and external links keep native browser navigation. Plain same-document fragments resolve against their owning document and support native mouse and Enter activation. No extra arrow-key or focus model is introduced. Explicit replace uses replaceState for same-page fragments and retains location.replace for ordinary external URLs.

## Items, Link and slots

| Data field | Description |
| --- | --- |
| key | Required string/number business key in items |
| href | Required native link address |
| title | Required VNodeChild in items, including zero, empty values, arrays and components |
| target | Native a.target |
| className | Existing item/Link wrapper class |
| replace | Override the parent history behavior |
| targetOffset | Link-level scroll/detection offset, before component offsets |
| prefixCls | Explicit Link prefix |
| children | Recursive items only; horizontal navigation does not render nested links |

AnchorLink (also Anchor.Link) requires href. Its title data is optional so templates can use #title. There is no children prop; nested links use its default slot.

| Component/slot | Responsibility |
| --- | --- |
| Anchor default | Supported Vue composition; presence overrides items, including conditional empty content |
| AnchorLink title | Complete native anchor content; presence overrides title data even when empty or zero |
| AnchorLink default | Existing vertical nested-link composition |

Anchor and Link expose no public imperative control API or new v-model. Affix retains its own change event and updatePosition method.

## Native attrs, Provider and Tokens

Anchor native attrs/class/style belong to its wrapper, outside the inner navigation and inside Affix. Precedence is Provider, component semantic styles, then native attrs. Link class/style/data/id retain their item wrapper; aria-*, tabindex and native focus/keyboard listeners belong to the actionable a. Active links default to aria-current="location". Conditional contents, same-key item replacement and configuration updates preserve nodes and focus.

The current Provider prefix, direction, component configuration and theme remain reactive. Links inherit the current Anchor prefix unless explicitly overridden. Native dir lets logical CSS consume direction. The two component Tokens are linkPaddingBlock (paddingXXS by default) and linkPaddingInlineStart (padding); they project onto the actual consuming layer. Replacement, removal and explicit zero work, and existing aliases retain their derived roles.

## Resources and migration

Listeners start after mounting. New targets, changed configuration, container switches and unmount cancel stale scroll animations. Each link owns registration, so removing one duplicate href does not remove the others. The indicator tracks direction, content and actual sizes; observations and frames are released on unmount. SSR starts no browser effects. No position polling, router adapter or controlled-highlight model is added.

onClick/onChange are owned emits; the old claim that multiple arguments cannot be emitted is removed. Default composition no longer produces an upstream-derived deprecation warning. Replace the unused children prop with the default slot and use #title for content. A custom Anchor prefix now also owns its Links' default classes, keeping ink lookup consistent. The historical DOM baseline remains intact with exact prefix and native-dir differences.

## Demos

basic, horizontal, onChange, onClick, replace, target-offset, target-offset-per-link, customize-highlight, static, style-class, component-token and bounds. The Token demo uses real ConfigProvider.components.Anchor.
