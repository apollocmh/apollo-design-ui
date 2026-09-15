import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import warningDefault, {
  call,
  note,
  noteOnce,
  type PreMessageFn,
  preMessage,
  resetPreMessage,
  resetWarned,
  warning,
  warningOnce,
} from '../warning';

/**
 * 告警体系的测试重点不是"能打印"，而是：
 *   1. 去重范围（按 message 文本，跨组件）
 *   2. `preMessage` 链的**累加**语义与"返回 falsy 即阻断"
 *   3. 默认导出对象上必须挂三个静态属性（antd 依赖这个形状）
 */

describe('warning', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetWarned();
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
    warnSpy.mockRestore();
    resetWarned();
  });

  it('valid 为 true 时静默', () => {
    warning(true, 'should not appear');
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('valid 为 false 时输出 "Warning: <message>"', () => {
    warning(false, 'some error');
    expect(errorSpy).toHaveBeenCalledWith('Warning: some error');
  });

  it('note 输出到 console.warn 且前缀是 "Note: "', () => {
    note(false, 'some note');
    expect(warnSpy).toHaveBeenCalledWith('Note: some note');
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('非布尔 falsy 值也触发', () => {
    // rc-util 只做 `if (!valid)`，运行时不校验类型 —— antd 里 `warning(1 === 2, ...)` 这类写法很常见。
    // 这里直接塞一个非布尔 falsy，顺便钉住「不校验类型」这个契约。
    warning(0 as unknown as boolean, 'falsy');
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});

describe('warningOnce / noteOnce / call', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetWarned();
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
    resetWarned();
  });

  it('同一条 message 只告警一次', () => {
    warningOnce(false, 'dup');
    warningOnce(false, 'dup');
    warningOnce(false, 'dup');
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('不同 message 各自告警', () => {
    warningOnce(false, 'a');
    warningOnce(false, 'b');
    expect(errorSpy).toHaveBeenCalledTimes(2);
  });

  it('resetWarned 清空去重表', () => {
    warningOnce(false, 'dup');
    resetWarned();
    warningOnce(false, 'dup');
    expect(errorSpy).toHaveBeenCalledTimes(2);
  });

  it('call 对同一条 message 只调用一次 method', () => {
    const method = vi.fn();
    call(method, false, 'x');
    call(method, false, 'x');
    expect(method).toHaveBeenCalledTimes(1);
    expect(method).toHaveBeenCalledWith(false, 'x');
  });

  it('call 在 valid 为 true 时完全不调用 method', () => {
    const method = vi.fn();
    call(method, true, 'x');
    expect(method).not.toHaveBeenCalled();
  });

  it('noteOnce 与 warningOnce 共享同一张去重表（按 message 文本去重，不区分类型）', () => {
    // 这是 rc-util 的真实行为：去重表是 message → true，没有类型维度
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warningOnce(false, 'shared');
    noteOnce(false, 'shared');
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe('preMessage 链', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetWarned();
    resetPreMessage();
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
    resetWarned();
    resetPreMessage();
  });

  it('是累加的，按注册顺序 reduce', () => {
    const first: PreMessageFn = (msg) => `[1]${msg}`;
    const second: PreMessageFn = (msg) => `[2]${msg}`;
    preMessage(first);
    preMessage(second);
    warning(false, 'body');
    expect(errorSpy).toHaveBeenCalledWith('Warning: [2][1]body');
  });

  it('返回 falsy 即阻断输出', () => {
    preMessage(() => null);
    warning(false, 'body');
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('收到 type 参数以区分 warning / note', () => {
    const seen: string[] = [];
    preMessage((_msg, type) => {
      seen.push(type);
      return _msg;
    });
    warning(false, 'a');
    note(false, 'b');
    expect(seen).toEqual(['warning', 'note']);
  });
});

describe('默认导出对象的形状', () => {
  it('默认导出是 warningOnce，且挂有 preMessage / resetWarned / noteOnce', () => {
    expect(typeof warningDefault).toBe('function');
    expect(typeof warningDefault.preMessage).toBe('function');
    expect(typeof warningDefault.resetWarned).toBe('function');
    expect(typeof warningDefault.noteOnce).toBe('function');
  });

  it('三个静态属性与具名导出是同一个函数引用', () => {
    // antd 的 `_util/warning.js` 通过默认导出对象读 resetWarned，
    // 若不是同一引用，"通过具名导出重置"与"通过默认导出重置"会各自维护一张表。
    expect(warningDefault.resetWarned).toBe(resetWarned);
    expect(warningDefault.preMessage).toBe(preMessage);
    expect(warningDefault.noteOnce).toBe(noteOnce);
  });
});
