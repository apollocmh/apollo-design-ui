/**
 * Demo 画布档位的默认推断（V3 §4.3）。
 *
 * 原则：**默认值由组件类别推断，只有特殊 demo 在 frontmatter 显式声明**。
 * 组件的展示语义属于文档站，不写进组件本身；因此这里维护的是文档站的展示清单。
 */
import type { DemoMeta, DemoPreviewSize } from '../types/manifest';

/** 小控件：低留白、按内容高度，不做无意义的最小高度。 */
const COMPACT_COMPONENTS = new Set([
  'avatar',
  'badge',
  'button',
  'checkbox',
  'divider',
  'flex',
  'grid',
  'progress',
  'radio',
  'rate',
  'result',
  'segmented',
  'skeleton',
  'space',
  'spin',
  'statistic',
  'switch',
  'tag',
  'typography',
]);

/** 宽内容：Table / 复杂 Form / 布局类，始终占满一行。 */
const FULL_COMPONENTS = new Set([
  'calendar',
  'descriptions',
  'form',
  'layout',
  'list',
  'masonry',
  'splitter',
  'table',
  'transfer',
]);

export function defaultDemoSize(component: string): DemoPreviewSize {
  if (FULL_COMPONENTS.has(component)) return 'full';
  if (COMPACT_COMPONENTS.has(component)) return 'compact';
  return 'interactive';
}

export interface DemoLayout {
  size: DemoPreviewSize;
  span: 1 | 2 | 'full';
}

/** 显式声明 > 组件类别默认 > interactive。full 档默认占满一行。 */
export function resolveDemoLayout(demo: DemoMeta): DemoLayout {
  const size = demo.preview?.size ?? defaultDemoSize(demo.component);
  const span = demo.preview?.span ?? (size === 'full' ? 'full' : 1);
  return { size, span };
}
