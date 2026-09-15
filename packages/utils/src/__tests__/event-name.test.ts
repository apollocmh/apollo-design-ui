import { describe, expect, it } from 'vitest';
import {
  buildEventNameMap,
  buildVueEventNameMap,
  isReactEventName,
  needsSemanticHandling,
  SEMANTIC_MISMATCH_EVENTS,
  toNativeEventName,
  toVueEventName,
} from '../event-name';
import { PICK_ATTRS_ALL, PICK_ATTRS_ATTRIBUTES, PICK_ATTRS_EVENTS } from '../pick-attrs-allowlist';

/**
 * 这一组测试是 Phase 2 最重要的回归网（F1）。
 *
 * 背景：Vue 的 runtime-dom 对 `on*` 只做 `hyphenate()`，不做 React 那样的名称归一化。
 * 如果事件名映射错了，事件会**静默失效** —— 不报错、不告警，只是不触发。
 * 所以这里必须**枚举全部 90 个白名单事件**逐一验证，而不是抽查几个。
 */

describe('isReactEventName', () => {
  it('识别 on + 大写字母开头', () => {
    expect(isReactEventName('onClick')).toBe(true);
    expect(isReactEventName('onKeyDown')).toBe(true);
    expect(isReactEventName('on')).toBe(false);
    expect(isReactEventName('onclick')).toBe(false);
    expect(isReactEventName('className')).toBe(false);
    expect(isReactEventName('data-x')).toBe(false);
    expect(isReactEventName('')).toBe(false);
  });
});

describe('toNativeEventName', () => {
  it('默认规则：去掉 on 后整体小写', () => {
    expect(toNativeEventName('onClick')).toBe('click');
    expect(toNativeEventName('onKeyDown')).toBe('keydown');
    expect(toNativeEventName('onMouseEnter')).toBe('mouseenter');
    expect(toNativeEventName('onTouchStart')).toBe('touchstart');
    expect(toNativeEventName('onCompositionStart')).toBe('compositionstart');
    expect(toNativeEventName('onGotPointerCapture')).toBe('gotpointercapture');
    expect(toNativeEventName('onBeforeToggle')).toBe('beforetoggle');
    expect(toNativeEventName('onAnimationIteration')).toBe('animationiteration');
  });

  it('两个例外：onDoubleClick → dblclick、onDragExit → dragleave', () => {
    // 若写成默认规则会得到 'doubleclick' / 'dragexit'，两者都是无效的 DOM 事件名
    expect(toNativeEventName('onDoubleClick')).toBe('dblclick');
    expect(toNativeEventName('onDragExit')).toBe('dragleave');
  });

  it('非事件名返回 null', () => {
    expect(toNativeEventName('className')).toBeNull();
    expect(toNativeEventName('tabIndex')).toBeNull();
    expect(toNativeEventName('onclick')).toBeNull();
  });

  it('★ 白名单里的 90 个事件全部有映射，且映射结果不含大写字母与连字符', () => {
    expect(PICK_ATTRS_EVENTS).toHaveLength(90);

    for (const reactName of PICK_ATTRS_EVENTS) {
      const native = toNativeEventName(reactName);
      expect(native, `${reactName} 没有映射`).not.toBeNull();
      // 这是本测试的核心断言：Vue 的 hyphenate() 会产出 'key-down' 这种名字，
      // 而正确的原生事件名必须是全小写、无连字符。
      expect(native, `${reactName} → ${native} 含有大写字母`).toBe(native?.toLowerCase());
      expect(native, `${reactName} → ${native} 含有连字符`).not.toContain('-');
    }
  });

  it('★ 映射结果与「Vue hyphenate 之后的名字」在需要时应不同（证明映射确实在起作用）', () => {
    // Vue 的行为：hyphenate(name.slice(2))
    const vueWouldListenTo = (reactName: string) =>
      reactName
        .slice(2)
        .replace(/\B([A-Z])/g, '-$1')
        .toLowerCase();

    const differing = PICK_ATTRS_EVENTS.filter((n) => vueWouldListenTo(n) !== toNativeEventName(n));
    // 55 个多词事件名 + 2 个例外（onDoubleClick / onDragExit 本身是多词，已含在内）
    expect(differing.length).toBeGreaterThan(50);

    // 抽样确认关键项
    expect(vueWouldListenTo('onKeyDown')).toBe('key-down');
    expect(toNativeEventName('onKeyDown')).toBe('keydown');
  });

  it('不会把原生事件名（无 on 前缀）当作事件处理', () => {
    expect(toNativeEventName('dblclick')).toBeNull();
  });
});

describe('语义不一致事件（名字能对上但行为不同）', () => {
  it('onChange / onFocus / onBlur 被显式登记', () => {
    expect(SEMANTIC_MISMATCH_EVENTS).toEqual({
      onChange: 'change',
      onFocus: 'focus',
      onBlur: 'blur',
    });
  });

  it('needsSemanticHandling 只对这三个返回 true', () => {
    expect(needsSemanticHandling('onChange')).toBe(true);
    expect(needsSemanticHandling('onFocus')).toBe(true);
    expect(needsSemanticHandling('onBlur')).toBe(true);
    expect(needsSemanticHandling('onClick')).toBe(false);
    expect(needsSemanticHandling('onInput')).toBe(false);
  });

  it('这三个事件的名称映射本身仍然正确（语义问题不由映射层解决）', () => {
    expect(toNativeEventName('onChange')).toBe('change');
    expect(toNativeEventName('onFocus')).toBe('focus');
    expect(toNativeEventName('onBlur')).toBe('blur');
  });
});

