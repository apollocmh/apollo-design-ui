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

import { h } from 'vue';
import message from '../index';
import type { MessagePurePanelSlots } from '../interface';
import useMessage from '../useMessage';

const MessagePanel = message._InternalPanelDoNotUseOrYouWillBeFired;
const MessageList = message._InternalListDoNotUseOrYouWillBeFired;
const panelSlots: MessagePurePanelSlots = { content: () => 0, icon: () => null };
h(MessagePanel, { content: 'Text', onClick: (event) => event.preventDefault() }, panelSlots);
h(MessageList, {
  items: [{ key: 0, content: h('span', 'Content'), type: 'info' }],
  styles: { list: { zIndex: 0 } },
});
expectTypeOf<
  NonNullable<InstanceType<typeof MessagePanel>['$props']['onClick']>
>().parameters.toEqualTypeOf<[event: MouseEvent]>();
expectTypeOf<InstanceType<typeof MessagePanel>['$props']>().not.toHaveProperty('className');
const hookContracts = () => {
  const [api, Holder] = useMessage({
    classNames: { list: 'list' },
    getContainer: () => document.createElement('div').attachShadow({ mode: 'open' }),
  });
  h(Holder);
  h('div', [Holder()]);
  const handle = api.info(0);
  handle.then((closed) => closed.valueOf());
  handle();
  // @ts-expect-error List styling belongs to the holder configuration.
  api.open({ content: 'Text', styles: { list: { color: 'red' } } });
  // @ts-expect-error PurePanel text props stay strings; rich content uses #content.
  const invalidText: InstanceType<typeof MessagePanel>['$props'] = { content: h('span') };
  // @ts-expect-error PurePanel uses native class.
  const invalidClass: InstanceType<typeof MessagePanel>['$props'] = { className: 'legacy' };
  const invalidListClass: InstanceType<typeof MessagePanel>['$props'] = {
    // @ts-expect-error PurePanel has no list container; list semantics belong to PureList or the holder.
    classNames: { list: 'invalid' },
  };
  const invalidListStyle: InstanceType<typeof MessagePanel>['$props'] = {
    // @ts-expect-error PurePanel has no listContent container.
    styles: { listContent: { color: 'red' } },
  };
  return [invalidText, invalidClass, invalidListClass, invalidListStyle];
};
void hookContracts;
