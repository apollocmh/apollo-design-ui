import { describe, expectTypeOf, it } from 'vitest';
import { defineComponent, h, type VNodeChild } from 'vue';
import type {
  A11yAllowance,
  Allowance,
  ContractOptions,
  DemoModules,
  DomBaseline,
  DomContractOptions,
  DomNode,
  DomRenderResult,
  ProjectionProfile,
  PropsRenderFactory,
  RenderFactory,
  RenderSource,
  ThemeTokenOverride,
  ThemeVariant,
  WarningAllowance,
  WarningCapture,
  WarningRecord,
  Wrap,
} from '../index';
import {
  a11yDemoTest,
  assertAllowance,
  assertAllowances,
  assertNoUnexpectedWarnings,
  captureWarnings,
  demoTest,
  describeObserverLeaks,
  domContractTest,
  focusTest,
  mountTest,
  partitionWarnings,
  rootPropsTest,
  rtlTest,
  themeTest,
} from '../index';

/**
 * L3 类型测试（`types` project，由 vue-tsc 驱动）。
 *
 * TESTING.md T7 要求：**必须包含负例**。负例用 `@ts-expect-error` 表达 ——
 * 它的语义是「此处**应当**报错」。如果哪天类型被放宽导致这里不再报错，
 * `@ts-expect-error` 本身会变成错误，测试就会失败。
 *
 * 这一层测的不是「类型写得漂亮」，而是**契约**：
 *   - 「不允许沉默的例外」这条全包原则在类型层是否成立（`reason` 必填）
 *   - 已移除的后门是否真的回不来（`assertNoLeak: false`、`disabledRules`）
 *   - 共享契约模块的入参形状是否被钉住（改坏一个就有一处变红）
 *
 * ⚠️ 这里不重复测运行期行为 —— 那是 L1/L2 的职责。
 *
 * ⚠️⚠️ `*.test-d.ts` **会被 vitest 实际执行**（不是只做类型检查）。
 *      所以每个负例在运行期也必须是安全的 —— 本文件把非法调用全部放进
 *      **永不执行**的闭包（形如 `const bad = (): T => { … }`，只声明不调用），
 *      只留给 TS 看。这是本仓库既有的惯用法（见 `packages/utils/src/__tests__/api.test-d.ts`）。
 */

describe('Allowance · 「不允许沉默的例外」在类型层成立', () => {
  it('reason 是必填的 string', () => {
    expectTypeOf<Allowance['reason']>().toEqualTypeOf<string>();
    expectTypeOf<Allowance>().toHaveProperty('reason').toEqualTypeOf<string>();
  });

  it('deviationId 可选', () => {
    expectTypeOf<Allowance['deviationId']>().toEqualTypeOf<string | undefined>();
  });

  it('★ 负例：缺 reason 的对象字面量必须报错', () => {
    const bad = (): Allowance => {
      // @ts-expect-error reason 必填
      return { deviationId: 'D1' };
    };
    expectTypeOf(bad).toBeFunction();
  });

  it('★ 负例：reason 不接受非字符串', () => {
    const bad = (): Allowance => {
      // @ts-expect-error reason 必须是 string
      return { reason: 42 };
    };
    expectTypeOf(bad).toBeFunction();
  });

  it('assertAllowance 接受 undefined（表示「没有豁免」）', () => {
    expectTypeOf(assertAllowance).parameter(0).toEqualTypeOf<Allowance | undefined>();
    expectTypeOf(assertAllowance).returns.toBeVoid();
  });

  it('assertAllowances 接受只读数组与 undefined', () => {
    expectTypeOf(assertAllowances).parameter(0).toEqualTypeOf<readonly Allowance[] | undefined>();
  });

  it('★ 负例：assertAllowances 不接受可变数组的隐式 any 元素', () => {
    const bad = (): void => {
      // @ts-expect-error 元素类型必须是 Allowance
      assertAllowances([{ match: 'x' }], 'ctx');
    };
    expectTypeOf(bad).toBeFunction();
  });
});

