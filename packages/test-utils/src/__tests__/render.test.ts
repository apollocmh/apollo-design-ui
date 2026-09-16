/**
 * `render.ts` 的契约测试 —— 「渲染源 → 用例」这条解析规则。
 *
 * 它是 `demoTest` / `rtlTest` / `themeTest` / `a11yDemoTest` 四个模块的**共同地基**。
 * 这条规则如果有第二种实现，四个模块就会对「什么叫一个 demo」给出不同答案（T2 禁止的重复）。
 * 所以这里重点覆盖三件事：
 *
 *   1. `import.meta.glob` 的 `{ default: Component }` 形状能被解析（生产路径）
 *   2. 解析不了的形状**抛错**而不是静默渲染空内容
 *   3. `update()` 走的是**更新**而不是重新挂载（否则「更新不抛错」这条断言是假的）
 */

import { describe, expect, it } from 'vitest';
import { defineComponent, h, ref, type VNode } from 'vue';

import { collectRenderCases, mountCase } from '../render';
import { demoKey, demoModules, PlainBox } from './fixture';
import { need } from './test-first';

describe('collectRenderCases · render 分支', () => {
  it('render 工厂 → 单用例，id 固定为 (render)', () => {
    const cases = collectRenderCases({ render: () => h(PlainBox) }, 'x');
    expect(cases.map((item) => item.id)).toEqual(['(render)']);
  });

  it('render 工厂产出的 vnode 可被挂载', () => {
    const [item] = collectRenderCases({ render: () => h(PlainBox) }, 'x');
    const mounted = mountCase(need(item, 'collectRenderCases({ render }) 的首个用例').render);
    expect(mounted.html()).toContain('fixture-box');
    mounted.destroy();
  });
});

describe('collectRenderCases · demos 分支', () => {
  it('每个 glob 键产出一个用例，id 就是键本身', () => {
    const modules = demoModules({ [demoKey('a')]: PlainBox, [demoKey('b')]: PlainBox });
    const cases = collectRenderCases({ demos: modules }, 'x');
    expect(cases.map((item) => item.id)).toEqual([demoKey('a'), demoKey('b')]);
  });

  it('⭐ 键被排序 —— glob 的键顺序由 Vite 决定，不排序会让用例顺序随构建细节漂移', () => {
    // 刻意按逆序喂进去
    const modules = demoModules({
      [demoKey('c')]: PlainBox,
      [demoKey('a')]: PlainBox,
      [demoKey('b')]: PlainBox,
    });
    const cases = collectRenderCases({ demos: modules }, 'x');
    expect(cases.map((item) => item.id)).toEqual([demoKey('a'), demoKey('b'), demoKey('c')]);
  });

  it('空 demos → 空用例列表（不抛错，由调用方的 expectCount 负责发现）', () => {
    expect(collectRenderCases({ demos: {} }, 'x')).toEqual([]);
  });

  it('demos 里每一项的 render 惰性求值：不调用 render 就不会解析', () => {
    // 放一个解析不了的值进去 —— 只要不调用 render，收集阶段就不该炸。
    const cases = collectRenderCases({ demos: { 'bad.vue': 42 } }, 'x');
    expect(cases).toHaveLength(1);
    expect(() =>
      need(cases[0], "collectRenderCases({ demos: { 'bad.vue': 42 } }) 的首个用例").render(),
    ).toThrow();
  });
});

describe('collectRenderCases · 入参校验', () => {
  it('demos 与 render 同时给 → 抛错（互斥）', () => {
    expect(() => collectRenderCases({ demos: {}, render: () => h(PlainBox) }, 'label-x')).toThrow(
      /demos 与 render 互斥/,
    );
  });

  it('两者都不给 → 抛错，且错误信息里给出正确写法', () => {
    expect(() => collectRenderCases({}, 'label-y')).toThrow(/必须提供 demos 或 render/);
    expect(() => collectRenderCases({}, 'label-y')).toThrow(/import\.meta\.glob/);
  });

  it('错误信息带上 label，便于定位是哪个组件', () => {
    expect(() => collectRenderCases({}, 'button')).toThrow(/\[test-utils\] button/);
  });
});

describe('resolveRenderable（经 collectRenderCases 间接覆盖）', () => {
  const renderOf = (value: unknown): VNode => {
    const cases = collectRenderCases({ demos: { 'k.vue': value } }, 'x');
    return need(
      cases[0],
      `collectRenderCases({ demos: { 'k.vue': ${String(value)} } }) 的首个用例`,
    ).render() as VNode;
  };

  it('形状 1：SFC 模块 { default: Component } —— 生产路径', () => {
    expect(() => renderOf({ default: PlainBox })).not.toThrow();
  });

  it('形状 2a：组件本身（defineComponent 的产物）', () => {
    expect(() => renderOf(PlainBox)).not.toThrow();
  });

  it('形状 2b：组件工厂（函数）', () => {
    expect(() => renderOf(() => h(PlainBox))).not.toThrow();
  });

  it('形状 2c：已经构造好的 vnode', () => {
    expect(() => renderOf(h(PlainBox))).not.toThrow();
  });

  it('null / undefined → 渲染空内容，不抛错', () => {
    expect(renderOf(null)).toBeNull();
    expect(renderOf(undefined)).toBeNull();
  });

  it('形状 3：既不是模块也不是组件 → **抛错**，不静默渲染空内容', () => {
    // 这是本模块存在感最强的一条断言：静默通过会让「demo 测试」变成一句空话。
    expect(() => renderOf(42)).toThrow(/无法解析成可渲染的组件/);
    expect(() => renderOf('a string')).toThrow(/无法解析成可渲染的组件/);
    expect(() => renderOf({ notAComponent: true })).toThrow(/无法解析成可渲染的组件/);
  });

  it('抛错信息里带上具体的 demo 键，便于定位坏文件', () => {
    expect(() => renderOf(42)).toThrow(/k\.vue/);
  });

  it('{ default: undefined } 落入形状 3 的抛错分支（不会被当成「空组件」放过）', () => {
    expect(() => renderOf({ default: undefined })).toThrow(/无法解析成可渲染的组件/);
  });
});

