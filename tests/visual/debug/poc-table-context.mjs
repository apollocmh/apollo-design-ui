/**
 * T0.2 PoC：Table 的 Context 切片粒度实测。
 *
 * 问题：rc-table 用 `@rc-component/context` 的 **selector 订阅**（`Cell` 只订阅
 * 「我是否落在 hover 行区间」这一位）⇒ hover 一行只重渲 2 行的单元格。
 * Vue 的 `inject` 是整体响应 ⇒ 需要实测「整体响应」到底差多少，以及
 * 「行级 provide」能不能把粒度拉回来。
 *
 * 三个变体，同一棵树（100 行 × 5 单元格）：
 *   V1  单一 `reactive` context，Cell 读 `ctx.hoverRow`      —— 天真做法
 *   V2  单一 `reactive` context + **行级 provide** 一个 `isHovered` computed
 *   V3  行级 provide + 单元格**只在 hover 状态变化时**重渲（等价于上游 selector）
 *
 * 指标：把 `hoverRow` 从 -1 改成 3 之后，**单元格组件**的 render 次数。
 */

import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
  pretendToBeVisual: true,
});
for (const key of Object.getOwnPropertyNames(dom.window)) {
  if (key in globalThis && key !== 'window' && key !== 'document') continue;
  try {
    Object.defineProperty(globalThis, key, {
      value: dom.window[key],
      configurable: true,
      writable: true,
    });
  } catch {
    /* ignore */
  }
}
globalThis.window = dom.window;
globalThis.document = dom.window.document;

const { computed, createApp, defineComponent, h, inject, nextTick, provide, reactive } =
  await import('vue');

const ROWS = 100;
const COLS = 5;

let cellRenders = 0;
let rowRenders = 0;

// ---------------------------------------------------------------------------
// V1：单一 reactive context，Cell 直接读 hoverRow
// ---------------------------------------------------------------------------
{
  cellRenders = 0;
  rowRenders = 0;
  const ctxKey = Symbol('v1');
  const ctx = reactive({ hoverRow: -1, scrollLeft: 0 });

  const Cell = defineComponent({
    name: 'V1Cell',
    setup() {
      const c = inject(ctxKey);
      return () => {
        cellRenders += 1;
        const hovered = c.hoverRow === 0; // 只要读一次，建立依赖
        return h('div', { class: ['cell', hovered ? 'hover' : ''] });
      };
    },
  });

  const Row = defineComponent({
    name: 'V1Row',
    setup() {
      return () => {
        rowRenders += 1;
        return h(
          'div',
          { class: 'row' },
          Array.from({ length: COLS }, () => h(Cell)),
        );
      };
    },
  });

  const Table = defineComponent({
    setup() {
      provide(ctxKey, ctx);
      return () =>
        h(
          'div',
          Array.from({ length: ROWS }, () => h(Row)),
        );
    },
  });

  const app = createApp(Table);
  app.mount('#app');
  await nextTick();
  cellRenders = 0;
  rowRenders = 0;
  ctx.hoverRow = 3;
  await nextTick();
  console.log(
    `V1 单一 reactive：cell 重渲 ${cellRenders} / row 重渲 ${rowRenders}（共 ${ROWS * COLS} cell）`,
  );
  app.unmount();
}

// ---------------------------------------------------------------------------
// V2：单一 reactive context + 行级 provide（每行一个 isHovered computed）
// ---------------------------------------------------------------------------
{
  cellRenders = 0;
  rowRenders = 0;
  const ctxKey = Symbol('v2');
  const rowKey = Symbol('v2-row');
  const ctx = reactive({ hoverRow: -1, scrollLeft: 0 });

  const Cell = defineComponent({
    name: 'V2Cell',
    setup() {
      const isHovered = inject(rowKey);
      return () => {
        cellRenders += 1;
        return h('div', { class: ['cell', isHovered.value ? 'hover' : ''] });
      };
    },
  });

  const Row = defineComponent({
    name: 'V2Row',
    props: { index: { type: Number, required: true } },
    setup(props) {
      const c = inject(ctxKey);
      provide(
        rowKey,
        computed(() => c.hoverRow === props.index),
      );
      return () => {
        rowRenders += 1;
        return h(
          'div',
          { class: 'row' },
          Array.from({ length: COLS }, () => h(Cell)),
        );
      };
    },
  });

  const Table = defineComponent({
    setup() {
      provide(ctxKey, ctx);
      return () =>
        h(
          'div',
          Array.from({ length: ROWS }, (_, i) => h(Row, { index: i })),
        );
    },
  });

  const app = createApp(Table);
  app.mount('#app');
  await nextTick();
  cellRenders = 0;
  rowRenders = 0;
  ctx.hoverRow = 3;
  await nextTick();
  console.log(`V2 行级 provide：cell 重渲 ${cellRenders} / row 重渲 ${rowRenders}`);
  app.unmount();
}