describe('告警相关类型', () => {
  it('WarningAllowance 在 Allowance 之上多一个必填 match', () => {
    expectTypeOf<WarningAllowance>().toHaveProperty('match').toEqualTypeOf<string>();
    expectTypeOf<WarningAllowance>().toHaveProperty('reason').toEqualTypeOf<string>();
  });

  it('★ 负例：WarningAllowance 缺 match 必须报错', () => {
    const bad = (): WarningAllowance => {
      // @ts-expect-error match 必填
      return { reason: '有理由但没写要匹配什么' };
    };
    expectTypeOf(bad).toBeFunction();
  });

  it("WarningRecord.method 是 'error' | 'warn' 的联合", () => {
    expectTypeOf<WarningRecord['method']>().toEqualTypeOf<'error' | 'warn'>();
    expectTypeOf<WarningRecord['args']>().toEqualTypeOf<readonly unknown[]>();
  });

  it('captureWarnings 返回 WarningCapture，restore 返回 void', () => {
    expectTypeOf(captureWarnings).returns.toEqualTypeOf<WarningCapture>();
    expectTypeOf<WarningCapture['restore']>().returns.toBeVoid();
  });

  it('★ 负例：WarningRecord.method 不接受任意字符串', () => {
    const bad = (): WarningRecord => {
      // @ts-expect-error 只能是 'error' | 'warn'
      return { method: 'log', args: [], text: '' };
    };
    expectTypeOf(bad).toBeFunction();
  });

  it('partitionWarnings 的两个入参都是只读的', () => {
    expectTypeOf(partitionWarnings).parameter(0).toEqualTypeOf<readonly WarningRecord[]>();
    expectTypeOf(partitionWarnings).parameter(1).toEqualTypeOf<readonly WarningAllowance[]>();
  });

  it('assertNoUnexpectedWarnings 的 allow 可为 undefined', () => {
    expectTypeOf(assertNoUnexpectedWarnings)
      .parameter(1)
      .toEqualTypeOf<readonly WarningAllowance[] | undefined>();
  });
});

describe('RenderSource · 渲染源的形状', () => {
  it('demos 与 render 都是可选的（互斥由运行期校验）', () => {
    expectTypeOf<RenderSource>().toHaveProperty('demos').toEqualTypeOf<DemoModules | undefined>();
    expectTypeOf<RenderSource>()
      .toHaveProperty('render')
      .toEqualTypeOf<RenderFactory | undefined>();
  });

  it('Wrap 是「接一个 slot 返回 vnode」的高阶函数', () => {
    expectTypeOf<Wrap>().toEqualTypeOf<(slot: () => VNodeChild) => VNodeChild>();
  });

  it('RenderFactory 无参，PropsRenderFactory 收一个 props 字典', () => {
    expectTypeOf<RenderFactory>().toEqualTypeOf<() => VNodeChild>();
    expectTypeOf<PropsRenderFactory>().toEqualTypeOf<
      (props: Record<string, unknown>) => VNodeChild
    >();
  });

  it('DemoModules 是 glob 的产物形状（键为相对路径）', () => {
    expectTypeOf<DemoModules>().toEqualTypeOf<Record<string, unknown>>();
  });
});

describe('L4 · DOM 契约类型', () => {
  it('ProjectionProfile 是两个字面量的联合', () => {
    expectTypeOf<ProjectionProfile>().toEqualTypeOf<'contract' | 'full'>();
  });

  it('★ 负例：ProjectionProfile 不接受任意字符串', () => {
    const bad = (): ProjectionProfile => {
      // @ts-expect-error 只有 'contract' | 'full'
      return 'loose';
    };
    expectTypeOf(bad).toBeFunction();
  });

  it('DomNode 的投影结果形状', () => {
    expectTypeOf<DomNode['tag']>().toEqualTypeOf<string>();
    expectTypeOf<DomNode['class']>().toEqualTypeOf<string[]>();
    expectTypeOf<DomNode['attrs']>().toEqualTypeOf<[string, string][]>();
    expectTypeOf<DomNode['style']>().toEqualTypeOf<string[] | undefined>();
    expectTypeOf<DomNode['children']>().toEqualTypeOf<DomNode[]>();
  });

  it('ContractOptions 的三个字段都可选', () => {
    expectTypeOf<ContractOptions>()
      .toHaveProperty('profile')
      .toEqualTypeOf<ProjectionProfile | undefined>();
    expectTypeOf<ContractOptions>()
      .toHaveProperty('keepStyle')
      .toEqualTypeOf<boolean | undefined>();
    expectTypeOf<ContractOptions>()
      .toHaveProperty('ignoreAttrs')
      .toEqualTypeOf<readonly string[] | undefined>();
  });

  it('DomRenderResult 接受 HTML 字符串 / vnode / 组件本身', () => {
    // ⚠️ 这里**不能**用 `expectTypeOf<DomRenderResult>()`：`DomRenderResult` 含
    //    `VNodeChild`（递归联合），vitest 的 `toEqualTypeOf` 对它不适用 ——
    //    会报「constraint 不满足」而不是「类型不等」（实测踩过）。
    //    改用**真实赋值**做断言：三行都能编译过，契约就成立。
    const fromString: DomRenderResult = '<div></div>';
    const fromVNode: DomRenderResult = h('div');
    const fromComponent: DomRenderResult = defineComponent({
      name: 'TypeProbe',
      setup: () => () => h('i'),
    });

    // 把三个值用掉（同时保证运行期安全 —— 本文件会被实际执行）。
    expect([fromString, fromVNode, fromComponent]).toHaveLength(3);
  });

  it('DomBaseline 只锁定 cases，其余字段开放（生成脚本自己决定）', () => {
    expectTypeOf<DomBaseline>()
      .toHaveProperty('cases')
      .toEqualTypeOf<{ id: string; html: string }[] | undefined>();
    const custom: DomBaseline = { $comment: 'x', iconCount: 848, cases: [] };
    expectTypeOf(custom).toEqualTypeOf<DomBaseline>();
  });

  it('allow 的形状是「用例 id → Allowance & { diff }」', () => {
    expectTypeOf<NonNullable<DomContractOptions['allow']>>().toEqualTypeOf<
      Readonly<Record<string, Allowance & { diff: readonly string[] }>>
    >();
  });

  it('★ 负例：domContractTest 必须同时给 baseline 与 render', () => {
    const bad = (): void => {
      // @ts-expect-error 缺 baseline
      domContractTest('x', { render: () => '' });
    };
    expectTypeOf(bad).toBeFunction();
  });

  it('★ 负例：render 的返回值必须是 DomRenderResult', () => {
    const bad = (): void => {
      // @ts-expect-error 返回 symbol 不是 DomRenderResult
      domContractTest('x', { baseline: {}, render: () => Symbol('x') });
    };
    expectTypeOf(bad).toBeFunction();
  });
});

