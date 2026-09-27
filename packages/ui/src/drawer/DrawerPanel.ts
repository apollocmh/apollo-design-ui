/**
 * antd 侧的 `DrawerPanel` —— `components/drawer/DrawerPanel.tsx`（249 行）的 Vue 版。
 *
 * ⚠️ 与 rc 侧的 `engine/DrawerSection.ts` 不是一回事：**这个是面板内容**
 *    （header / body / footer），作为 children 传进 rc 的 section 里。
 *
 * 渲染结构（L4 的判据）：
 * ```
 * <div class="{p}-header [header] [{p}-header-close-only]">      ← 三者都空时**不渲染**
 *   <div class="{p}-header-title">
 *     {closablePlacement === 'start' && 关闭按钮}
 *     {title && <div class="{p}-title [title]" id={ariaId}>{title}</div>}
 *   </div>
 *   {extra && <div class="{p}-extra [extra]">{extra}</div>}
 *   {closablePlacement === 'end' && 关闭按钮}
 * </div>
 * <div class="{p}-body [body]">{loading ? <Skeleton active title={false} paragraph={{rows:5}} /> : children}</div>
 * {footer && <div class="{p}-footer [footer]">{footer}</div>}
 * ```
 *
 * 关键判据：
 *   1. **`closablePlacement`**：`closable === false` ⇒ `undefined`（不渲染）；
 *      对象且 `placement === 'end'` ⇒ `'end'`；否则 `'start'`（**默认在标题左侧**）；
 *   2. **关闭按钮是面板自己包的一层 `<button type="button">`**（`closeIconRender`），
 *      类名 `{p}-close` + `placement === 'end'` 时再加 `{p}-close-end`；
 *   3. `header` 的显隐：`!title && !closable && !extra` ⇒ `null`；
 *      `closable && !title && !extra` ⇒ 额外加 `{p}-header-close-only`；
 *   4. `loading` ⇒ 用 `Skeleton`（`active` + `title={false}` + `paragraph={{rows:5}}`）替换 children。
 */
// ⚠️ 同包内引用必须走**相对路径**（`@apollo-design/ui` 是包自身，dts 构建期解析不到）

import { isPlainObject, isRenderable } from '@apollo-design/utils';
import { cloneVNode, defineComponent, h, isVNode, type PropType, type VNodeChild } from 'vue';
import { computeClosable, pickClosable } from '../_internal/use-closable';
import { useComponentConfig } from '../config-provider/context';
import { Skeleton } from '../skeleton';

const clsx = (...args: Array<string | false | undefined | Record<string, unknown>>): string => {
  const out: string[] = [];
  for (const arg of args) {
    if (!arg) continue;
    if (typeof arg === 'string') out.push(arg);
    else for (const [key, value] of Object.entries(arg)) if (value) out.push(key);
  }
  return out.join(' ');
};

