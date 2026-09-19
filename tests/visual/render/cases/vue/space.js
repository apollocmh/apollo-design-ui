/**
 * Vue 侧（@apollo-design/ui）的 Space 视觉用例。
 *
 * 与 `render/cases/react/space.jsx` **逐条对应**。用 `h()` 而不是 SFC：
 * 用例是「一份 props 组合」，写成函数调用才能与 React 侧一一对照，
 * 也不会被 SFC 编译器对 `VNodeChild` prop 的处理干扰（见 COMPATIBILITY.md D9）。
 *
 * ⚠️ `Space.Compact` 在 Vue 里是**具名导出** `SpaceCompact`（模板里没有
 *    `<Space.Compact>` 这种写法），静态别名 `Space.Compact` 也保留着 ——
 *    这里用具名导出，因为它才是 Vue 用户会写的那一种。
 */

import { Divider, Space, SpaceCompact } from '@apollo-design/ui';
import { h } from 'vue';

import {
  SPACE_ALIGN_BOX_STYLE,
  SPACE_BUTTON_PRIMARY_STYLE,
  SPACE_BUTTON_STYLE,
  SPACE_CARD_BODY_STYLE,
  SPACE_CARD_HEAD_STYLE,
  SPACE_CARD_STYLE,
  SPACE_CONTEXT_STYLE,
  SPACE_INPUT_STYLE,
  SPACE_LINK_STYLE,
  SPACE_MOCK_BOX_STYLE,
  SPACE_ROW_STYLE,
  SPACE_SEMANTIC_CLASSNAMES,
  SPACE_SEMANTIC_STYLES,
  SPACE_TEXT,
} from '../shared.mjs';

/**
 * 替身按钮（与 React 侧的 `<Btn>` 逐字对应）。
 *
 * ⚠️ `key` 必须**显式**放进 `h()` 的 props 对象 —— 它是 vnode 的特殊字段，
 *    不是普通 attr（写进 `attrs` 会被 Vue 当成 DOM 属性）。
 */
const Btn = (props, children) =>
  h(
    'button',
    {
      key: props?.key,
      type: 'button',
      style: props?.primary ? SPACE_BUTTON_PRIMARY_STYLE : SPACE_BUTTON_STYLE,
    },
    children,
  );

/** `vertical` 用例里的替身卡片。 */
const Card = () =>
  h('div', { style: SPACE_CARD_STYLE }, [
    h('div', { style: SPACE_CARD_HEAD_STYLE }, SPACE_TEXT.card),
    h('div', { style: SPACE_CARD_BODY_STYLE }, [
      h('p', { style: { margin: '0 0 8px' } }, 'Card content'),
      h('p', { style: { margin: 0 } }, 'Card content'),
    ]),
  ]);

/** 把用例包进钉死上下文的外层（两侧同形）。 */
const Stage = (children) => h('div', { style: SPACE_CONTEXT_STYLE }, children);

const btn = (label, primary = false) => Btn({ primary }, label);