describe('themeTest · 主题态类型', () => {
  it('ThemeVariant 是四态联合', () => {
    expectTypeOf<ThemeVariant>().toEqualTypeOf<'light' | 'dark' | 'compact' | 'token-override'>();
  });

  it('★ 负例：ThemeVariant 不接受任意字符串', () => {
    const bad = (): ThemeVariant => {
      // @ts-expect-error 只有四个态
      return 'sepia';
    };
    expectTypeOf(bad).toBeFunction();
  });

  it('ThemeTokenOverride 只接受 token 允许的原始值（不是任意 unknown）', () => {
    const ok: ThemeTokenOverride = { colorPrimary: '#fff', borderRadius: 2, hashed: true };
    expectTypeOf(ok).toEqualTypeOf<ThemeTokenOverride>();

    const bad = (): ThemeTokenOverride => {
      // @ts-expect-error symbol 不是 token 允许的值类型
      return { colorPrimary: Symbol('nope') };
    };
    expectTypeOf(bad).toBeFunction();
  });
});

describe('A11y 类型', () => {
  it('A11yAllowance 在 Allowance 之上多一个必填 rule', () => {
    expectTypeOf<A11yAllowance>().toHaveProperty('rule').toEqualTypeOf<string>();
  });

  it('★ 负例：A11yAllowance 缺 rule 必须报错', () => {
    const bad = (): A11yAllowance => {
      // @ts-expect-error rule 必填
      return { reason: '有理由但没写规则名' };
    };
    expectTypeOf(bad).toBeFunction();
  });
});

describe('共享契约模块的签名被钉住', () => {
  it('七个 xxxTest 都是 (name, options) => void', () => {
    expectTypeOf(mountTest).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(demoTest).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(a11yDemoTest).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(focusTest).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(rtlTest).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(rootPropsTest).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(themeTest).parameter(0).toEqualTypeOf<string>();

    expectTypeOf(mountTest).returns.toBeVoid();
    expectTypeOf(demoTest).returns.toBeVoid();
    expectTypeOf(a11yDemoTest).returns.toBeVoid();
    expectTypeOf(focusTest).returns.toBeVoid();
    expectTypeOf(rtlTest).returns.toBeVoid();
    expectTypeOf(rootPropsTest).returns.toBeVoid();
    expectTypeOf(themeTest).returns.toBeVoid();
  });

  it('describeObserverLeaks 返回可读描述数组（不是布尔）', () => {
    expectTypeOf(describeObserverLeaks).returns.toEqualTypeOf<string[]>();
  });

  it('★ 负例：已移除的布尔后门回不来（assertNoLeak: false）', () => {
    const bad = (): void => {
      // @ts-expect-error 只接受 'auto' 或 { skip: true, reason }，布尔开关已被移除
      mountTest('x', { render: () => null, assertNoLeak: false });
    };
    expectTypeOf(bad).toBeFunction();
  });

  it('★ 负例：a11yDemoTest 不提供 disabledRules（README 明文禁止）', () => {
    const bad = (): void => {
      // @ts-expect-error disabledRules 不是合法选项
      a11yDemoTest('x', { render: () => null, disabledRules: ['color-contrast'] });
    };
    expectTypeOf(bad).toBeFunction();
  });

  it('★ 负例：mountTest 不接受 demos（只收 render）', () => {
    const bad = (): void => {
      // @ts-expect-error MountTestOptions 里没有 demos
      mountTest('x', { demos: {} });
    };
    expectTypeOf(bad).toBeFunction();
  });
});
