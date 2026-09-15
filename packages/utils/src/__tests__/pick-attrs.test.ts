import { describe, expect, it } from 'vitest';
import pickAttrs from '../pick-attrs';

describe('pickAttrs 配置归一化', () => {
  it('不传 / false：aria + data + attr 全开', () => {
    const props = { role: 'button', 'aria-label': 'x', 'data-id': 'y', title: 't', foo: 'bar' };
    const expected = { role: 'button', 'aria-label': 'x', 'data-id': 'y', title: 't' };
    expect(pickAttrs(props)).toEqual(expected);
    expect(pickAttrs(props, false)).toEqual(expected);
  });

  it('true：只要 aria（role + aria-*），不要 data 与普通属性', () => {
    const props = { role: 'button', 'aria-label': 'x', 'data-id': 'y', title: 't' };
    expect(pickAttrs(props, true)).toEqual({ role: 'button', 'aria-label': 'x' });
  });

  it('对象配置：只开启指定的类别', () => {
    const props = { role: 'button', 'aria-label': 'x', 'data-id': 'y', title: 't' };
    expect(pickAttrs(props, { aria: true })).toEqual({ role: 'button', 'aria-label': 'x' });
    expect(pickAttrs(props, { data: true })).toEqual({ 'data-id': 'y' });
    // ⚠️ `role` 同时也在属性白名单里（见 pick-attrs-allowlist.ts），所以 attr 类别也会挑到它
    expect(pickAttrs(props, { attr: true })).toEqual({ role: 'button', title: 't' });
  });

  it('对象配置里未给的键是 undefined（falsy），不会被当成开启', () => {
    const props = { role: 'button', title: 't' };
    expect(pickAttrs(props, { data: true })).toEqual({});
  });

  it('配置对象会被展开拷贝，不会污染调用方对象', () => {
    const config = { aria: true };
    pickAttrs({ role: 'x' }, config);
    expect(config).toEqual({ aria: true });
  });
});

describe('pickAttrs 白名单匹配', () => {
  it('只挑白名单内的属性，其余丢弃', () => {
    const props = { title: 'kept', onClick: () => {}, notAnAttr: 1, anotherRandomProp: 2 };
    const result = pickAttrs(props, { attr: true });
    expect(Object.keys(result).sort()).toEqual(['onClick', 'title']);
  });

  it('data-* 与 aria-* 用前缀匹配，不查白名单', () => {
    const props = { 'data-anything': 1, 'aria-whatever': 2, 'dat-not-prefixed': 3 };
    expect(pickAttrs(props, { aria: true, data: true })).toEqual({
      'data-anything': 1,
      'aria-whatever': 2,
    });
  });

  it('role 同时属于 aria 类别与属性白名单（两个开关都能挑到它）', () => {
    expect(pickAttrs({ role: 'dialog' }, { aria: true })).toEqual({ role: 'dialog' });
    expect(pickAttrs({ role: 'dialog' }, { attr: true })).toEqual({ role: 'dialog' });
    expect(pickAttrs({ role: 'dialog' }, { aria: true, data: true })).toEqual({ role: 'dialog' });
  });

  it('空对象返回空对象', () => {
    expect(pickAttrs({})).toEqual({});
  });
});

describe('★ pickAttrs 的事件键改写（与 rc-util 的有意差异）', () => {
  it('默认把 React 事件名改写为 Vue 的规范事件键', () => {
    const props = { onClick: 'a', onKeyDown: 'b', onDoubleClick: 'c', onMouseEnter: 'd' };
    expect(pickAttrs(props, { attr: true })).toEqual({
      onClick: 'a',
      onKeydown: 'b',
      onDblclick: 'c',
      onMouseenter: 'd',
    });
  });

  it('★ 输出恒为 `on` + 大写字母开头 —— 否则 Vue 不把它当监听器', () => {
    const props = {
      onKeyDown: 1,
      onTouchStart: 1,
      onContextMenu: 1,
      onBeforeInput: 1,
      onGotPointerCapture: 1,
    };
    const result = pickAttrs(props, { attr: true });
    for (const key of Object.keys(result)) {
      // Vue 的 isOn = /^on[^a-z]/，不满足就会被当成普通属性
      expect(key, `${key} 不会被 Vue 识别为事件监听`).toMatch(/^on[^a-z]/);
    }
  });

  it('★ 去掉 on 后是「首字母大写 + 其余全小写」，且不含连字符（hyphenate 能还原的前提）', () => {
    const props = { onKeyDown: 1, onTouchStart: 1, onContextMenu: 1, onBeforeInput: 1 };
    const result = pickAttrs(props, { attr: true });
    for (const key of Object.keys(result)) {
      expect(key).not.toContain('-');
      // on + Xxx：第 3 位大写，之后全小写
      expect(key.charAt(2)).toBe(key.charAt(2).toUpperCase());
      expect(key.slice(3)).toBe(key.slice(3).toLowerCase());
    }
  });

  it('单单词事件名保持不变（幂等）', () => {
    const props = { onClick: 'a', onInput: 'b', onChange: 'c', onFocus: 'd' };
    expect(pickAttrs(props, { attr: true })).toEqual(props);
  });

  it('rawEventNames: true 时保留 React 原名（供迁移对照）', () => {
    const props = { onClick: 'a', onKeyDown: 'b' };
    expect(pickAttrs(props, { attr: true, rawEventNames: true })).toEqual({
      onClick: 'a',
      onKeyDown: 'b',
    });
  });

  it('rawEventNames 不影响 aria / data 的处理', () => {
    const props = { 'aria-label': 'x', onKeyDown: 'b' };
    expect(pickAttrs(props, { aria: true, attr: true, rawEventNames: true })).toEqual({
      'aria-label': 'x',
      onKeyDown: 'b',
    });
  });

  it('非事件名的属性不会被误改写', () => {
    const props = { className: 'c', tabIndex: 0, style: { color: 'red' } };
    expect(pickAttrs(props, { attr: true })).toEqual(props);
  });
});

describe('pickAttrs 保真度：与 antd 的透传集合一致', () => {
  it('值原样透传（包括 undefined 与函数）', () => {
    const fn = () => {};
    const props = { title: undefined, onClick: fn, id: '' };
    const result = pickAttrs(props, { attr: true });
    expect(result.title).toBeUndefined();
    expect(result.onClick).toBe(fn);
    expect(result.id).toBe('');
  });

  it('不修改入参对象', () => {
    const props = { onClick: 'a', title: 't', other: 1 };
    const snapshot = { ...props };
    pickAttrs(props);
    expect(props).toEqual(snapshot);
  });

  it('未知的 on* 属性（不在白名单）不会被挑出', () => {
    // 只有白名单里的 90 个事件名才被透传，避免把组件的业务回调漏到 DOM 上
    expect(pickAttrs({ onSomethingCustom: 1 }, { attr: true })).toEqual({});
  });
});
