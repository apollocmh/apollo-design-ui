import { describe, expect, it } from 'vitest';
import * as domBarrel from '../dom';
import { getElement, isVisible } from '../dom';
import * as envModule from '../env';
import * as hooksBarrel from '../hooks';
import * as barrel from '../index';
import * as isModule from '../is';
import * as observersBarrel from '../observers';
import * as warningModule from '../warning';

/**
 * L0 的 **API 形态（API Shape）测试** —— 对应 TESTING.md 七层里的 L3 在包级别的那一半
 * （符号级类型测试在 `*.test-d.ts`）。
 *
 * 为什么 barrel 需要专门测试：
 *   1. barrel 是最容易"顺手加一个导出"的地方，而每加一个就是一次永久承诺。
 *      这里把承诺显式列出来 —— 加导出必须同时改这个文件，改动就会出现在 diff 里。
 *   2. 分层约束（ARCHITECTURE.md R1/R3/R4）与禁止项（H2 无 React 运行时）
 *      在运行时是不可见的，只能在 API 形态上守住。
 *   3. 它顺带让四个 barrel 文件获得覆盖率 —— 但这是副产品，不是目的。
 */

/** 应当是函数的导出（按契约文档 §8 的最终清单）。 */
const EXPECTED_FUNCTIONS = [
  // 告警
  'warning',
  'note',
  'warningOnce',
  'noteOnce',
  'preMessage',
  'resetWarned',
  'callWarning',
  'useDevWarning',
  'devUseWarning',
  'resetDevWarned',
  // 对象工具
  'omit',
  'mergeProps',
  'isEqual',
  'get',
  'set',
  'merge',
  'mergeWith',
  'toList',
  'capitalize',
  // 调度
  'raf',
  'cancelRaf',
  'throttle',
  'debounce',
  'throttleByAnimationFrame',
  // DOM
  'canUseDom',
  'contains',
  'isVisible',
  'isStyleSupport',
  'getScroll',
  'getDOM',
  'getElement',
  'getElementFromVNode',
  'getFocusNodeList',
  'triggerFocus',
  'lockFocus',
  'useLockFocus',
  'resetFocusLock',
  // 属性透传
  'pickAttrs',
  'toNativeEventName',
  'isReactEventName',
  'needsSemanticHandling',
  'buildEventNameMap',
  // ref
  'fillRef',
  'composeRef',
  'useComposeRef',
  'supportRef',
  'supportNodeRef',
  'getNodeRef',
  // children
  'toArray',
  // composable
  'useId',
  'useDelayState',
  'useUpdateEffect',
  'useSafeState',
  'useControlledValue',
  // 观察器
  'useResizeObserver',
  'observeResize',
  'resetResizeObserver',
  'useMutationObserver',
  'observeMutation',
  'resetMutationObserver',
  // 类型判断
  'isNonNullable',
  'isRenderable',
  'isNumber',
  'isString',
  'isFunction',
  'isPlainObject',
  'isPlainObjectStrict',
  'isThenable',
  'isPrimitive',
  'isTransitionEvent',
  'isWindow',
  'isDocument',
  'isHTMLElement',
  'isDOM',
  'isVNode',
  'isElementVNode',
  'isComponentVNode',
  'isFragmentVNode',
  'isTextVNode',
  'isCommentVNode',
  'isEmptyVNode',
] as const;

/** 应当是值的导出，以及它们的运行期类型。 */
const EXPECTED_VALUES: Record<string, string> = {
  BRAND: 'string',
  BRAND_BRACKET: 'string',
  warningContextKey: 'symbol',
  SEMANTIC_MISMATCH_EVENTS: 'object',
  DEFAULT_MUTATION_OPTIONS: 'object',
  KeyCode: 'object',
  isDev: 'boolean',
  isProd: 'boolean',
  isTest: 'boolean',
};

describe('@apollo-design/utils barrel —— 公开函数面', () => {
  it.each(EXPECTED_FUNCTIONS)('导出 %s 且是函数', (name) => {
    expect(name in barrel).toBe(true);
    expect(typeof (barrel as Record<string, unknown>)[name]).toBe('function');
  });

  it('函数面没有遗漏（清单里的每一个都真的存在）', () => {
    const missing = EXPECTED_FUNCTIONS.filter((name) => !(name in barrel));
    expect(missing).toEqual([]);
  });
});

