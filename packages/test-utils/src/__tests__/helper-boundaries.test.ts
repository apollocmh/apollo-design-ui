import { afterEach, expect, test, vi } from 'vitest';
import { defineComponent, h, onBeforeUnmount, onMounted, ref, Teleport } from 'vue';
import { a11yDemoTest } from '../a11y-demo-test';
import { demoTest } from '../demo-test';
import { domContractTest, normalizeStyle } from '../dom-contract';
import { focusTest } from '../focus-test';
import { collectRootPropFailures, rootPropsTest } from '../root-props-test';
import { rtlTest } from '../rtl-test';
import { themeTest } from '../theme-test';

// Exercise generated assertions directly, including deliberately broken fixtures.
// The real Vitest `test` export still owns this file's tests and cleanup hooks.
const registered = vi.hoisted(() => new Map<string, () => unknown>());
vi.mock('vitest', async (original) => ({
  ...(await original<typeof import('vitest')>()),
  describe: (_name: string, body: () => void) => body(),
  it: (name: string, body: () => unknown) => {
    registered.set(name, body);
  },
}));

async function run(name: string) {
  const body = registered.get(name);
  if (!body) throw new Error(`Missing generated assertion: ${name}`);
  return await body();
}
afterEach(() => {
  registered.clear();
  document.body.replaceChildren();
});

test('focus assertions use the component that was actually rendered, without invoking its factory again', async () => {
  let renders = 0;
  focusTest('fresh component factory', {
    render() {
      renders += 1;
      return h(
        defineComponent({
          setup(_props, { expose }) {
            const element = ref<HTMLInputElement | null>(null);
            expose({ focus: () => element.value?.focus(), blur: () => element.value?.blur() });
            return () => h('input', { ref: element });
          },
        }),
      );
    },
    refFocus: true,
  });
  await run('ref.focus() 把焦点请求转发给了焦点元素');
  expect(renders).toBe(1);
});

test('imperative focus forwarding must leave focus on the declared target', async () => {
  const elsewhere = document.createElement('button');
  document.body.append(elsewhere);
  const IncorrectFocus = defineComponent({
    setup(_props, { expose }) {
      const element = ref<HTMLInputElement | null>(null);
      expose({
        focus: () => {
          element.value?.focus();
          elsewhere.focus();
        },
      });
      return () => h('input', { ref: element });
    },
  });
  focusTest('wrong focus destination', { render: () => h(IncorrectFocus), refFocus: true });
  await expect(run('ref.focus() 把焦点请求转发给了焦点元素')).rejects.toThrow();
});

test('imperative ref assertions preserve the public method receiver', async () => {
  const Root = defineComponent({
    setup(_props, { expose }) {
      const element = ref<HTMLInputElement | null>(null);
      expose({
        get element() {
          return element.value;
        },
        focus() {
          this.element?.focus();
        },
        blur() {
          this.element?.blur();
        },
      });
      return () => h('input', { ref: element });
    },
  });
  focusTest('method receiver', { render: () => h(Root), refFocus: true });
  await expect(run('ref.focus() 把焦点请求转发给了焦点元素')).resolves.toBeUndefined();
  await expect(run('ref.blur() 把失焦请求转发给了焦点元素')).resolves.toBeUndefined();
});

test('root attrs are judged while mounted, before valid cleanup removes styles', async () => {
  const Root = defineComponent({
    inheritAttrs: false,
    props: { prefixCls: String },
    setup(props, { attrs }) {
      const element = ref<HTMLElement | null>(null);
      onBeforeUnmount(() => element.value?.removeAttribute('style'));
      return () =>
        h('div', {
          ref: element,
          class: [`${props.prefixCls}-root`, attrs.class],
          style: attrs.style,
        });
    },
  });
  rootPropsTest('cleanup root', { render: (props) => h(Root, props) });
  await expect(run('rootClassName / rootStyle / prefixCls 落在根元素上')).resolves.toBeUndefined();
});

