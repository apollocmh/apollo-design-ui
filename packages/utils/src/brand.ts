/**
 * 品牌常量。
 *
 * 为什么单独一个文件：`prefixCls` 的默认值是待裁决项 Q1（`apollo` vs `ant`）。
 * 把它收敛到一处，裁决后只改这一个常量 —— 告警前缀、CSS 变量前缀、类名前缀全部随之改变。
 *
 * ⚠️ 当前值 `apollo` 是**暂定值**。Q1 裁决前不得在任何测试里硬编码前缀字符串，
 *    一律通过 `BRAND` / `prefixCls` 派生，否则裁决后要改的地方会散落各处。
 */
export const BRAND = 'apollo';

/** 告警前缀，格式与 antd 的 `[antd: Component]` 同构。 */
export function warningPrefix(component: string): string {
  return `[${BRAND}: ${component}]`;
}

/** deprecated 聚合告警的引导文案前缀，格式与 antd 的 `[antd]` 同构。 */
export const BRAND_BRACKET = `[${BRAND}]`;
