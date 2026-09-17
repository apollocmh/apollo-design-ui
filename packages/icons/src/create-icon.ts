/**
 * `createIcon` —— 图标定义 → Vue 组件。
 *
 * 这是本项目相对 antd 的一处**结构性简化**（不是行为差异）：
 *   antd 为 848 个图标各生成一个文件，每个文件写一遍
 *   `React.forwardRef((props, ref) => createElement(AntdIcon, {...props, ref, icon: XxxSvg}))`，
 *   并靠 `AntdIcon` / `AntdIconLight` 两个基组件分流（TwoTone 走前者，其余走后者）。
 *
 *   我们把它收成一个工厂：`createIcon(definition, displayName)`。
 *   分流不再需要两个基组件 —— 判据是 `definition.icon` 是函数还是对象（TwoTone 的定义是函数），
 *   而这个判据与 antd 的 `AntdIcon` / `AntdIconLight` 分流**恰好等价**（实测 848 个定义：
 *   251 Filled + 447 Outlined 全部是对象，150 TwoTone 全部是函数，零例外）。
 *
 * 保留的对外语义：
 *   - `twoToneColor` 在非 TwoTone 图标上被**吞掉**（不落到 DOM），与 `AntdIconLight` 一致
 *   - `onClick` 未给 `tabIndex` 时兜底 `-1`
 *   - `spin` 与 `icon.name === 'loading'` 都会加 `-spin`
 *   - 非法定义渲染为空 + 一次告警
 */

import { defineComponent, h, type PropType, type VNode } from 'vue';
import { classNames } from './class-names';
import { DEFAULT_ICON_PREFIX_CLS, useIconContext } from './context';
import { generate, iconBaseSvgProps, isIconDefinition, warning } from './render';
import type { TwoToneColor } from './two-tone-color';
import { getSecondaryColor, getTwoToneColors, normalizeTwoToneColors } from './two-tone-color';
import type { AbstractNode, IconDefinition } from './types';

/**
 * `rotate` 的样式。
 *
 * ⚠️ antd 在这里还输出 `msTransform`（IE9 前缀）。我们不输出，登记为
 * `COMPATIBILITY.md` D16（PLATFORM）：Vue 的 style 对象绑定无法表达 camelCase 的
 * `msTransform`（`CSSStyleDeclaration.setProperty('msTransform')` 会被忽略），
 * 而现代目标浏览器不需要 IE9 前缀，像素结果完全一致。
 */
function resolveSvgStyle(rotate: number | undefined): Record<string, string> | undefined {
  // ⚠️ 真值判断，不是 `!== undefined`。`rotate: 0` 在 antd 下**不产生** style 属性，
  //    写成 `!== undefined` 会让 `rotate={0}` 多出一个 `transform:rotate(0deg)`。
  return rotate ? { transform: `rotate(${rotate}deg)` } : undefined;
}

/**
 * 解析出最终要渲染的抽象节点。
 *
 * TwoTone 定义的 `icon` 是 `(primaryColor, secondaryColor) => AbstractNode`，需要在渲染时求值。
 * 颜色优先级与 antd 一致：**prop 覆盖模块级调色板**，且 prop 只给主色时副色按主色派生。
 */
function resolveIconNode(
  definition: IconDefinition,
  twoToneColor: TwoToneColor | undefined,
): AbstractNode {
  const node = definition.icon;
  if (typeof node !== 'function') {
    return node;
  }

  let colors = getTwoToneColors();
  // antd 的求值顺序：先 normalize 成数组，再对 `primaryColor` 做**真值**判断。
  // 两处都不能"顺手改成 !== undefined" —— 空串会因此走上与 antd 不同的分支。
  const normalized = normalizeTwoToneColors(twoToneColor);
  const primaryColor = normalized[0];
  if (primaryColor) {
    const secondaryColor = normalized[1];
    colors = {
      primaryColor,
      // `||` 而非 `??`：空串副色同样回落到派生色（antd 原文）。
      secondaryColor: secondaryColor || getSecondaryColor(primaryColor),
      calculated: !!secondaryColor,
    };
  }

  return node(colors.primaryColor, colors.secondaryColor);
}

