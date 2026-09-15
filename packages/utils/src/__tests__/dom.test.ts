import { describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import canUseDom from '../dom/can-use-dom';
import contains from '../dom/contains';
import { getDOM, getElement, getElementFromVNode } from '../dom/get-element';
import getScroll from '../dom/get-scroll';
import isVisible from '../dom/is-visible';
import { isStyleSupport } from '../dom/style-checker';
import KeyCode from '../key-code';

describe('canUseDom', () => {
  it('jsdom 下为 true', () => {
    expect(canUseDom()).toBe(true);
  });
});

describe('contains', () => {
  it('自身与后代都算「包含」', () => {
    const root = document.createElement('div');
    const child = document.createElement('span');
    const grandChild = document.createElement('i');
    root.appendChild(child);
    child.appendChild(grandChild);

    expect(contains(root, root)).toBe(true);
    expect(contains(root, child)).toBe(true);
    expect(contains(root, grandChild)).toBe(true);
  });

  it('外部节点不算包含', () => {
    const root = document.createElement('div');
    const other = document.createElement('div');
    expect(contains(root, other)).toBe(false);
  });

  it('root 为 falsy 时返回 false（不抛错）', () => {
    expect(contains(null, document.body)).toBe(false);
    expect(contains(undefined)).toBe(false);
  });

  it('n 为空时返回 false', () => {
    const root = document.createElement('div');
    expect(contains(root, null)).toBe(false);
  });

  it('无原生 contains 时沿 parentNode 上溯', () => {
    const parent = document.createElement('div');
    const child = document.createElement('span');
    parent.appendChild(child);

    // 去掉原生 contains，走兜底分支
    const fakeRoot = { parentNode: null } as unknown as Node;
    expect(contains(fakeRoot, fakeRoot)).toBe(true);
    expect(contains(fakeRoot, parent)).toBe(false);
  });
});

describe('isVisible', () => {
  it('null / undefined 返回 false', () => {
    expect(isVisible(null)).toBe(false);
    expect(isVisible(undefined)).toBe(false);
  });

  it('挂载在文档中的元素可见（offsetParent 存在）', () => {
    // ⚠️ jsdom 不实现布局：`offsetParent` 恒为 null、`getBoundingClientRect()` 全 0。
    //    所以这里必须手动造出"有布局"的条件。
    //    「真实浏览器里到底可不可见」属于 L6 视觉回归的职责，不在单测层验证。
    const div = document.createElement('div');
    document.body.appendChild(div);
    Object.defineProperty(div, 'offsetParent', { value: document.body, configurable: true });
    expect(isVisible(div)).toBe(true);
  });

  it('无 offsetParent 且尺寸为 0 时不可见（jsdom 下未挂载元素的真实状态）', () => {
    const div = document.createElement('div');
    expect(isVisible(div)).toBe(false);
  });

  it('无 offsetParent 但有宽或高（如 position: fixed）时可见', () => {
    const div = document.createElement('div');
    div.getBoundingClientRect = () => ({ width: 10, height: 0 }) as DOMRect;
    expect(isVisible(div)).toBe(true);
  });

  it('SVG 走 getBBox 分支', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    (svg as unknown as { getBBox: () => { width: number; height: number } }).getBBox = () => ({
      width: 0,
      height: 5,
    });
    expect(isVisible(svg)).toBe(true);
  });
});

describe('isStyleSupport', () => {
  it('已支持的属性返回 true', () => {
    expect(isStyleSupport('display')).toBe(true);
    expect(isStyleSupport('position')).toBe(true);
  });

  it('不存在的属性返回 false', () => {
    expect(isStyleSupport('notARealProperty')).toBe(false);
  });

  it('数组入参：任一支持即为 true（some 语义）', () => {
    expect(isStyleSupport(['notARealProperty', 'display'])).toBe(true);
    expect(isStyleSupport(['notARealProperty', 'alsoNotReal'])).toBe(false);
  });

  it('属性 + 值：值被接受则 true', () => {
    expect(isStyleSupport('position', 'sticky')).toBe(true);
  });

  it('属性 + 非法值返回 false', () => {
    expect(isStyleSupport('position', 'notARealValue')).toBe(false);
  });

  it('属性本身不支持时，属性 + 值也返回 false', () => {
    expect(isStyleSupport('notARealProperty', 'anything')).toBe(false);
  });
});

describe('getScroll', () => {
  it('window → pageYOffset', () => {
    expect(getScroll(window)).toBe(window.pageYOffset);
  });

  it('document → documentElement.scrollTop', () => {
    expect(getScroll(document)).toBe(document.documentElement.scrollTop);
  });

  it('HTMLElement → scrollTop', () => {
    const div = document.createElement('div');
    Object.defineProperty(div, 'scrollTop', { value: 120, configurable: true });
    expect(getScroll(div)).toBe(120);
  });

  it('★ 类形状对象（测试常传的假对象）', () => {
    expect(getScroll({ scrollTop: 400 })).toBe(400);
  });

  it('null / undefined 走不到任何分支', () => {
    expect(getScroll(null)).toBe(0);
    expect(getScroll(undefined)).toBe(0);
  });

  it('类形状对象没有 scrollTop 时回退到 ownerDocument', () => {
    const fake = { ownerDocument: { documentElement: { scrollTop: 77 } } };
    expect(getScroll(fake as unknown as HTMLElement)).toBe(77);
  });
});

