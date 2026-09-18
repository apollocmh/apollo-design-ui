/**
 * 动作集合解析。
 *
 * 契约来源：`@rc-component/trigger@3.10.1/es/hooks/useAction.js:3-21`
 * （antd 6.6.4 声明 `^3.10.1`）。逐条对照见 `docs/foundation/overlay-contract.md` §3.1。
 *
 * ---------------------------------------------------------------------------
 * 三条容易读错的地方
 * ---------------------------------------------------------------------------
 *
 * 1. `showAction ?? action` 用的是 `??` —— 只有 `undefined` 才回落到 `action`。
 *    `null` / `''` / `[]` 都会被当成"显式给了空集合"。antd Dropdown 正是靠
 *    `triggerActions = disabled ? [] : trigger` 表达禁用（`dropdown/dropdown.js:128`）。
 * 2. `toArray` 的 `val ? ... : []` 对 `''` / `0` / `false` 一律返回 `[]`。
 *    这不是"防御性编程"，是可观测行为 —— 传 `''` 必须得到空集合。
 * 3. ⭐ **`hover` 且不同时有 `click` ⇒ 自动注入 `touch`**。hover 型浮层在移动端
 *    要能点开，代价是它也会被 `touchstart` 关掉。别"顺手"去掉。
 */

/** antd 的四种触发动作 + 由 hover 隐式注入的 touch。 */
export type OverlayAction = 'hover' | 'click' | 'focus' | 'contextMenu' | 'touch';

/** `useAction` 的入参形态：单个动作、动作数组，或"未指定"。 */
export type OverlayActionInput = OverlayAction | OverlayAction[] | undefined;

/**
 * 与 rc 的 `toArray` 逐字对应（含 `val ?` 的真假判定）。
 * 不导出 —— 它是 `useAction.js:3-5` 的实现细节，不是契约。
 */
function toArray(val: OverlayActionInput): OverlayAction[] {
  return val ? (Array.isArray(val) ? val : [val]) : [];
}

/** 解析结果。`show` 与 `hide` 是两个**独立**集合 —— 可以 show 用 hover、hide 用 click。 */
export interface ResolvedActions {
  show: ReadonlySet<OverlayAction>;
  hide: ReadonlySet<OverlayAction>;
}

export interface ResolveActionsOptions {
  /**
   * 默认动作。`showAction` / `hideAction` 未指定时的回落值。
   * rc 的默认值是 `'hover'`（`index.js:31`）。
   */
  action?: OverlayActionInput;
  showAction?: OverlayActionInput;
  hideAction?: OverlayActionInput;
}

export function resolveActions(options: ResolveActionsOptions = {}): ResolvedActions {
  const { action = 'hover', showAction, hideAction } = options;

  const show = new Set<OverlayAction>(toArray(showAction ?? action));
  const hide = new Set<OverlayAction>(toArray(hideAction ?? action));

  if (show.has('hover') && !show.has('click')) {
    show.add('touch');
  }
  if (hide.has('hover') && !hide.has('click')) {
    hide.add('touch');
  }

  return { show, hide };
}

/**
 * `clickToHide` 的判定（`index.js:257`）。
 *
 * ⭐ 包含 `contextMenu` —— 右键菜单型浮层在**左键**点击时也要关。
 * 这条单独拎出来是因为它极易漏，漏了以后右键菜单要点两下外部才关。
 */
export function isClickToHide(hide: ReadonlySet<OverlayAction>): boolean {
  return hide.has('click') || hide.has('contextMenu');
}