describe('toVueEventName —— pickAttrs 实际使用的形态', () => {
  it('单单词名是幂等的（本来就是 Vue 的正确形态）', () => {
    expect(toVueEventName('onClick')).toBe('onClick');
    expect(toVueEventName('onInput')).toBe('onInput');
    expect(toVueEventName('onChange')).toBe('onChange');
    expect(toVueEventName('onFocus')).toBe('onFocus');
  });

  it('多词名被压成「on + 首字母大写」', () => {
    expect(toVueEventName('onKeyDown')).toBe('onKeydown');
    expect(toVueEventName('onMouseEnter')).toBe('onMouseenter');
    expect(toVueEventName('onTouchStart')).toBe('onTouchstart');
    expect(toVueEventName('onCompositionStart')).toBe('onCompositionstart');
    expect(toVueEventName('onGotPointerCapture')).toBe('onGotpointercapture');
  });

  it('两个例外同样生效', () => {
    expect(toVueEventName('onDoubleClick')).toBe('onDblclick');
    expect(toVueEventName('onDragExit')).toBe('onDragleave');
  });

  it('非事件名返回 null', () => {
    expect(toVueEventName('className')).toBeNull();
    expect(toVueEventName('onclick')).toBeNull();
  });

  it('★ 白名单里的 90 个事件全部有映射，且结果恒为 on + 单个大写字母开头', () => {
    for (const reactName of PICK_ATTRS_EVENTS) {
      const vueName = toVueEventName(reactName);
      expect(vueName, `${reactName} 没有映射`).not.toBeNull();
      // Vue 的 isOn 要求第 3 个字符是大写字母（或非小写字母）
      expect(vueName, `${reactName} → ${vueName} 不会被 Vue 认作监听器`).toMatch(/^on[A-Z][a-z]+$/);
    }
  });

  it('★★ 核心不变式：Vue 对结果的 hyphenate 必须还原出正确的原生事件名', () => {
    // 这是整条修复链的**唯一**判据：
    //   Vue 会执行 addEventListener(hyphenate(name.slice(2)))
    //   所以只要 hyphenate 还原出的名字 == 原生事件名，事件就一定会触发。
    const vueWillListenTo = (vueName: string) =>
      vueName
        .slice(2)
        .replace(/\B([A-Z])/g, '-$1')
        .toLowerCase();

    for (const reactName of PICK_ATTRS_EVENTS) {
      const vueName = toVueEventName(reactName) as string;
      const native = toNativeEventName(reactName) as string;
      expect(
        vueWillListenTo(vueName),
        `${reactName} → ${vueName} 会被监听成 ${vueWillListenTo(vueName)}，应为 ${native}`,
      ).toBe(native);
    }
  });

  it('★ 反证：如果直接用 React 原名，hyphenate 会产出错误的事件名', () => {
    const vueWillListenTo = (vueName: string) =>
      vueName
        .slice(2)
        .replace(/\B([A-Z])/g, '-$1')
        .toLowerCase();

    const broken = PICK_ATTRS_EVENTS.filter((n) => vueWillListenTo(n) !== toNativeEventName(n));
    // 55 个多词事件名会被 Vue 监听到错误的事件名上 —— 这就是 F1 的全部影响面
    expect(broken.length).toBe(55);
    expect(vueWillListenTo('onKeyDown')).toBe('key-down');
  });
});

describe('buildEventNameMap', () => {
  it('对白名单产出完整的 90 项映射', () => {
    const map = buildEventNameMap(PICK_ATTRS_EVENTS);
    expect(Object.keys(map)).toHaveLength(90);
    expect(map.onClick).toBe('click');
    expect(map.onDoubleClick).toBe('dblclick');
  });

  it('忽略非事件名', () => {
    const map = buildEventNameMap(['onClick', 'className']);
    expect(map).toEqual({ onClick: 'click' });
  });
});

describe('buildVueEventNameMap', () => {
  it('对白名单产出完整的 90 项 Vue 事件键映射', () => {
    const map = buildVueEventNameMap(PICK_ATTRS_EVENTS);
    expect(Object.keys(map)).toHaveLength(90);
    expect(map.onClick).toBe('onClick');
    expect(map.onKeyDown).toBe('onKeydown');
    expect(map.onDoubleClick).toBe('onDblclick');
  });

  it('忽略非事件名', () => {
    expect(buildVueEventNameMap(['onClick', 'className'])).toEqual({ onClick: 'onClick' });
  });
});

describe('白名单一致性（与生成产物对齐）', () => {
  it('属性与事件清单数量正确，且合并集合无重复丢失', () => {
    expect(PICK_ATTRS_ATTRIBUTES).toHaveLength(121);
    expect(PICK_ATTRS_EVENTS).toHaveLength(90);
    expect(PICK_ATTRS_ALL.size).toBe(211);
  });

  it('属性清单里不应混入事件名（反之亦然）', () => {
    for (const name of PICK_ATTRS_ATTRIBUTES) {
      expect(isReactEventName(name), `${name} 不应出现在属性清单`).toBe(false);
    }
    for (const name of PICK_ATTRS_EVENTS) {
      expect(isReactEventName(name), `${name} 应是事件名`).toBe(true);
    }
  });

  it('白名单包含几个关键的 DOM Contract 属性', () => {
    for (const name of [
      'role',
      'tabIndex',
      'disabled',
      'className',
      'style',
      'title',
      'id',
      'href',
    ]) {
      expect(PICK_ATTRS_ALL.has(name), `缺少 ${name}`).toBe(true);
    }
  });
});