export default defineComponent({
  name: 'ADrawerPanel',
  inheritAttrs: false,
  // 内部：由父组件程序化传递/命令式 API 驱动，无模板上下文，VNode prop 合法
  // ⚠️ C8-R2：本组件是内部面板，`title` / `footer` / `extra` / `closeIcon` 仍保留 VNode prop
  //    （由 `Drawer` 把同名 slot / String prop 归一后透传），不暴露为公开 slot。
  props: {
    prefixCls: { type: String, required: true },
    ariaId: { type: String, default: undefined },
    title: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    footer: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    extra: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    closable: {
      type: [Boolean, Object, null] as unknown as PropType<unknown>,
      default: undefined,
    },
    closeIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    onClose: { type: Function as PropType<(e: Event) => void>, default: undefined },
    classNames: {
      type: Object as PropType<Record<string, string | undefined>>,
      default: undefined,
    },
    styles: {
      type: Object as PropType<Record<string, Record<string, unknown> | undefined>>,
      default: undefined,
    },
    loading: { type: Boolean, default: false },
    /** @deprecated 请用 `styles.header`。 */
    headerStyle: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    /** @deprecated 请用 `styles.body`。 */
    bodyStyle: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    /** @deprecated 请用 `styles.footer`。 */
    footerStyle: { type: Object as PropType<Record<string, unknown>>, default: undefined },
  },
  setup(props, { slots }) {
    return () => {
      const config = useComponentConfig('drawer');
      const prefixCls = props.prefixCls;
      const cn = props.classNames ?? {};
      const st = props.styles ?? {};

      // ---------------- closable ----------------
      const merged = props.closable ?? (config.closable as unknown);
      const closablePlacement: 'start' | 'end' | undefined =
        merged === false
          ? undefined
          : isPlainObject(merged) && merged.placement === 'end'
            ? 'end'
            : 'start';

      const customCloseIconRender = (icon: VNodeChild): VNodeChild =>
        h(
          'button',
          {
            type: 'button',
            onClick: props.onClose,
            // ⚠️ 按钮自带 `aria-label`：antd 的 `useClosable` 会对**最终**图标做
            //    `cloneElement(icon, { 'aria-label': closeLabel })` —— 这里「最终图标」
            //    就是本函数返回的 button ⇒ 标签落在 button 上，内层图标仍是它自己的
            //    小写 `close`（L4 基线逐属性比对：button=Close / span=close）。
            //    本仓的 `_internal/use-closable` 把这一步交给消费方（见该文件说明）。
            'aria-label': 'Close',
            class: clsx(
              `${prefixCls}-close`,
              {
                [`${prefixCls}-close-end`]: closablePlacement === 'end',
              },
              cn.close,
            ),
            style: st.close,
          },
          icon as never,
        );

      const closableResult = computeClosable(
        pickClosable({ closable: props.closable as never, closeIcon: props.closeIcon }).value,
        pickClosable((config as { closable?: unknown }).closable as never).value,
        {
          closable: true,
          closeIconRender: (icon) => customCloseIconRender(icon as VNodeChild),
        },
      );

      const mergedCloseButton =
        closableResult.closable && isVNode(closableResult.closeIconNode)
          ? cloneVNode(closableResult.closeIconNode, {
              disabled: closableResult.closeBtnIsDisabled,
            })
          : (closableResult.closeIconNode as VNodeChild);

      const hasTitle = isRenderable(props.title);
      const hasExtra = isRenderable(props.extra);

      // ---------------- header ----------------
      const renderHeader = (): VNodeChild => {
        if (!hasTitle && !closableResult.closable && !hasExtra) return null;
        return h(
          'div',
          {
            style: { ...st.header, ...props.headerStyle },
            class: clsx(`${prefixCls}-header`, cn.header, {
              [`${prefixCls}-header-close-only`]: closableResult.closable && !hasTitle && !hasExtra,
            }),
          },
          [
            h('div', { class: `${prefixCls}-header-title` }, [
              closablePlacement === 'start' ? mergedCloseButton : null,
              hasTitle
                ? h(
                    'div',
                    {
                      class: clsx(`${prefixCls}-title`, cn.title),
                      style: st.title,
                      id: props.ariaId,
                    },
                    props.title as never,
                  )
                : null,
            ]),
            hasExtra
              ? h(
                  'div',
                  { class: clsx(`${prefixCls}-extra`, cn.extra), style: st.extra },
                  props.extra as never,
                )
              : null,
            closablePlacement === 'end' ? mergedCloseButton : null,
          ],
        );
      };

      // ---------------- footer ----------------
      const renderFooter = (): VNodeChild =>
        props.footer
          ? h(
              'div',
              {
                class: clsx(`${prefixCls}-footer`, cn.footer),
                style: { ...st.footer, ...props.footerStyle },
              },
              props.footer as never,
            )
          : null;

      return [
        renderHeader(),
        h(
          'div',
          { class: clsx(`${prefixCls}-body`, cn.body), style: { ...st.body, ...props.bodyStyle } },
          props.loading
            ? h(Skeleton, {
                active: true,
                title: false,
                paragraph: { rows: 5 },
                class: `${prefixCls}-body-skeleton`,
              })
            : (slots.default?.() ?? []),
        ),
        renderFooter(),
      ];
    };
  },
});
