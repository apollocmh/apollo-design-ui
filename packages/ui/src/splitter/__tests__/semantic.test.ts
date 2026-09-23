/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— Splitter
 *
 * 基准：`tests/compat/baselines/splitter.dom.json`（机械 oracle，9 个用例，
 * 产出者 `tests/compat/baseline/splitter.mjs`）。`keepStyle: true`。
 *
 * ⚠️ 只覆盖 SSR 路径（容器未测量 ⇒ panelSizes 落开发者原值、pxSizes 全 0 ⇒
 *    dragger disabled / 无折叠按钮）。拖拽/折叠行为由 L1 覆盖。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { defineComponent, h, provide, type VNodeChild } from 'vue';
import baseline from '../../../../../tests/compat/baselines/splitter.dom.json';
import {
  type ConfigContextValue,
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
} from '../../config-provider/context';
import { Splitter } from '../index';

/** 在指定 ConfigProvider 上下文下渲染（empty semantic 同范式）。 */
function withConfig(config: Partial<ConfigContextValue>, children: () => VNodeChild) {
  return defineComponent({
    name: 'ASplitterCompatConfigProbe',
    setup() {
      provide(configContextKey, { ...DEFAULT_CONFIG_CONTEXT, ...config });
      return () => children();
    },
  });
}

const PANELS_BASIC = () => [
  h(Splitter.Panel, null, () => 'Left'),
  h(Splitter.Panel, null, () => 'Right'),
];

/** 用例规格表：id → Vue 侧渲染产物。必须覆盖基线里的每一个用例。 */
const specs: Record<string, { render: () => DomRenderResult }> = {
  'splitter:basic': {
    render: () => h(Splitter, { style: { height: '200px' } }, () => PANELS_BASIC()),
  },
  'splitter:vertical': {
    render: () =>
      h(Splitter, { style: { height: '200px' }, orientation: 'vertical' }, () => PANELS_BASIC()),
  },
  'splitter:layout-deprecated': {
    render: () =>
      h(Splitter, { style: { height: '200px' }, layout: 'vertical' }, () => PANELS_BASIC()),
  },
  'splitter:collapsible': {
    render: () =>
      h(Splitter, { style: { height: '200px' } }, () => [
        h(Splitter.Panel, { collapsible: true, min: '20%', defaultSize: '40%' }, () => 'Left'),
        h(Splitter.Panel, { collapsible: true }, () => 'Right'),
      ]),
  },
  'splitter:collapsible-icon-custom': {
    render: () =>
      h(
        Splitter,
        { style: { height: '200px' }, collapsible: { icon: { start: 'S', end: 'E' } } },
        () => [
          h(Splitter.Panel, { collapsible: true }, () => 'Left'),
          h(Splitter.Panel, { collapsible: true }, () => 'Right'),
        ],
      ),
  },
  'splitter:multiple': {
    render: () =>
      h(Splitter, { style: { height: '200px' } }, () => [
        h(Splitter.Panel, { collapsible: true, defaultSize: '20%', min: '10%' }, () => 'Left'),
        h(Splitter.Panel, { defaultSize: '40%' }, () => 'Center'),
        h(Splitter.Panel, { max: '60%', collapsible: true }, () => 'Right'),
      ]),
  },
  'splitter:size-px': {
    render: () =>
      h(Splitter, { style: { height: '200px' }, onResize: () => {} }, () => [
        h(Splitter.Panel, { size: 100 }, () => 'Left'),
        h(Splitter.Panel, null, () => 'Right'),
      ]),
  },
  'splitter:rtl': {
    render: () =>
      withConfig({ direction: 'rtl' }, () =>
        h(Splitter, { style: { height: '200px' } }, () => [
          h(Splitter.Panel, null, () => 'Left'),
          h(Splitter.Panel, { collapsible: true }, () => 'Right'),
        ]),
      ),
  },
  'splitter:semantic': {
    render: () =>
      h(
        Splitter,
        {
          style: { height: '200px' },
          classNames: { root: 'cls-root', panel: 'cls-panel', dragger: 'cls-dragger' },
          styles: { panel: { padding: '4px' }, dragger: { default: { color: 'red' } } },
        },
        () => PANELS_BASIC(),
      ),
  },
};

domContractTest('Splitter', {
  baseline,
  keepStyle: true,
  allow: {},
  render: (id) => {
    const spec = specs[id];
    if (!spec)
      throw new Error(`[Splitter L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    return spec.render();
  },
});
