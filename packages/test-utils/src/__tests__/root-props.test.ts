/**
 * `root-props-test.ts` 的契约测试。
 *
 * 覆盖两类：
 *   1. **纯函数** `collectRootPropFailures` —— 判定逻辑的全部失败分支
 *   2. **真实注册** `rootPropsTest` —— 正确实现通过 / 泄漏被抓住 / 结构错误抛出
 *
 * 其中「正确实现通过」这条用例同时也是 `defaultFindRoots` 的回归测试：
 * 它曾经取 `host.children`，于是拿到的是 `@vue/test-utils` 的容器 div，
 * 每个组件都会以「根[0] 缺少 rootClassName」假失败。
 */

import { describe, expect, it } from 'vitest';
import { h } from 'vue';

import { mountCase } from '../render';
import { collectRootPropFailures, ROOT_PROPS_DEFAULTS, rootPropsTest } from '../root-props-test';
import { RootPropsBox, RootPropsLeakBox } from './fixture';

const EXPECT = {
  rootClassName: ROOT_PROPS_DEFAULTS.rootClassName,
  rootStyle: ROOT_PROPS_DEFAULTS.rootStyle,
  prefixCls: ROOT_PROPS_DEFAULTS.prefixCls,
} as const;

/** 造一个根元素。 */
function makeRoot(classes: string, style = '', inner = ''): HTMLElement {
  const element = document.createElement('div');
  element.className = classes;
  if (style !== '') element.setAttribute('style', style);
  element.innerHTML = inner;
  return element;
}

describe('ROOT_PROPS_DEFAULTS', () => {
  it('prefixCls 默认值刻意**不是** apollo —— 否则断言没有分辨力', () => {
    // 传组件自己的默认值时，「硬编码 apollo」与「正确读取 prop」产物完全一样。
    expect(ROOT_PROPS_DEFAULTS.prefixCls).toBe('test-prefix');
    expect(ROOT_PROPS_DEFAULTS.prefixCls).not.toBe('apollo');
  });

  it('rootClassName 是单个 token（会被当 CSS 选择器用）', () => {
    expect(ROOT_PROPS_DEFAULTS.rootClassName).not.toContain(' ');
  });
});

describe('collectRootPropFailures（纯函数）', () => {
  it('三个属性都满足 → 空数组', () => {
    const root = makeRoot('test-prefix-box TEST_ROOT_CLS', 'margin-top: 1px');
    expect(collectRootPropFailures([root], EXPECT)).toEqual([]);
  });

  it('缺少 rootClassName → 报出实际类名', () => {
    const root = makeRoot('test-prefix-box', 'margin-top: 1px');
    expect(collectRootPropFailures([root], EXPECT)).toEqual([
      '根[0] 缺少 rootClassName="TEST_ROOT_CLS"，实际 [test-prefix-box]',
    ]);
  });

  it('⭐ rootClassName 下渗到子孙 → 报错（上游最核心的一条断言）', () => {
    const root = makeRoot(
      'test-prefix-box TEST_ROOT_CLS',
      'margin-top: 1px',
      '<span class="TEST_ROOT_CLS"></span>',
    );
    expect(collectRootPropFailures([root], EXPECT)).toEqual([
      '根[0] 的子孙元素上出现了 rootClassName（应当只落在根上）',
    ]);
  });

  it('rootStyle 不匹配 → 报出期望值与实际值', () => {
    const root = makeRoot('test-prefix-box TEST_ROOT_CLS', 'margin-top: 9px');
    expect(collectRootPropFailures([root], EXPECT)).toEqual([
      '根[0] 的 rootStyle["margin-top"] 期望 "1px"，实际 "9px"',
    ]);
  });

  it('rootStyle 缺失 → 实际值为空串', () => {
    const root = makeRoot('test-prefix-box TEST_ROOT_CLS');
    expect(collectRootPropFailures([root], EXPECT)).toEqual([
      '根[0] 的 rootStyle["margin-top"] 期望 "1px"，实际 ""',
    ]);
  });

  it('prefixCls 未被读取（无 `test-prefix-` 前缀类）→ 报错', () => {
    const root = makeRoot('apollo-box TEST_ROOT_CLS', 'margin-top: 1px');
    expect(collectRootPropFailures([root], EXPECT)).toEqual([
      '根[0] 没有以 "test-prefix-" 开头的类名（prefixCls 未被读取或未用于根类名），实际 [apollo-box TEST_ROOT_CLS]',
    ]);
  });

  it('prefixCls: false 时跳过前缀断言', () => {
    const root = makeRoot('apollo-box TEST_ROOT_CLS', 'margin-top: 1px');
    expect(collectRootPropFailures([root], { ...EXPECT, prefixCls: false })).toEqual([]);
  });

  it('多个根：逐根报告，且带上各自的下标', () => {
    const good = makeRoot('test-prefix-a TEST_ROOT_CLS', 'margin-top: 1px');
    const bad = makeRoot('test-prefix-b', 'margin-top: 1px');
    expect(collectRootPropFailures([good, bad], EXPECT)).toEqual([
      '根[1] 缺少 rootClassName="TEST_ROOT_CLS"，实际 [test-prefix-b]',
    ]);
  });

  it('空根列表 → 空数组（「至少一个根」由调用方另行断言）', () => {
    expect(collectRootPropFailures([], EXPECT)).toEqual([]);
  });

  it('多个 rootStyle 声明逐个校验', () => {
    const root = makeRoot('test-prefix-box TEST_ROOT_CLS', 'margin-top: 1px');
    expect(
      collectRootPropFailures([root], {
        ...EXPECT,
        rootStyle: { 'margin-top': '1px', 'padding-left': '2px' },
      }),
    ).toEqual(['根[0] 的 rootStyle["padding-left"] 期望 "2px"，实际 ""']);
  });
});