test('root class contracts accept a legal class token without interpreting it as a CSS selector', () => {
  const root = document.createElement('div');
  root.className = 'scope:root';
  const expectations = { rootClassName: 'scope:root', rootStyle: {}, prefixCls: false } as const;
  expect(collectRootPropFailures([root], expectations)).toEqual([]);
  const descendant = document.createElement('i');
  descendant.className = 'scope:root';
  root.append(descendant);
  expect(collectRootPropFailures([root], expectations)).toEqual([
    expect.stringContaining('子孙元素'),
  ]);
});

test('rtlTest forwards the declared per-case global Teleport configuration', async () => {
  const target = document.createElement('div');
  document.body.append(target);
  const Root = defineComponent({
    setup() {
      onMounted(() => {
        if (!target.querySelector('.portal-probe')) throw new Error('Expected actual Teleport');
      });
      return () =>
        h('div', { class: 'probe-rtl' }, [
          h(Teleport, { to: target }, h('i', { class: 'portal-probe' })),
        ]);
    },
  });
  rtlTest('actual Teleport', { render: () => h(Root), global: { stubs: { teleport: false } } });
  await expect(run('渲染 (render) 时带 RTL 标记')).resolves.toBeUndefined();
  expect(target.children).toHaveLength(0);
});

test('axe node limits apply after mounted Vue updates, before an expensive scan', async () => {
  const Root = defineComponent({
    setup() {
      const ready = ref(false);
      onMounted(() => {
        ready.value = true;
      });
      return () =>
        ready.value
          ? h(
              'div',
              Array.from({ length: 5 }, (_, key) => h('i', { key })),
            )
          : h('div');
    },
  });
  a11yDemoTest('mounted update', { render: () => h(Root), maxNodes: 2 });
  const scan = vi.spyOn(axe, 'run');
  try {
    await expect(run('(render) 无 axe violation')).rejects.toThrow();
    expect(scan).not.toHaveBeenCalled();
  } finally {
    scan.mockRestore();
  }
});

test('suite helpers reject empty render selections instead of registering passing empty work', () => {
  expect(() => demoTest('empty', { demos: {} })).toThrow(/没有.*用例|至少.*用例/);
  expect(() => themeTest('empty', { render: () => h('div'), variants: [] })).toThrow(/主题态/);
  expect(() =>
    domContractTest('empty', {
      baseline: { cases: [{ id: 'x', html: '<div></div>' }] },
      only: [],
      render: () => h('div'),
    }),
  ).toThrow(/没有.*用例|至少.*用例/);
});

test('DOM rendering accepts full VNodeChild arrays and zero', async () => {
  domContractTest('content', {
    baseline: { cases: [{ id: 'x', html: '<b></b><i></i>' }] },
    render: () => [h('b'), 0, false, h('i')],
  });
  await expect(run('x')).resolves.toBeUndefined();
  domContractTest('zero', { baseline: { cases: [{ id: 'zero', html: '0' }] }, render: () => 0 });
  await expect(run('zero')).resolves.toBeUndefined();
});

test('style normalization preserves quoted content, declaration boundaries and custom property identity', () => {
  expect(normalizeStyle('content:"A B"')).not.toEqual(normalizeStyle('content:"AB"'));
  expect(normalizeStyle('content:"A;B"')).not.toEqual(normalizeStyle('content:"A;C"'));
  expect(normalizeStyle('--Brand:red')).not.toEqual(normalizeStyle('--brand:red'));
  expect(normalizeStyle('font-family:Arial Black')).not.toEqual(
    normalizeStyle('font-family:ArialBlack'),
  );
  expect(normalizeStyle('color: rgb(0, 0, 0); transform: rotate(90deg)')).toEqual(
    normalizeStyle('transform:rotate(90deg);color:rgb(0,0,0)'),
  );
});

import axe from 'axe-core';