describe('getDOM / getElement / getElementFromVNode', () => {
  it('getDOM 只认 DOM 元素与 { nativeElement }', () => {
    const div = document.createElement('div');
    expect(getDOM(div)).toBe(div);
    expect(getDOM({ nativeElement: div })).toBe(div);
    expect(getDOM({ $el: div })).toBeNull();
    expect(getDOM(null)).toBeNull();
    expect(getDOM(123)).toBeNull();
  });

  it('getElement 认识 Vue 的 { value }（Ref）', () => {
    const div = document.createElement('div');
    expect(getElement({ value: div })).toBe(div);
    expect(getElement({ value: { value: div } })).toBe(div);
  });

  it('getElement 兼容 { current }（迁移期）', () => {
    const div = document.createElement('div');
    expect(getElement({ current: div })).toBe(div);
  });

  it('getElement 认识 { $el } 与组件实例', () => {
    const div = document.createElement('div');
    expect(getElement({ $el: div })).toBe(div);
    expect(getElement({ $el: div, $: {} })).toBe(div);
  });

  it('getElement 对 null / 原始值返回 null', () => {
    expect(getElement(null)).toBeNull();
    expect(getElement(undefined)).toBeNull();
    expect(getElement('div')).toBeNull();
    expect(getElement({})).toBeNull();
  });

  it('getElement 能从元素 vnode 取到 el', () => {
    const vnode = h('div');
    const el = document.createElement('div');
    vnode.el = el;
    expect(getElement(vnode)).toBe(el);
    expect(getElementFromVNode(vnode)).toBe(el);
  });

  it('★ 多根组件的 $el 是锚点 → 返回 null 而不是抛错', () => {
    // Vue 多根组件的 $el 是 Text/Comment 锚点，不是元素
    expect(getElement({ $el: document.createTextNode('') })).toBeNull();
    expect(getElement({ $el: document.createComment('v-if') })).toBeNull();
  });

  it('getElementFromVNode 对非 vnode / Fragment 返回 null', () => {
    expect(getElementFromVNode(null)).toBeNull();
    expect(getElementFromVNode(undefined)).toBeNull();
    expect(getElementFromVNode(h('div') /* el 为 null */)).toBeNull();
  });

  it('getElementFromVNode 对组件 vnode 经 component.proxy 解析', () => {
    const div = document.createElement('div');
    const vnode = h({ render: () => h('span') });
    (vnode as unknown as { component: unknown }).component = { proxy: { $el: div, $: {} } };
    expect(getElementFromVNode(vnode)).toBe(div);
  });
});

