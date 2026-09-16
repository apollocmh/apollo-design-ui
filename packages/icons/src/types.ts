/**
 * 类型契约。
 *
 * `AbstractNode` / `IconDefinition` / `ThemeType` **直接复用** `@ant-design/icons-svg` 的类型声明，
 * 不在这里重新声明一份。理由：
 *   这两者之间传递的是**数据**（图标路径的抽象节点），类型只是它的结构描述。
 *   自己抄一份会在上游改结构时静默漂移，而结构漂移的表现是「图标画错」——最难发现的一类回归。
 *   `@ant-design/icons` 自己也是这么做的（`import type { IconDefinition } from '@ant-design/icons-svg/lib/types'`）。
 *
 * 我们与 antd 的差别只在深导入路径：用 `es/types` 而不是 `lib/types`，与生成物里
 * `@ant-design/icons-svg/es/asn/*` 的导入保持同一棵目录树。
 */

import type { TwoToneColor } from './two-tone-color';

export type {
  AbstractNode,
  IconDefinition,
  ThemeType,
  ThemeTypeUpperCase,
} from '@ant-design/icons-svg/es/types';

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
