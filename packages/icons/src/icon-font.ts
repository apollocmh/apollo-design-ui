/**
 * `createFromIconfontCN` —— 从 iconfont.cn 的远程脚本创建图标组件。
 *
 * 契约来源：`@ant-design/icons` 的 `components/IconFont.ts`。
 *
 * 机制：把 `scriptUrl` 以 `<script src>` 插入 body，iconfont 的脚本会往文档里注入一批
 * `<symbol id="…">`；组件渲染时用 `<use xlink:href="#{type}">` 引用它们。
 *
 * 与 antd 的两处实现差异（均不改可观察行为）：
 *   1. 用 `<Icon>` 的默认插槽承载 `<use>`，而不是 React 的 `children`
 *   2. 内容为空时**不传插槽**，而不是传一个空 children —— antd 的 `if (children)` 判真值，
 *      Vue 的 `slots.default` 判存在性，直接对应会让「无内容」渲染出一个空 `<svg>`
 */

import { defineComponent, h, type VNode } from 'vue';
import { Icon } from './icon';

/** {@link createFromIconfontCN} 的选项。 */
export interface CustomIconOptions {
  /** iconfont 生成的 JS 地址。数组表示按顺序加载多个。 */
  scriptUrl?: string | string[];
  /** 透传给每个图标组件的公共 props。 */
  extraCommonProps?: Record<string, unknown>;
}

/** 已插入过的脚本地址。避免同一地址重复插入。 */
const customCache = new Set<string>();

function isValidCustomScriptUrl(scriptUrl: unknown): scriptUrl is string {
  return Boolean(
    typeof scriptUrl === 'string' && scriptUrl.length > 0 && !customCache.has(scriptUrl),
  );
}

/**
 * 依次插入脚本。
 *
 * ⚠️ 数组要**倒序**传入：iconfont 的脚本会把 `<symbol>` 插到已有内容**之前**，
 * 所以先加载的会被后加载的覆盖。倒序插入才能让数组的先后顺序最终生效。
 * 这条与 antd 一致，且没有注释很容易被"顺手改成正序"。
 */
function createScriptUrlElements(scriptUrls: readonly string[], index = 0): void {
  const currentScriptUrl = scriptUrls[index];
  if (!isValidCustomScriptUrl(currentScriptUrl)) return;

  const script = document.createElement('script');
  script.setAttribute('src', currentScriptUrl);
  script.setAttribute('data-namespace', currentScriptUrl);
  if (scriptUrls.length > index + 1) {
    const loadNext = () => createScriptUrlElements(scriptUrls, index + 1);
    script.onload = loadNext;
    script.onerror = loadNext;
  }
  customCache.add(currentScriptUrl);
  document.body.appendChild(script);
}

/**
 * 创建一个 iconfont 图标组件。
 *
 * @example
 * ```ts
 * const IconFont = createFromIconfontCN({ scriptUrl: '//at.alicdn.com/t/font_xxx.js' });
 * ```
 * ```vue
 * <IconFont type="icon-javascript" />
 * ```
 */
export function createFromIconfontCN(options: CustomIconOptions = {}) {
  const { scriptUrl, extraCommonProps = {} } = options;

  if (
    scriptUrl &&
    typeof document !== 'undefined' &&
    typeof window !== 'undefined' &&
    typeof document.createElement === 'function'
  ) {
    if (Array.isArray(scriptUrl)) {
      createScriptUrlElements([...scriptUrl].reverse());
    } else {
      createScriptUrlElements([scriptUrl]);
    }
  }

  return defineComponent({
    name: 'AIconfont',
    inheritAttrs: false,
    props: {
      /** iconfont 项目里的图标 id（不含 `#`）。 */
      type: { type: String, default: undefined },
    },
    setup(props, { attrs, slots }) {
      return (): VNode => {
        // children > type（与 antd 一致）
        let content: VNode[] = [];
        if (props.type) {
          // Vue 的 SVG 属性名要用带命名空间前缀的字面量 `xlink:href`；
          // 写 camelCase 的 `xlinkHref` 不会被 runtime-dom 识别为 xlink 属性（已读源码确认）。
          content = [h('use', { 'xlink:href': `#${props.type}` })];
        }
        const slotContent = slots.default?.() ?? [];
        if (slotContent.length > 0) {
          content = slotContent;
        }

        const iconProps = { ...extraCommonProps, ...attrs };
        return content.length > 0
          ? h(Icon, iconProps, { default: () => content })
          : h(Icon, iconProps);
      };
    },
  });
}
