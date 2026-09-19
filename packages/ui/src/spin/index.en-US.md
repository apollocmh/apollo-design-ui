---
category: Components
group: Feedback
title: Spin
subtitle: Loading
description: Used for the loading status of a page or a block.
cover: https://mdn.alipayobjects.com/huamei_7uahnr/afts/img/A*5mC5TomY4B0AAAAAAAAAAAAADrJ8AQ/original
coverDark: https://mdn.alipayobjects.com/huamei_7uahnr/afts/img/A*i43_ToFrL8YAAAAAAAAAAAAADrJ8AQ/original
demo:
  cols: 2
---

## When To Use

When part of the page is waiting for asynchronous data or during a rendering process, an appropriate loading animation can effectively alleviate users' inquietude.

## Examples

<!-- prettier-ignore -->
<code src="./demo/basic.tsx">Basic Usage</code>
<code src="./demo/size.tsx">Size</code>
<code src="./demo/nested.tsx">Embedded mode</code>
<code src="./demo/tip.tsx">Customized description</code>
<code src="./demo/delayAndDebounce.tsx">Delay</code>
<code src="./demo/custom-indicator.tsx">Custom spinning indicator</code>
<code src="./demo/percent.tsx" version="5.18.0">Progress</code>
<code src="./demo/style-class.tsx" version="6.0.0">Custom semantic dom styling</code>
<code src="./demo/fullscreen.tsx">Fullscreen</code>
<code src="./demo/list-debug.tsx" debug>Nested in List debug</code>

## API

Common props ref：[Common props](/docs/react/common-props)

| Property | Description | Type | Default | Version | [Global Config](/components/config-provider#component-config) |
| --- | --- | --- | --- | --- | --- |
| classNames | Customize class for each semantic structure inside the component. Supports object or function. | Record<[SemanticDOM](#semantic-dom), string> \| (info: { props }) => Record<[SemanticDOM](#semantic-dom), string> | - |  | 6.0.0 |
| delay | Specifies a delay in milliseconds for loading state (prevent flush) | number (milliseconds) | - |  | × |
| description | Customize description content | VNodeChild | - | 6.3.0 | × |
| fullscreen | Display a backdrop with the `Spin` component | boolean | false | 5.11.0 | × |
| indicator | React node of the spinning indicator | VNode | - |  | 5.20.0 |
| percent | The progress percentage, when set to `auto`, it will be an indeterminate progress | number \| 'auto' | - | 5.18.0 | × |
| size | The size of Spin, options: `small`, `medium`, `middle`, `large`, `default` | string | `medium` |  | × |
| spinning | Whether Spin is visible | boolean | true |  | × |
| styles | Customize inline style for each semantic structure inside the component. Supports object or function. | Record<[SemanticDOM](#semantic-dom), CSSProperties> \| (info: { props }) => Record<[SemanticDOM](#semantic-dom), CSSProperties) | - |  | 6.0.0 |
| ~~tip~~ | Customize description content when Spin has children. Deprecated, use `description` instead | VNodeChild | - |  | × |
| ~~wrapperClassName~~ | The className of wrapper when Spin has children. Deprecated, use `classNames.root` instead | string | - |  | × |

### Static Method

- `Spin.setDefaultIndicator(indicator: VNode)`

  You can define default spin element globally.

## Semantic DOM

| Slot | Description |
|---|---|
| `root` | Root element |
| `section` | The "loading overlay" div: on root when non-nested, on inner div when nested / `fullscreen` |
| `indicator` | Indicator container (default is the `dot-holder` span) |
| `description` | Description text div |
| `container` | Container that holds the wrapped content when nested |
| ~~`tip`~~ | Deprecated, use `description` |
| ~~`mask`~~ | Deprecated, use `root` (only effective when `fullscreen`) |

## Design Token

<ComponentTokenTable component="Spin"></ComponentTokenTable>