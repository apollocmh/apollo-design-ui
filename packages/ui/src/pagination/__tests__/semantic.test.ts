/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— Pagination
 *
 * 基准：`tests/compat/baselines/pagination.dom.json`（机械 oracle，23 用例）。`keepStyle: false`。
 *
 * ⚠️ 基线只钉**参数驱动的静态形态**（值 / 模式 / 装饰 / 功能开关 / 状态 / aria 透传）——
 *    点击改值、快速跳转的输入过滤、尺寸切换链路是运行时行为，SSR 取不到；
 *    那部分由 `pagers.test.ts`（L1 页码判定表）与 `index.test.ts`（L2）钉。
 *
 * ⚠️ `getPopupContainer` 的 DOM 位置（尺寸切换器的 Select 浮层挂在 `triggerNode.parentNode`）
 *    在 SSR 下不可达（浮层走 portal，只在打开时才渲染）—— 该条**不在本基线里**，
 *    登记在 README 的缺口清单；静态帧只能验证「切换器渲染在 `-options` 内」。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';

import baseline from '../../../../../tests/compat/baselines/pagination.dom.json';
import Pagination from '../Pagination.vue';

const CASES: Record<string, () => DomRenderResult> = {
  'pagination:basic': () => h(Pagination as never, { total: 500, defaultCurrent: 3 } as never),
  'pagination:clamped': () => h(Pagination as never, { total: 30, current: 999 } as never),
  'pagination:single-page': () => h(Pagination as never, { total: 5 } as never),
  'pagination:zero': () => h(Pagination as never, { total: 0 } as never),
  'pagination:page-size': () =>
    h(Pagination as never, { total: 500, pageSize: 20, defaultCurrent: 2 } as never),
  'pagination:less-items': () =>
    h(Pagination as never, { total: 500, defaultCurrent: 10, showLessItems: true } as never),
  'pagination:jumpers-off': () =>
    h(
      Pagination as never,
      {
        total: 500,
        defaultCurrent: 10,
        showPrevNextJumpers: false,
      } as never,
    ),
  'pagination:total-text': () =>
    h(
      Pagination as never,
      {
        total: 500,
        defaultCurrent: 3,
        showTotal: (t: number) => `共 ${t} 条`,
      } as never,
    ),
  'pagination:simple': () =>
    h(Pagination as never, { total: 500, defaultCurrent: 3, simple: true } as never),
  'pagination:simple-readonly': () =>
    h(Pagination as never, { total: 500, defaultCurrent: 3, simple: { readOnly: true } } as never),
  'pagination:quick-jumper': () =>
    h(Pagination as never, { total: 500, defaultCurrent: 3, showQuickJumper: true } as never),
  'pagination:quick-jumper-button': () =>
    h(
      Pagination as never,
      {
        total: 500,
        defaultCurrent: 3,
        showQuickJumper: { goButton: true },
      } as never,
    ),
  'pagination:size-changer': () =>
    h(Pagination as never, { total: 500, defaultCurrent: 3, showSizeChanger: true } as never),
  'pagination:size-changer-options': () =>
    h(
      Pagination as never,
      {
        total: 500,
        defaultCurrent: 3,
        showSizeChanger: true,
        pageSizeOptions: [50, 10],
      } as never,
    ),
  'pagination:disabled': () =>
    h(Pagination as never, { total: 500, defaultCurrent: 3, disabled: true } as never),
  'pagination:small': () =>
    h(Pagination as never, { total: 500, defaultCurrent: 3, size: 'small' } as never),
  'pagination:large': () =>
    h(Pagination as never, { total: 500, defaultCurrent: 3, size: 'large' } as never),
  'pagination:align-center': () =>
    h(Pagination as never, { total: 500, defaultCurrent: 3, align: 'center' } as never),
  'pagination:align-end': () =>
    h(Pagination as never, { total: 500, defaultCurrent: 3, align: 'end' } as never),
  'pagination:hide-single': () =>
    h(Pagination as never, { total: 5, hideOnSinglePage: true } as never),
  'pagination:item-render': () =>
    h(
      Pagination as never,
      {
        total: 30,
        defaultCurrent: 2,
        itemRender: (page: number, type: string, el: unknown) =>
          type === 'page' ? h('b', null, `p${page}`) : (el as never),
      } as never,
    ),
  'pagination:role': () =>
    h(Pagination as never, { total: 500, defaultCurrent: 3, role: 'navigation' } as never),
  'pagination:aria': () =>
    h(
      Pagination as never,
      {
        total: 500,
        defaultCurrent: 3,
        'aria-label': '分页',
        'data-testid': 'pg',
      } as never,
    ),
};

domContractTest('Pagination', {
  baseline,
  keepStyle: false,
  allow: {},
  render: (id) => {
    const build = CASES[id];
    if (!build) {
      throw new Error(
        `[Pagination semantic.test] 基线里有用例 "${id}"，但 CASES 里没有对应构造。基线用例：` +
          baseline.cases.map((c) => c.id).join(', '),
      );
    }
    return build();
  },
});

describe('Pagination · 用例覆盖', () => {
  it('CASES 与基线一一对应（不多不少）', () => {
    expect(Object.keys(CASES).sort()).toEqual(baseline.cases.map((c) => c.id).sort());
  });
});