describe('rootPropsTest · 结构校验（收集阶段抛出）', () => {
  it('rootClassName 含空格 → 抛错并说明原因', () => {
    expect(() =>
      rootPropsTest('x', { render: () => h(RootPropsBox), rootClassName: 'a b' }),
    ).toThrow(/必须是单个类名 token/);
  });
});

// ---------------------------------------------------------------------------
// 真实注册
// ---------------------------------------------------------------------------

/** 正确实现 → 通过。同时是 `defaultFindRoots` 跳过挂载容器的回归测试。 */
rootPropsTest('fixture-root-props · 正确实现', {
  render: (props) => h(RootPropsBox, props),
});

/** 多根组件：默认查找应当同时取到两个根。 */
rootPropsTest('fixture-root-props · 多根', {
  render: (props) =>
    h('div', { class: 'root-props-multi' }, [
      h(RootPropsBox, { ...props, key: 'a' }),
      h(RootPropsBox, { ...props, key: 'b' }),
    ]),
  // 外层 div 才是根，所以这里显式指出要看哪一层。
  findRoots: (host) => Array.from(host.querySelectorAll('.root-props-multi > *')),
  expectCount: 2,
});

/** `prefixCls: false` 时跳过前缀断言。 */
rootPropsTest('fixture-root-props · 跳过前缀', {
  render: (props) => h(RootPropsBox, props),
  prefixCls: false,
});

/** 自定义 `containerId` 与 `props` 透传。 */
rootPropsTest('fixture-root-props · containerId 与 props', {
  render: (props) => h(RootPropsBox, props),
  containerId: 'custom-holder',
  props: { extra: 'x' },
});

/** 泄漏版：根 class 同时写到子元素上 —— 用真实挂载证明这条断言会触发。 */
describe('泄漏版夹具（证明「不下渗」这条断言不是摆设）', () => {
  it('真实挂载 RootPropsLeakBox 后，collectRootPropFailures 报出「下渗」', () => {
    const mounted = mountCase(() =>
      h(RootPropsLeakBox, {
        class: ROOT_PROPS_DEFAULTS.rootClassName,
        style: ROOT_PROPS_DEFAULTS.rootStyle,
        prefixCls: ROOT_PROPS_DEFAULTS.prefixCls,
      }),
    );

    try {
      // 默认查找：跳过挂载容器，取产物自己的根
      const roots = Array.from(mounted.content.children);
      expect(roots).toHaveLength(1);
      // 这个夹具**故意**有两处不合规：根 class 下渗，且完全没接 style。
      // 两条都要报出来 —— 断言恰好两条（而不是 toContain），
      // 这样「只报了一条」这种退化也会被发现。
      expect(collectRootPropFailures(roots, EXPECT)).toEqual([
        '根[0] 的子孙元素上出现了 rootClassName（应当只落在根上）',
        '根[0] 的 rootStyle["margin-top"] 期望 "1px"，实际 ""',
      ]);
    } finally {
      mounted.destroy();
    }
  });

  it('对照组：正确实现的夹具在同一条断言下为空数组', () => {
    const mounted = mountCase(() =>
      h(RootPropsBox, {
        class: ROOT_PROPS_DEFAULTS.rootClassName,
        style: ROOT_PROPS_DEFAULTS.rootStyle,
        prefixCls: ROOT_PROPS_DEFAULTS.prefixCls,
      }),
    );

    try {
      expect(collectRootPropFailures(Array.from(mounted.content.children), EXPECT)).toEqual([]);
    } finally {
      mounted.destroy();
    }
  });
});