/**
 * 创建一个图标组件。
 *
 * @param definition 图标定义。由 `gen-icons.mjs` 从 `@ant-design/icons-svg`
 *   **构建期固化**成字面量传入；自定义图标也可以直接构造（见下方示例）。
 * @param displayName 组件名。省略时取 `definition.name`（kebab-case，与 antd 一致）
 *
 * @example
 * ```ts
 * // gen-icons.mjs 生成的图标文件就是下面这个形状（定义是**内联字面量**，
 * // 不 import 任何 @ant-design/* —— 见 ARCHITECTURE.md R7）
 * const definition: IconDefinition = {
 *   icon: { tag: 'svg', attrs: { viewBox: '64 64 896 896' }, children: [] },
 *   name: 'home',
 *   theme: 'outlined',
 * };
 * export const HomeOutlined = createIcon(definition, 'HomeOutlined');
 * ```
 */
export function createIcon(definition: IconDefinition, displayName?: string) {
  const componentName = displayName ?? (isIconDefinition(definition) ? definition.name : '');

  return defineComponent({
    name: componentName,
    // 与 antd 的 `{...restProps}` 落点一致：属性由下面的 render 函数手工分配到 span 上，
    // 而不是让 Vue 自动落到根元素（那样 `class` 会绕过 prefixCls 的拼接顺序）。
    inheritAttrs: false,
    props: {
      spin: { type: Boolean, default: false },
      rotate: { type: Number, default: undefined },
      tabIndex: { type: Number, default: undefined },
      twoToneColor: {
        type: [String, Array] as PropType<TwoToneColor>,
        default: undefined,
      },
    },
    setup(props, { attrs }) {
      const context = useIconContext();

      return (): VNode | null => {
        if (!isIconDefinition(definition)) {
          // ⚠️ 「definiton」是 antd 原文的拼写错误（`AntdIcon.js` / `IconBase.js` / `IconBaseTwoTone.js`
          //    三处同错）。这里**照抄**而不是顺手改成 definition —— 告警正文是与 antd 的
          //    可比对面之一（只有前缀 `[@apollo-design/icons]` 是我们的品牌名），
          //    改了会让「按文本 grep 上游告警」的对账方法失效。
          warning(false, `icon should be icon definiton, but got ${typeof definition}`);
          return null;
        }

        const { prefixCls = DEFAULT_ICON_PREFIX_CLS, rootClassName } = context.value;
        const iconName = definition.name;

        const mergedClassName = classNames(
          rootClassName,
          prefixCls,
          {
            [`${prefixCls}-${iconName}`]: !!iconName,
            [`${prefixCls}-spin`]: !!props.spin || iconName === 'loading',
          },
          attrs.class,
        );

        let tabIndex = props.tabIndex;
        if (tabIndex === undefined && attrs.onClick) {
          tabIndex = -1;
        }

        // `class` 单独处理（参与上面的拼接）；其余 $attrs 原样透传。
        const restAttrs: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(attrs)) {
          if (key !== 'class') restAttrs[key] = value;
        }

        const svgStyle = resolveSvgStyle(props.rotate);
        const node = resolveIconNode(definition, props.twoToneColor);

        return h(
          'span',
          {
            role: 'img',
            'aria-label': iconName,
            ...restAttrs,
            tabindex: tabIndex,
            class: mergedClassName,
          },
          [
            generate(node, `svg-${iconName}`, {
              // `style` 只在 rotate 时出现 —— 保持与 antd 相同的"缺省即不输出"，
              // 否则 svg 会多一个空的 style 属性，DOM 契约比对会失败。
              ...(svgStyle ? { style: svgStyle } : {}),
              'data-icon': iconName,
              ...iconBaseSvgProps,
            }),
          ],
        );
      };
    },
  });
}
