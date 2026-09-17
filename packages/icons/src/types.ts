/**
 * 类型契约。
 *
 * 这几个类型**曾经**是 `export type { … } from '@ant-design/icons-svg/es/types'`。
 * 改成自己声明的依据是 `ARCHITECTURE.md` R7：发布包运行时不得依赖 `@ant-design/*`，
 * 而类型声明会出现在 `dist/index.d.ts` 里 —— 只要还在 re-export，用户的 TS 就
 * 必须能解析到上游包，等于把运行时依赖换了个形式留了下来。
 *
 * 声明内容与上游**逐字一致**（已核对 `@ant-design/icons-svg@4.6.0` 的 `es/types.d.ts`），
 * 结构漂移的风险由两条机制兜住：
 *   - `registry/tools/gen-icons.mjs` 生成 848 份定义字面量时按这个形状产出，
 *     上游一改结构，生成物会立刻类型报错；
 *   - L4 DOM 契约把 848 个图标与 React 基线逐属性比对（`semantic.test.ts`）。
 */

import type { TwoToneColor } from './two-tone-color';

/** 图标的抽象节点（SVG 的树形描述，不是 DOM）。 */
export interface AbstractNode {
  tag: string;
  attrs: {
    [key: string]: string;
  };
  children?: AbstractNode[];
}

export type ThemeType = 'filled' | 'outlined' | 'twotone';

export type ThemeTypeUpperCase = 'Filled' | 'Outlined' | 'TwoTone';

export interface IconDefinition {
  name: string;
  theme: ThemeType;
  /**
   * TwoTone 图标是**函数**（两种颜色在渲染时才确定），其余是普通节点。
   * `createIcon` 靠 `typeof icon === 'function'` 分流，与 antd 的两个基组件等价。
   */
  icon: ((primaryColor: string, secondaryColor: string) => AbstractNode) | AbstractNode;
}

/**
 * 图标组件的公共 props。
 *
 * antd 的 `AntdIconProps` 是 `React.HTMLProps<HTMLSpanElement>` 的扩展；Vue 侧没有对应物，
 * 其余属性（`class` / `style` / `id` / `data-*` / `aria-*` / `onClick` …）走 `$attrs` 透传，
 * 由 `inheritAttrs: false` + 手工落到根 `<span>` 上控制落点（`COMPATIBILITY.md` 规则 C6）。
 */
export interface AntdIconProps {
  /** 旋转动画。等价于给根 span 与 svg 加 `-spin` 类。 */
  spin?: boolean;
  /** 顺时针旋转角度（deg）。落为 svg 的 `transform`。 */
  rotate?: number;
  /** 显式 tabindex。未给且存在 `onClick` 时兜底为 `-1`（与 antd 一致）。 */
  tabIndex?: number;
  /**
   * TwoTone 图标的双色。单值表示主色（副色由主色派生），二元组表示 `[主色, 副色]`。
   *
   * ⚠️ 与 antd 一致：**非 TwoTone 图标会吞掉这个 prop 而不是忽略它** ——
   * 声明它是为了让 `$attrs` 里不残留，从而不会以 `twotonecolor="…"` 泄漏到 DOM。
   */
  twoToneColor?: TwoToneColor;
}