export default {
  basic: () =>
    Stage(
      h(Space, null, {
        default: () => [SPACE_TEXT.base, btn(SPACE_TEXT.button, true), btn(SPACE_TEXT.button), btn(SPACE_TEXT.button)],
      }),
    ),

  size: () =>
    Stage([
      h(Space, { size: 'small' }, { default: () => [btn('small', true), btn('small'), btn('small')] }),
      h('br'),
      h(Space, { size: 'medium' }, { default: () => [btn('medium', true), btn('medium'), btn('medium')] }),
      h('br'),
      h(Space, { size: 'large' }, { default: () => [btn('large', true), btn('large'), btn('large')] }),
      h('br'),
      h(Space, { size: 24 }, { default: () => [btn('24', true), btn('24'), btn('24')] }),
    ]),

  align: () =>
    Stage(
      h('div', { style: SPACE_ROW_STYLE }, [
        h('div', { style: SPACE_ALIGN_BOX_STYLE }, [
          h(Space, { align: 'center' }, {
            default: () => ['center', btn(SPACE_TEXT.primary, true), h('span', { style: SPACE_MOCK_BOX_STYLE }, SPACE_TEXT.block)],
          }),
        ]),
        h('div', { style: SPACE_ALIGN_BOX_STYLE }, [
          h(Space, { align: 'start' }, {
            default: () => ['start', btn(SPACE_TEXT.primary, true), h('span', { style: SPACE_MOCK_BOX_STYLE }, SPACE_TEXT.block)],
          }),
        ]),
        h('div', { style: SPACE_ALIGN_BOX_STYLE }, [
          h(Space, { align: 'end' }, {
            default: () => ['end', btn(SPACE_TEXT.primary, true), h('span', { style: SPACE_MOCK_BOX_STYLE }, SPACE_TEXT.block)],
          }),
        ]),
        h('div', { style: SPACE_ALIGN_BOX_STYLE }, [
          h(Space, { align: 'baseline' }, {
            default: () => ['baseline', btn(SPACE_TEXT.primary, true), h('span', { style: SPACE_MOCK_BOX_STYLE }, SPACE_TEXT.block)],
          }),
        ]),
      ]),
    ),

  vertical: () =>
    Stage(
      h(Space, { orientation: 'vertical', size: 'medium', style: { display: 'flex' } }, {
        default: () => [Card(), Card(), Card()],
      }),
    ),

  wrap: () =>
    Stage(
      h(Space, { size: [8, 16], wrap: true }, {
        default: () => Array.from({ length: 12 }, (_, index) => Btn({ key: index }, SPACE_TEXT.cell)),
      }),
    ),

  separator: () =>
    Stage([
      h(Space, { separator: h(Divider, { orientation: 'vertical' }) }, {
        default: () => [
          h('a', { href: '#separator', style: SPACE_LINK_STYLE }, SPACE_TEXT.link),
          h('a', { href: '#separator', style: SPACE_LINK_STYLE }, SPACE_TEXT.link),
          h('a', { href: '#separator', style: SPACE_LINK_STYLE }, SPACE_TEXT.link),
        ],
      }),
      h('br'),
      h(Space, { separator: SPACE_TEXT.pipe }, { default: () => [btn('1'), btn('2'), btn('3')] }),
    ]),

  compact: () =>
    Stage([
      h(SpaceCompact, { block: true }, {
        default: () => [
          h('input', { style: { ...SPACE_INPUT_STYLE, width: '20%' }, value: '0571', readonly: true }),
          h('input', { style: { ...SPACE_INPUT_STYLE, width: '30%' }, value: '26888888', readonly: true }),
        ],
      }),
      h('br'),
      h(SpaceCompact, { block: true }, {
        default: () => [
          h('input', {
            style: { ...SPACE_INPUT_STYLE, width: 'calc(100% - 200px)' },
            value: 'https://ant.design',
            readonly: true,
          }),
          btn(SPACE_TEXT.button, true),
        ],
      }),
      h('br'),
      h(SpaceCompact, null, {
        default: () => [
          h('input', { style: SPACE_INPUT_STYLE, value: 'input content', readonly: true }),
          btn(SPACE_TEXT.button),
          btn(SPACE_TEXT.button, true),
        ],
      }),
    ]),

  'compact-vertical': () =>
    Stage(
      h(Space, null, {
        default: () => [
          h(SpaceCompact, { orientation: 'vertical' }, {
            default: () => [btn('Button 1'), btn('Button 2'), btn('Button 3')],
          }),
          h(SpaceCompact, { orientation: 'vertical' }, {
            default: () => [btn('Button 1', true), btn('Button 2', true), btn('Button 3', true)],
          }),
        ],
      }),
    ),

  semantic: () =>
    Stage(
      h(
        Space,
        {
          separator: SPACE_TEXT.pipe,
          classNames: SPACE_SEMANTIC_CLASSNAMES,
          styles: SPACE_SEMANTIC_STYLES,
        },
        { default: () => [btn(SPACE_TEXT.button), btn(SPACE_TEXT.button), btn(SPACE_TEXT.button)] },
      ),
    ),
};
