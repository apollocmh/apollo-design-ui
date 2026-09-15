import { describe, expect, it } from 'vitest';
import { Comment, createTextVNode, createVNode, Fragment, h, Text } from 'vue';
import {
  isCommentVNode,
  isComponentVNode,
  isDOM,
  isDocument,
  isElementVNode,
  isEmptyVNode,
  isFragmentVNode,
  isFunction,
  isHTMLElement,
  isNonNullable,
  isNumber,
  isPlainObject,
  isPlainObjectStrict,
  isPrimitive,
  isRenderable,
  isString,
  isTextVNode,
  isThenable,
  isTransitionEvent,
  isVNode,
  isWindow,
} from '../is';

describe('isNonNullable / isRenderable', () => {
  it('isNonNullable 只排除 null 与 undefined', () => {
    expect(isNonNullable(null)).toBe(false);
    expect(isNonNullable(undefined)).toBe(false);
    expect(isNonNullable(0)).toBe(true);
    expect(isNonNullable('')).toBe(true);
    expect(isNonNullable(false)).toBe(true);
    expect(isNonNullable(Number.NaN)).toBe(true);
  });

  it('isRenderable 额外排除 false 与空字符串', () => {
    expect(isRenderable(null)).toBe(false);
    expect(isRenderable(undefined)).toBe(false);
    expect(isRenderable(false)).toBe(false);
    expect(isRenderable('')).toBe(false);
  });

  it('★ isRenderable(0) 为 true —— 这是组件模板必须用它的原因', () => {
    // `v-if="count"` 在 count === 0 时不会渲染；`v-if="isRenderable(count)"` 会渲染 `0`
    expect(isRenderable(0)).toBe(true);
    expect(isRenderable(true)).toBe(true);
    expect(isRenderable('0')).toBe(true);
  });
});

describe('基础类型判定', () => {
  it('isNumber 排除 NaN', () => {
    expect(isNumber(0)).toBe(true);
    expect(isNumber(Number.NaN)).toBe(false);
    expect(isNumber('1')).toBe(false);
    expect(isNumber(Number.POSITIVE_INFINITY)).toBe(true);
  });

  it('isString / isFunction', () => {
    expect(isString('')).toBe(true);
    expect(isString(1)).toBe(false);
    expect(isFunction(() => {})).toBe(true);
    expect(isFunction(class {})).toBe(true);
    expect(isFunction({})).toBe(false);
  });

  it('isThenable', () => {
    expect(isThenable(Promise.resolve())).toBe(true);
    // 本用例的目的就是构造一个「长得像 Promise」的对象，因此必须有一个 then 属性。
    // biome-ignore lint/suspicious/noThenProperty: 测试目标本身就是 thenable，不能改名
    expect(isThenable({ then: () => {} })).toBe(true);
    expect(isThenable(null)).toBe(false);
    expect(isThenable(undefined)).toBe(false);
    expect(isThenable({})).toBe(false);
  });

  it('isPrimitive', () => {
    expect(isPrimitive(1)).toBe(true);
    expect(isPrimitive('a')).toBe(true);
    expect(isPrimitive(null)).toBe(true);
    expect(isPrimitive(() => {})).toBe(false);
    expect(isPrimitive({})).toBe(false);
  });

  it('isPlainObject 是宽松的「是不是对象」（数组也通过）—— antd 的真实语义', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject([])).toBe(true);
    expect(isPlainObject(new Date())).toBe(true);
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject('a')).toBe(false);
  });

  it('isPlainObjectStrict 只认原型直指 Object.prototype 的对象', () => {
    expect(isPlainObjectStrict({})).toBe(true);
    expect(isPlainObjectStrict(Object.create(null))).toBe(false);
    expect(isPlainObjectStrict([])).toBe(false);
    expect(isPlainObjectStrict(new Date())).toBe(false);
    class Box {}
    expect(isPlainObjectStrict(new Box())).toBe(false);
  });

  it('isTransitionEvent', () => {
    expect(isTransitionEvent({ propertyName: 'opacity' })).toBe(true);
    expect(isTransitionEvent({ propertyName: 1 })).toBe(false);
    expect(isTransitionEvent({})).toBe(false);
    expect(isTransitionEvent(null)).toBe(false);
  });
});

