/** L3 类型（G7）—— 正例 + 负例（负例包在永不调用的闭包里，CHECKLIST §一）。 */
import { describe, expectTypeOf } from 'vitest';
import type {
  ArgsProps,
  ConfigOptions,
  JointContent,
  MessageInstance,
  MessageType,
  NoticeType,
  TypeOpen,
} from '../interface';

describe('Message · 类型', () => {
  it('NoticeType 是 5 值联合', () => {
    expectTypeOf<NoticeType>().toEqualTypeOf<
      'info' | 'success' | 'error' | 'warning' | 'loading'
    >();
  });

  it('MessageType 同时是可调用与 PromiseLike<boolean>', () => {
    expectTypeOf<MessageType>().toMatchTypeOf<() => void>();
    expectTypeOf<MessageType>().toMatchTypeOf<PromiseLike<boolean>>();
  });

  it('TypeOpen 的第二参接受 number 或函数', () => {
    expectTypeOf<TypeOpen>().parameter(1).toEqualTypeOf<number | (() => void) | undefined>();
  });

  it('JointContent = VNodeChild | ArgsProps', () => {
    expectTypeOf<ArgsProps>().toMatchTypeOf<JointContent>();
  });

  it('ConfigOptions 的 stack 接受 boolean | { threshold }', () => {
    expectTypeOf<NonNullable<ConfigOptions['stack']>>().toEqualTypeOf<
      boolean | { threshold?: number }
    >();
  });

  it('MessageInstance 含 5 个类型方法 + open/destroy', () => {
    expectTypeOf<MessageInstance>().toHaveProperty('success');
    expectTypeOf<MessageInstance>().toHaveProperty('loading');
    expectTypeOf<MessageInstance>().toHaveProperty('open');
    expectTypeOf<MessageInstance>().toHaveProperty('destroy');
  });

  it('正例：合法配置', () => {
    const sample: ArgsProps = {
      content: 'hello',
      type: 'success',
      duration: 3,
      key: 'k',
      pauseOnHover: true,
      onClick: () => {},
    };
    expectTypeOf(sample).not.toBeNever();
  });

  it('负例（永不调用的闭包）', () => {
    const negative = () => {
      // @ts-expect-error type 不接受任意字符串
      const a: ArgsProps = { content: 'x', type: 'nope' };
      // @ts-expect-error duration 不接受字符串
      const b: ArgsProps = { content: 'x', duration: '3' };
      // @ts-expect-error key 不接受对象
      const c: ArgsProps = { content: 'x', key: {} };
      return [a, b, c];
    };
    void negative;
  });
});
