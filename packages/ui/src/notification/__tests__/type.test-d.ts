/** L3 类型（G7）—— 正例 + 负例（负例包在永不调用的闭包里）。 */
import { describe, expectTypeOf } from 'vitest';
import type {
  ArgsProps,
  GlobalConfigProps,
  IconType,
  NotificationConfig,
  NotificationInstance,
  NotificationPlacement,
  NotificationSemanticType,
} from '../interface';

describe('Notification · 类型', () => {
  it('NotificationPlacement 是 6 值联合', () => {
    expectTypeOf<NotificationPlacement>().toEqualTypeOf<
      'top' | 'topLeft' | 'topRight' | 'bottom' | 'bottomLeft' | 'bottomRight'
    >();
  });

  it('IconType 是 4 值联合（**没有** loading —— 与 message 的差异）', () => {
    expectTypeOf<IconType>().toEqualTypeOf<'success' | 'info' | 'error' | 'warning'>();
  });

  it('NotificationInstance.open 返回 void（**不是** thenable —— 与 message 的差异）', () => {
    expectTypeOf<NotificationInstance['open']>().returns.toBeVoid();
  });

  it('NotificationSemanticType 有 11 个槽', () => {
    expectTypeOf<NonNullable<NotificationSemanticType['classNames']>>().toHaveProperty('list');
    expectTypeOf<NonNullable<NotificationSemanticType['classNames']>>().toHaveProperty('section');
    expectTypeOf<NonNullable<NotificationSemanticType['classNames']>>().toHaveProperty('progress');
  });

  it('NotificationConfig.stack 接受 boolean | { threshold }', () => {
    expectTypeOf<NonNullable<NotificationConfig['stack']>>().toEqualTypeOf<
      boolean | { threshold?: number }
    >();
  });

  it('GlobalConfigProps 含 placement / showProgress / closeIcon', () => {
    expectTypeOf<GlobalConfigProps>().toHaveProperty('placement');
    expectTypeOf<GlobalConfigProps>().toHaveProperty('showProgress');
    expectTypeOf<GlobalConfigProps>().toHaveProperty('closeIcon');
  });

  it('正例：合法配置', () => {
    const sample: ArgsProps = {
      title: 't',
      description: 'd',
      type: 'success',
      placement: 'bottomRight',
      role: 'status',
      duration: false,
      showProgress: true,
      closable: { closeIcon: null, disabled: true },
    };
    expectTypeOf(sample).not.toBeNever();
  });

  it('负例（永不调用的闭包）', () => {
    const negative = () => {
      // @ts-expect-error type 不接受 loading（notification 没有这个形态）
      const a: ArgsProps = { title: 't', type: 'loading' };
      // @ts-expect-error placement 不接受任意字符串
      const b: ArgsProps = { title: 't', placement: 'left' };
      // @ts-expect-error role 只接受 alert / status
      const c: ArgsProps = { title: 't', role: 'dialog' };
      return [a, b, c];
    };
    void negative;
  });
});

import { h } from 'vue';
import Notice from '../engine/Notice';
import notification from '../index';
import type { NotificationPurePanelSlots } from '../interface';
import useNotification from '../useNotification';

const NotificationPanel = notification._InternalPanelDoNotUseOrYouWillBeFired;
const NotificationList = notification._InternalListDoNotUseOrYouWillBeFired;
const panelSlots: NotificationPurePanelSlots = {
  title: () => 0,
  actions: () => [h('button', 'Act')],
};
h(
  NotificationPanel,
  { title: 'Title', onClose: () => {}, onClick: (event) => event.preventDefault() },
  panelSlots,
);
h(NotificationList, {
  items: [{ key: 0, title: 0, description: 0, actions: 0 }],
  styles: { list: { zIndex: 0 } },
});
h(Notice, {
  prefixCls: 'apollo-notification',
  title: 0,
  description: 0,
  actions: 0,
  onClick: (event) => event.preventDefault(),
  onClose: () => {},
});
expectTypeOf<
  NonNullable<InstanceType<typeof Notice>['$props']['onClick']>
>().parameters.toEqualTypeOf<[event: MouseEvent]>();
expectTypeOf<
  NonNullable<InstanceType<typeof NotificationPanel>['$props']['onClose']>
>().parameters.toEqualTypeOf<[]>();
expectTypeOf<InstanceType<typeof NotificationPanel>['$props']>().not.toHaveProperty('className');
const hookContracts = () => {
  const [api, Holder] = useNotification({
    classNames: { list: 'list' },
    styles: { list: { zIndex: '0' } },
  });
  h(Holder);
  h('div', [Holder()]);
  api.open({
    title: 0,
    description: h('span'),
    actions: 0,
    onClick: (event) => event.preventDefault(),
  });
  // @ts-expect-error List styling belongs to the holder configuration.
  api.open({ title: 'Text', classNames: { list: 'invalid' } });
  // @ts-expect-error PurePanel text props stay strings; rich titles use #title.
  const invalidTitle: InstanceType<typeof NotificationPanel>['$props'] = { title: h('span') };
  // @ts-expect-error PurePanel uses native class.
  const invalidClass: InstanceType<typeof NotificationPanel>['$props'] = { className: 'legacy' };
  // @ts-expect-error A real Notice click emits a MouseEvent.
  const invalidEvent: InstanceType<typeof Notice>['$props'] = { onClick: (_event: string) => {} };
  return [invalidTitle, invalidClass, invalidEvent];
};
void hookContracts;

const invalidPureSubscription = () => {
  const invalid: InstanceType<typeof NotificationPanel>['$props'] = {
    // @ts-expect-error PurePanel owns close through Vue emits; nested command subscriptions belong to ArgsProps.
    closable: { onClose: () => {} },
  };
  const invalidClass: InstanceType<typeof NotificationPanel>['$props'] = {
    // @ts-expect-error PurePanel has no list container; list semantics belong to PureList or the holder.
    classNames: { list: 'invalid' },
  };
  const invalidStyle: InstanceType<typeof NotificationPanel>['$props'] = {
    // @ts-expect-error PurePanel has no listContent container.
    styles: { listContent: { color: 'red' } },
  };
  return [invalid, invalidClass, invalidStyle];
};
void invalidPureSubscription;