// ---------------------------------------------------------------------------
// V3：行级 provide + 单元格在「自己的 hover 状态」上做 shallowRef 订阅（等价上游 selector）
// ---------------------------------------------------------------------------
{
  cellRenders = 0;
  rowRenders = 0;
  const ctxKey = Symbol('v3');
  const rowKey = Symbol('v3-row');
  const ctx = reactive({ hoverRow: -1, scrollLeft: 0 });

  const Cell = defineComponent({
    name: 'V3Cell',
    setup() {
      const isHovered = inject(rowKey);
      return () => {
        cellRenders += 1;
        return h('div', { class: ['cell', isHovered.value ? 'hover' : ''] });
      };
    },
  });

  const Row = defineComponent({
    name: 'V3Row',
    props: { index: { type: Number, required: true } },
    setup(props) {
      const c = inject(ctxKey);
      // 行级 computed：只有本行命中时才翻转（其余行不触发）
      provide(
        rowKey,
        computed(() => c.hoverRow === props.index),
      );
      return () => {
        rowRenders += 1;
        return h(
          'div',
          { class: 'row' },
          Array.from({ length: COLS }, () => h(Cell)),
        );
      };
    },
  });

  const Table = defineComponent({
    setup() {
      provide(ctxKey, ctx);
      return () =>
        h(
          'div',
          Array.from({ length: ROWS }, (_, i) => h(Row, { index: i })),
        );
    },
  });

  const app = createApp(Table);
  app.mount('#app');
  await nextTick();
  cellRenders = 0;
  rowRenders = 0;
  ctx.scrollLeft = 120; // 与 hover 无关的字段：应触发 0 次
  await nextTick();
  console.log(`V3 无关字段（scrollLeft）变化：cell 重渲 ${cellRenders} / row 重渲 ${rowRenders}`);
  cellRenders = 0;
  rowRenders = 0;
  ctx.hoverRow = 3;
  await nextTick();
  console.log(`V3 行级 provide：cell 重渲 ${cellRenders} / row 重渲 ${rowRenders}`);
  app.unmount();
}

// ---------------------------------------------------------------------------
// 对照组：V1 下「无关字段」变化是否也会重渲全部 cell
// ---------------------------------------------------------------------------
{
  cellRenders = 0;
  const ctxKey = Symbol('v4');
  const ctx = reactive({ hoverRow: -1, scrollLeft: 0 });
  const Cell = defineComponent({
    setup() {
      const c = inject(ctxKey);
      return () => {
        cellRenders += 1;
        return h('div', { class: ['cell', c.hoverRow === 0 ? 'hover' : ''] });
      };
    },
  });
  const Row = defineComponent({
    setup: () => () =>
      h(
        'div',
        { class: 'row' },
        Array.from({ length: COLS }, () => h(Cell)),
      ),
  });
  const Table = defineComponent({
    setup() {
      provide(ctxKey, ctx);
      return () =>
        h(
          'div',
          Array.from({ length: ROWS }, () => h(Row)),
        );
    },
  });
  const app = createApp(Table);
  app.mount('#app');
  await nextTick();
  cellRenders = 0;
  ctx.scrollLeft = 120;
  await nextTick();
  console.log(
    `V1 无关字段（scrollLeft）变化：cell 重渲 ${cellRenders}（Vue 的属性级追踪是否生效）`,
  );
  app.unmount();
}