describe('@apollo-design/utils barrel —— 公开值面', () => {
  it.each(Object.keys(EXPECTED_VALUES))('导出 %s 且类型正确', (name) => {
    expect(name in barrel).toBe(true);
    expect(typeof (barrel as Record<string, unknown>)[name]).toBe(EXPECTED_VALUES[name]);
  });

  it('BRAND_BRACKET 由 BRAND 派生（Q1 裁决后只需改一处）', () => {
    expect(barrel.BRAND_BRACKET).toBe(`[${barrel.BRAND}]`);
  });
});

describe('@apollo-design/utils barrel —— 架构约束', () => {
  it('★ 不含 React 运行时概念（H2）', () => {
    // 唯二例外：event-name 家族处理的是「React 事件名」这种**入参形态**，不是 React 运行时
    const allowed = new Set(['isReactEventName', 'toNativeEventName']);
    const offenders = Object.keys(barrel).filter(
      (name) => /react|forwardref|fiber|synthetic/i.test(name) && !allowed.has(name),
    );
    expect(offenders).toEqual([]);
  });

  it('★ 改名已生效：不再暴露 isReactRenderable', () => {
    expect('isReactRenderable' in barrel).toBe(false);
    expect(typeof barrel.isRenderable).toBe('function');
  });

  it('barrel 本身没有默认导出（避免 `import utils from ...` 这种模糊用法）', () => {
    expect('default' in barrel).toBe(false);
  });

  it('★ 内部实现细节不被泄漏到公共入口', () => {
    // 每一个都对应一处「刻意不导出」的决定，改动这里必须同时改契约文档
    const internalOnly = [
      'resetPreMessage', // preMessage 链的测试隔离辅助
      'resolveDev', // env 的纯函数判定
      'resolveTest',
      'readImportMetaEnv',
      'applyPreMessage',
      'createEmptyPlaceholder',
      'sameIdentity',
      'toSize',
      'focusable',
    ];
    for (const name of internalOnly) {
      expect(name in barrel, `${name} 不应出现在公共 API 里`).toBe(false);
    }
  });

  it('★ 不导出任何视觉语义（R3：无颜色 / 圆角 / 尺寸 / 阴影）', () => {
    const offenders = Object.keys(barrel).filter((name) =>
      /color|colour|radius|shadow|font|theme|token|palette/i.test(name),
    );
    expect(offenders).toEqual([]);
  });
});

describe('子 barrel 与源模块一致', () => {
  it('dom barrel 转发的是同一引用，不是重新包装', () => {
    expect(domBarrel.isVisible).toBe(isVisible);
    expect(domBarrel.getElement).toBe(getElement);
  });

  it('env 的纯函数判定不进公共 barrel', () => {
    expect(typeof envModule.resolveDev).toBe('function');
    expect('resolveDev' in barrel).toBe(false);
  });

  it('warning 的 resetPreMessage 不进公共 barrel', () => {
    expect(typeof warningModule.resetPreMessage).toBe('function');
    expect('resetPreMessage' in barrel).toBe(false);
  });

  it('hooks / observers 子 barrel 覆盖了顶层导出的全部 composable', () => {
    for (const name of [
      'useId',
      'useDelayState',
      'useUpdateEffect',
      'useSafeState',
      'useControlledValue',
    ]) {
      expect(name in hooksBarrel, `${name} 应在 hooks barrel 里`).toBe(true);
      expect(hooksBarrel[name as keyof typeof hooksBarrel]).toBe(
        barrel[name as keyof typeof barrel],
      );
    }
    for (const name of [
      'useResizeObserver',
      'observeResize',
      'useMutationObserver',
      'observeMutation',
    ]) {
      expect(name in observersBarrel, `${name} 应在 observers barrel 里`).toBe(true);
      expect(observersBarrel[name as keyof typeof observersBarrel]).toBe(
        barrel[name as keyof typeof barrel],
      );
    }
  });

  it('is 模块的判定函数全部被转发', () => {
    const isExports = Object.keys(isModule).filter((name) => name !== 'default');
    const missing = isExports.filter((name) => !(name in barrel));
    expect(missing).toEqual([]);
  });
});