describe('KeyCode', () => {
  it('关键常量与 closure-library 一致', () => {
    expect(KeyCode.BACKSPACE).toBe(8);
    expect(KeyCode.TAB).toBe(9);
    expect(KeyCode.ENTER).toBe(13);
    expect(KeyCode.ESC).toBe(27);
    expect(KeyCode.SPACE).toBe(32);
    expect(KeyCode.LEFT).toBe(37);
    expect(KeyCode.UP).toBe(38);
    expect(KeyCode.RIGHT).toBe(39);
    expect(KeyCode.DOWN).toBe(40);
    expect(KeyCode.A).toBe(65);
    expect(KeyCode.Z).toBe(90);
    expect(KeyCode.F12).toBe(123);
    expect(KeyCode.WIN_IME).toBe(229);
  });

  it('MAC_FF_META 与 WIN_KEY 同值（224）', () => {
    expect(KeyCode.MAC_FF_META).toBe(KeyCode.WIN_KEY);
  });

  describe('isTextModifyingKeyEvent', () => {
    const ev = (init: Partial<KeyboardEvent> & { keyCode: number }) =>
      ({ altKey: false, ctrlKey: false, metaKey: false, ...init }) as KeyboardEvent;

    it('普通字符键会输入文本', () => {
      expect(KeyCode.isTextModifyingKeyEvent(ev({ keyCode: KeyCode.A }))).toBe(true);
    });

    it('Alt（无 Ctrl）与 Meta 不输入文本', () => {
      expect(KeyCode.isTextModifyingKeyEvent(ev({ keyCode: KeyCode.A, altKey: true }))).toBe(false);
      expect(KeyCode.isTextModifyingKeyEvent(ev({ keyCode: KeyCode.A, metaKey: true }))).toBe(
        false,
      );
      // Alt + Ctrl 仍然输入文本
      expect(
        KeyCode.isTextModifyingKeyEvent(ev({ keyCode: KeyCode.A, altKey: true, ctrlKey: true })),
      ).toBe(true);
    });

    it('功能键不输入文本', () => {
      expect(KeyCode.isTextModifyingKeyEvent(ev({ keyCode: KeyCode.F1 }))).toBe(false);
      expect(KeyCode.isTextModifyingKeyEvent(ev({ keyCode: KeyCode.F12 }))).toBe(false);
    });

    it('方向键 / Esc / Home / End / Shift 等返回 false', () => {
      for (const code of [
        KeyCode.LEFT,
        KeyCode.UP,
        KeyCode.RIGHT,
        KeyCode.DOWN,
        KeyCode.ESC,
        KeyCode.HOME,
        KeyCode.END,
        KeyCode.SHIFT,
      ]) {
        expect(KeyCode.isTextModifyingKeyEvent(ev({ keyCode: code })), String(code)).toBe(false);
      }
    });
  });

  describe('isCharacterKey', () => {
    it('数字 / 字母 / 小键盘数字', () => {
      expect(KeyCode.isCharacterKey(KeyCode.ZERO)).toBe(true);
      expect(KeyCode.isCharacterKey(KeyCode.NINE)).toBe(true);
      expect(KeyCode.isCharacterKey(KeyCode.A)).toBe(true);
      expect(KeyCode.isCharacterKey(KeyCode.Z)).toBe(true);
      expect(KeyCode.isCharacterKey(KeyCode.NUM_ZERO)).toBe(true);
      expect(KeyCode.isCharacterKey(KeyCode.NUM_MULTIPLY)).toBe(true);
    });

    it('常用标点', () => {
      for (const code of [
        KeyCode.SPACE,
        KeyCode.SEMICOLON,
        KeyCode.DASH,
        KeyCode.SLASH,
        KeyCode.BACKSLASH,
      ]) {
        expect(KeyCode.isCharacterKey(code)).toBe(true);
      }
    });

    it('功能键不是字符键', () => {
      expect(KeyCode.isCharacterKey(KeyCode.F1)).toBe(false);
      expect(KeyCode.isCharacterKey(KeyCode.ESC)).toBe(false);
      expect(KeyCode.isCharacterKey(KeyCode.LEFT)).toBe(false);
    });

    it('jsdom 的 UA 含 "AppleWebKit"，所以 keyCode 0 被判为字符键（WebKit 分支）', () => {
      expect(window.navigator.userAgent).toContain('WebKit');
      expect(KeyCode.isCharacterKey(0)).toBe(true);
    });

    it('★ navigator 不可用时不抛错（rc-util 原实现会抛 TypeError）', () => {
      const descriptor = Object.getOwnPropertyDescriptor(window, 'navigator');
      Object.defineProperty(window, 'navigator', { value: undefined, configurable: true });
      try {
        expect(() => KeyCode.isCharacterKey(0)).not.toThrow();
        expect(KeyCode.isCharacterKey(0)).toBe(false);
      } finally {
        if (descriptor) Object.defineProperty(window, 'navigator', descriptor);
      }
    });

    it('★ 无 DOM 环境（SSR）时不抛错并返回 false', () => {
      vi.stubGlobal('window', undefined);
      try {
        expect(canUseDom()).toBe(false);
        expect(() => KeyCode.isCharacterKey(0)).not.toThrow();
        expect(KeyCode.isCharacterKey(0)).toBe(false);
        // 非 0 的判定不依赖 DOM，仍然正确
        expect(KeyCode.isCharacterKey(KeyCode.A)).toBe(true);
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });

  describe('isEditableTarget', () => {
    it('input / textarea / select / contentEditable 返回 true', () => {
      for (const tag of ['input', 'textarea', 'select']) {
        const el = document.createElement(tag);
        expect(KeyCode.isEditableTarget({ target: el } as unknown as KeyboardEvent)).toBe(true);
      }
      const editable = document.createElement('div');
      Object.defineProperty(editable, 'isContentEditable', { value: true, configurable: true });
      expect(KeyCode.isEditableTarget({ target: editable } as unknown as KeyboardEvent)).toBe(true);
    });

    it('普通元素与非 HTMLElement 目标返回 false', () => {
      const div = document.createElement('div');
      expect(KeyCode.isEditableTarget({ target: div } as unknown as KeyboardEvent)).toBe(false);
      expect(KeyCode.isEditableTarget({ target: null } as unknown as KeyboardEvent)).toBe(false);
      expect(KeyCode.isEditableTarget({ target: document } as unknown as KeyboardEvent)).toBe(
        false,
      );
    });
  });
});

describe('isStyleSupport 的 SSR 守卫', () => {
  it('无 documentElement 时返回 false 而不是抛错', () => {
    const spy = vi
      .spyOn(document, 'documentElement', 'get')
      .mockReturnValue(null as unknown as HTMLElement);
    expect(isStyleSupport('display')).toBe(false);
    spy.mockRestore();
  });
});
