/** L3 类型（G7）—— 正例 + 负例（负例包在永不调用的闭包里，CHECKLIST §一）。 */
import { describe, expectTypeOf, it } from 'vitest';
import { type CSSProperties, h, type VNodeChild } from 'vue';
import { Dropdown, DropdownButton, type DropdownPurePanel } from '../index';
import type {
  DropdownButtonEmits,
  DropdownButtonProps,
  DropdownButtonRef,
  DropdownButtonSlots,
  DropdownEmits,
  DropdownOpenInfo,
  DropdownPlacement,
  DropdownProps,
  DropdownRef,
  DropdownSemanticType,
  DropdownSlots,
} from '../interface';

describe('Dropdown · 类型', () => {
  it('浮层根直接消费 Vue CSSProperties，无需调用者增加 record 适配', () => {
    const root: CSSProperties = { marginInlineStart: 8, '--popup-tone': '#123456' };
    const styles: DropdownSemanticType['styles'] = {
      root,
      item: root,
      itemTitle: root,
      itemIcon: root,
      itemContent: root,
    };
    const getPopupContainer = () => document.createElement('div').attachShadow({ mode: 'open' });
    const props: DropdownProps = { styles, overlayStyle: root, getPopupContainer };
    expectTypeOf(styles.root).toEqualTypeOf<CSSProperties | undefined>();
    h(Dropdown, props);
    h(DropdownButton, { getPopupContainer });
    const invalid: DropdownProps = {
      styles: {
        root: {
          // @ts-expect-error CSS 颜色不是业务回调。
          color: () => 'red',
        },
      },
    };
    void invalid;
  });

  it('declares owned Vue notifications, models and actual method-shaped refs', () => {
    expectTypeOf<Parameters<DropdownEmits['openChange']>>().toEqualTypeOf<
      [open: boolean, info: DropdownOpenInfo]
    >();
    expectTypeOf<Parameters<DropdownEmits['afterOpenChange']>>().toEqualTypeOf<[open: boolean]>();
    expectTypeOf<Parameters<DropdownButtonEmits['click']>>().toEqualTypeOf<[event: MouseEvent]>();
    expectTypeOf<DropdownRef['nativeElement']>().returns.toEqualTypeOf<HTMLElement | null>();
    expectTypeOf<DropdownRef['popupElement']>().returns.toEqualTypeOf<HTMLElement | null>();
    expectTypeOf<DropdownButtonRef['nativeElement']>().returns.toEqualTypeOf<HTMLElement | null>();
    const props: DropdownProps = {
      'onUpdate:open': (_open: boolean) => {},
      onOpenChange: (_open: boolean, _info: DropdownOpenInfo) => {},
      onAfterOpenChange: (_open: boolean) => {},
      styles: ({ props }) => ({ root: { opacity: props.open ? 1 : 0 } }),
      classNames: ({ props }) => ({ root: props.open ? 'opened' : 'closed' }),
    };
    h(Dropdown, props);
    h(DropdownButton, { target: '_blank', 'onUpdate:open': (_open: boolean) => {} });
    h(Dropdown.Button, { split: true });
    h(Dropdown._InternalPanelDoNotUseOrYouWillBeFired, { menu: { items: [] } });
    expectTypeOf(Dropdown.Button).toEqualTypeOf<typeof DropdownButton>();
    expectTypeOf(Dropdown._InternalPanelDoNotUseOrYouWillBeFired).toEqualTypeOf<
      typeof DropdownPurePanel
    >();
    const negative = () => {
      const oldMotion: DropdownProps = {
        // @ts-expect-error Motion completion is an owned Vue event listener.
        afterOpenChange: () => {},
      };
      const oldIcon: DropdownButtonProps = {
        // @ts-expect-error Template icon content uses the existing #icon slot.
        icon: 'legacy',
      };
      const bad: DropdownProps = {
        styles: {
          item: {
            // @ts-expect-error Item semantic styles use valid CSS property values.
            position: 'floating',
          },
        },
      };
      return [oldMotion, oldIcon, bad];
    };
    void negative;
  });

  it('types complete popup/icon slots and the two existing buttonsRender positions', () => {
    const slots: DropdownSlots = {
      default: () => [h('span', 'First'), 0],
      popupRender: ({ originNode }) => h('section', [originNode]),
    };
    const buttonSlots: DropdownButtonSlots = {
      ...slots,
      icon: () => [h('i', 'A'), h('b', 'B')],
      buttonsRender: ({ buttons }) => [h('section', [buttons[0]]), buttons[1]],
    };
    h(Dropdown, {}, slots);
    h(DropdownButton, {}, buttonSlots);
    expectTypeOf<Parameters<NonNullable<DropdownSlots['popupRender']>>[0]>().toEqualTypeOf<{
      originNode: VNodeChild;
    }>();
  });

  it('placement 是 14 值联合（含 deprecated Center）', () => {
    expectTypeOf<DropdownPlacement>().toEqualTypeOf<
      | 'topLeft'
      | 'topCenter'
      | 'topRight'
      | 'bottomLeft'
      | 'bottomCenter'
      | 'bottomRight'
      | 'top'
      | 'bottom'
      | 'left'
      | 'leftTop'
      | 'leftBottom'
      | 'right'
      | 'rightTop'
      | 'rightBottom'
    >();
  });

  it('正例：合法 prop 组合', () => {
    const sample: Pick<
      DropdownProps,
      'menu' | 'trigger' | 'arrow' | 'placement' | 'destroyOnHidden'
    > = {
      menu: { items: [{ key: '1', label: 'a' }] },
      trigger: ['click', 'contextMenu'],
      arrow: { pointAtCenter: true },
      placement: 'topLeft',
      destroyOnHidden: false,
    };
    expectTypeOf(sample).not.toBeNever();
  });

  it('负例（永不调用的闭包）', () => {
    const negative = () => {
      const props: DropdownProps = {
        // @ts-expect-error trigger 不接受 'focus'
        trigger: ['focus'],
        // @ts-expect-error arrow 不接受字符串字面量
        arrow: 'yes',
      };
      return props;
    };
    void negative;
  });
});