describe('DOM 判定', () => {
  it('isWindow', () => {
    expect(isWindow(window)).toBe(true);
    expect(isWindow(document)).toBe(false);
    expect(isWindow(null)).toBe(false);
    expect(isWindow({ window: undefined })).toBe(false);
  });

  it('isDocument', () => {
    expect(isDocument(document)).toBe(true);
    expect(isDocument(window)).toBe(false);
    expect(isDocument(null)).toBe(false);
    // 跨 realm 兜底：nodeType 为 9
    expect(isDocument({ nodeType: 9 } as unknown as Document)).toBe(true);
  });

  it('isHTMLElement / isDOM', () => {
    const div = document.createElement('div');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    expect(isHTMLElement(div)).toBe(true);
    expect(isHTMLElement(svg)).toBe(false);
    expect(isDOM(div)).toBe(true);
    expect(isDOM(svg)).toBe(true);
    expect(isDOM(document.createTextNode('x'))).toBe(false);
    expect(isDOM(null)).toBe(false);
  });
});

describe('VNode 判定', () => {
  it('isVNode 用 __v_isVNode 标记，不依赖 instanceof（兼容多份 Vue 副本）', () => {
    expect(isVNode(h('div'))).toBe(true);
    expect(isVNode({ __v_isVNode: true })).toBe(true);
    expect(isVNode(null)).toBe(false);
    expect(isVNode({})).toBe(false);
  });

  it('isElementVNode / isComponentVNode / isFragmentVNode / isTextVNode / isCommentVNode', () => {
    const element = h('div');
    const component = h({ render: () => h('span') });
    const fragment = createVNode(Fragment, null, [h('a')]);
    const text = createTextVNode('hi');
    const comment = createVNode(Comment);

    expect(isElementVNode(element)).toBe(true);
    expect(isComponentVNode(element)).toBe(false);

    expect(isComponentVNode(component)).toBe(true);
    expect(isElementVNode(component)).toBe(false);

    expect(isFragmentVNode(fragment)).toBe(true);
    expect(isElementVNode(fragment)).toBe(false);

    expect(isTextVNode(text)).toBe(true);
    expect(isCommentVNode(comment)).toBe(true);
    expect(isTextVNode(comment)).toBe(false);
  });

  it('createVNode(Text) 与 createTextVNode 都是文本 vnode', () => {
    expect(isTextVNode(createVNode(Text, null, 'x'))).toBe(true);
  });
});

describe('★ isEmptyVNode（Vue 特有的判空层）', () => {
  it('null / undefined / false 为空', () => {
    expect(isEmptyVNode(null)).toBe(true);
    expect(isEmptyVNode(undefined)).toBe(true);
    expect(isEmptyVNode(false)).toBe(true);
  });

  it('注释 vnode 为空（Vue 用注释表示 v-if=false / 空插槽）', () => {
    expect(isEmptyVNode(createVNode(Comment))).toBe(true);
  });

  it('★ 文本 vnode：空字符串为空，但 "0" 与 0 不为空', () => {
    expect(isEmptyVNode(createTextVNode(''))).toBe(true);
    expect(isEmptyVNode(createTextVNode('0'))).toBe(false);
    // 数字 0 经 Vue 归一化会变成字符串 '0'
    expect(isEmptyVNode(createVNode(Text, null, '0'))).toBe(false);
  });

  it('★ 这一层判定是必需的：vnode 存在 ≠ 有内容', () => {
    // `h('div', [''])` 会为 '' 创建文本 vnode —— 用"vnode 存在"判空会得到错误结论
    const empty = createTextVNode('');
    expect(isVNode(empty)).toBe(true);
    expect(isEmptyVNode(empty)).toBe(true);
  });

  it('元素 / 组件 vnode 不为空', () => {
    expect(isEmptyVNode(h('div'))).toBe(false);
    expect(isEmptyVNode(h({ render: () => h('span') }))).toBe(false);
  });

  it('Fragment：子节点全空才算空', () => {
    expect(isEmptyVNode(createVNode(Fragment, null, []))).toBe(true);
    expect(isEmptyVNode(createVNode(Fragment, null, [createTextVNode('')]))).toBe(true);
    expect(isEmptyVNode(createVNode(Fragment, null, [h('a'), createTextVNode('')]))).toBe(false);
  });

  it('数组：全部为空才算空', () => {
    expect(isEmptyVNode([null, undefined, false])).toBe(true);
    expect(isEmptyVNode([createTextVNode('')])).toBe(true);
    expect(isEmptyVNode([createTextVNode('x')])).toBe(false);
    expect(isEmptyVNode([])).toBe(true);
  });
});
