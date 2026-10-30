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

import { defineComponent, h, type SlotsType, type VNode, type VNodeChild } from 'vue';
import { Icon, iconProps } from './icon';

/** {@link createFromIconfontCN} 的选项。 */
export interface CustomIconOptions {
  /** iconfont 生成的 JS 地址。数组表示按顺序加载多个。 */
  scriptUrl?: string | string[];
  /** 透传给每个图标组件的公共 props。 */
  extraCommonProps?: Record<string, unknown>;
}

/** 已插入过的脚本地址。避免同一地址重复插入。 */
const customCache = new Map<string, Promise<void>>();

/**
 * 依次插入脚本。
 *
 * ⚠️ 数组要**倒序**传入：iconfont 的脚本会把 `<symbol>` 插到已有内容**之前**，
 * 所以先加载的会被后加载的覆盖。倒序插入才能让数组的先后顺序最终生效。
 * 这条与 antd 一致，且没有注释很容易被"顺手改成正序"。
 */
function createScriptUrlElements(scriptUrls: readonly string[], index = 0): void {
  const currentScriptUrl = scriptUrls[index];
  if (currentScriptUrl === undefined) return;
  const loadNext = () => createScriptUrlElements(scriptUrls, index + 1);
  if (typeof currentScriptUrl !== 'string' || currentScriptUrl.length === 0) {
    loadNext();
    return;
  }

  const cached = customCache.get(currentScriptUrl);
  if (cached) {
    void cached.then(loadNext);
    return;
  }

  const script = document.createElement('script');
  script.setAttribute('src', currentScriptUrl);
  script.setAttribute('data-namespace', currentScriptUrl);
  const completed = new Promise<void>((resolve) => {
    // A failed resource must not prevent the remaining independent URLs from loading.
    script.onload = () => resolve();
    script.onerror = () => resolve();
  });
  customCache.set(currentScriptUrl, completed);
  if (scriptUrls.length > index + 1) {
    void completed.then(loadNext);
  }
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
    slots: Object as SlotsType<{ default?: () => VNodeChild }>,
    props: {
      ...iconProps,
      // Absent instance props must preserve factory-level common defaults.
      spin: { type: Boolean, default: undefined },
      /** iconfont 项目里的图标 id（不含 `#`）。 */
      type: { type: String, default: undefined },
    },
    setup(props, { attrs, slots }) {
      return (): VNode => {
        const defaultSlot =
          slots.default ??
          (props.type ? () => h('use', { 'xlink:href': `#${props.type}` }) : undefined);
        const forwarded: Record<string, unknown> = { ...extraCommonProps };
        for (const [key, value] of Object.entries(props)) {
          if (key !== 'type' && value !== undefined) forwarded[key] = value;
        }
        Object.assign(forwarded, attrs);
        return defaultSlot ? h(Icon, forwarded, { default: defaultSlot }) : h(Icon, forwarded);
      };
    },
  });
}