describe('mountCase', () => {
  it('attach 时把承载元素挂进 document.body', () => {
    const mounted = mountCase(() => h(PlainBox));
    expect(document.body.contains(mounted.host)).toBe(true);
    mounted.destroy();
    expect(document.body.contains(mounted.host)).toBe(false);
  });

  it('attach: false 时不进 document.body，但 html() 仍可用', () => {
    const mounted = mountCase(() => h(PlainBox), { attach: false });
    expect(document.body.contains(mounted.host)).toBe(false);
    expect(mounted.html()).toContain('fixture-box');
    mounted.destroy();
  });

  it('html() 返回的是承载元素的内容（多根组件也能完整取到）', () => {
    const Multi = defineComponent({
      name: 'FixtureMultiRoot',
      setup() {
        return () => [h('i', { class: 'a' }), h('b', { class: 'b' })];
      },
    });
    const mounted = mountCase(() => h(Multi));
    expect(mounted.html()).toContain('class="a"');
    expect(mounted.html()).toContain('class="b"');
    mounted.destroy();
  });

  it('⭐ html() 不含挂载容器那层包装（回归：曾把 data-v-app 当成「我们多出的属性」）', () => {
    const mounted = mountCase(() => h(PlainBox));
    // 实测结构：host > div[data-v-app] > 产物。契约比对必须只看第三层。
    expect(mounted.html()).not.toContain('data-v-app');
    expect(mounted.html()).toBe('<div class="fixture-box">box</div>');
    mounted.destroy();
  });

  it('html() 在 attach: false 下同样不含包装层', () => {
    const mounted = mountCase(() => h(PlainBox), { attach: false });
    expect(mounted.html()).toBe('<div class="fixture-box">box</div>');
    mounted.destroy();
  });

  it('⭐ update() 走更新而非重新挂载 —— 组件实例保持同一个', async () => {
    let setups = 0;
    const Probe = defineComponent({
      name: 'FixtureSetupCounter',
      setup() {
        setups += 1;
        return () => h('div', 'probe');
      },
    });

    const mounted = mountCase(() => h(Probe));
    expect(setups).toBe(1);

    await mounted.update();
    await mounted.update();

    // 重新挂载会让 setups 变成 3；更新路径下仍然是 1。
    expect(setups).toBe(1);
    mounted.destroy();
  });

  it('⭐ update() 会重新调用 render 工厂（这是它的直接契约）', async () => {
    let calls = 0;
    const mounted = mountCase(() => {
      calls += 1;
      return h(PlainBox);
    });
    expect(calls).toBe(1);
    await mounted.update();
    await mounted.update();
    expect(calls).toBe(3);
    mounted.destroy();
  });

  it('update() 之后 DOM 被重新 patch（不是空操作）', async () => {
    // 注意：必须用**响应式**数据。改一个普通闭包变量，Vue 没有理由重跑子组件的
    // render —— 那是 Vue 的正常语义，不是 update() 的缺陷（见 render.ts 注释）。
    const label = ref('first');
    const Probe = defineComponent({
      name: 'FixtureReactive',
      setup() {
        return () => h('div', label.value);
      },
    });

    const mounted = mountCase(() => h(Probe));
    expect(mounted.html()).toContain('first');

    label.value = 'second';
    await mounted.update();
    expect(mounted.html()).toContain('second');
    mounted.destroy();
  });

  it('wrap 包裹 render 的产物（Provider 由调用方注入）', () => {
    const Wrapper = defineComponent({
      name: 'FixtureWrap',
      setup(_props, { slots }) {
        return () => h('section', { class: 'wrapped' }, slots.default?.());
      },
    });
    const mounted = mountCase(() => h(PlainBox), {
      wrap: (slot) => h(Wrapper, null, { default: slot }),
    });
    expect(mounted.html()).toContain('class="wrapped"');
    expect(mounted.html()).toContain('fixture-box');
    mounted.destroy();
  });

  it('destroy() 幂等：连续调用两次不抛错', () => {
    const mounted = mountCase(() => h(PlainBox));
    mounted.destroy();
    expect(() => mounted.destroy()).not.toThrow();
  });

  it('多个 mountCase 并存时互不干扰（各自有独立承载元素）', () => {
    const first = mountCase(() => h(PlainBox, { label: 'first' }));
    const second = mountCase(() => h(PlainBox, { label: 'second' }));

    expect(first.host).not.toBe(second.host);
    expect(first.html()).toContain('first');
    expect(first.html()).not.toContain('second');
    expect(second.html()).toContain('second');

    first.destroy();
    // 销毁第一个不影响第二个
    expect(second.html()).toContain('second');
    expect(document.body.contains(second.host)).toBe(true);
    second.destroy();
  });

  it('destroy() 后 update() 不抛错（已卸载的 wrapper 上 bump 版本是安全的）', async () => {
    const mounted = mountCase(() => h(PlainBox));
    mounted.destroy();
    await expect(mounted.update()).resolves.toBeUndefined();
  });
});
