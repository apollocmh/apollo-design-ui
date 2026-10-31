/** L3 类型（G7）—— 正例 + 负例（负例包在永不调用的闭包里，CHECKLIST §一）。 */
import { describe, expectTypeOf } from 'vitest';
import { h } from 'vue';
import type { MessageInstance } from '../../message/interface';
import type { ModalHookAPI } from '../../modal/interface';
import type { NotificationInstance } from '../../notification/interface';
import App, { type useApp } from '../index';
import type { AppComponentType, AppProps, AppSlots } from '../interface';

expectTypeOf(App.useApp).toEqualTypeOf<typeof useApp>();
expectTypeOf<ReturnType<typeof useApp>['message']>().toEqualTypeOf<MessageInstance>();
expectTypeOf<ReturnType<typeof useApp>['notification']>().toEqualTypeOf<NotificationInstance>();
expectTypeOf<ReturnType<typeof useApp>['modal']>().toEqualTypeOf<ModalHookAPI>();
expectTypeOf<InstanceType<typeof App>['$props']>().not.toHaveProperty('className');
expectTypeOf<InstanceType<typeof App>['$props']>().not.toHaveProperty('rootClassName');
expectTypeOf<InstanceType<typeof App>>().not.toHaveProperty('focus');
const slots: AppSlots = { default: () => [0, h('span', 'Content')] };
h(
  App,
  { component: 'main', message: { duration: 0 }, notification: { placement: 'bottomLeft' } },
  slots,
);
h(App, { component: false }, { default: () => 0 });
// @ts-expect-error App only supports its four documented native hosts or false.
h(App, { component: true });
// @ts-expect-error Actual hook configuration validates duration.
h(App, { message: { duration: 'long' } });

const realServices = () => {
  const { message, notification, modal } = App.useApp();
  message.info(0).then((terminated) => terminated.valueOf());
  notification.open({ title: 0, actions: h('button', 'Action') });
  const instance = modal.confirm({ title: 'Confirm', onOk: async () => true });
  instance.then((accepted) => accepted.valueOf());
  instance.update({ confirmLoading: true });
  // @ts-expect-error Notification exposes no loading service.
  notification.loading({ title: 'Loading' });
  // @ts-expect-error Hook Modal owns its session; open is not an update field.
  instance.update({ open: false });
  // @ts-expect-error Message content is required by the actual service.
  message.open({ duration: 0 });
};
void realServices;

describe('App · 类型', () => {
  it('component 是 5 值联合（4 元素 + false）', () => {
    expectTypeOf<AppComponentType>().toEqualTypeOf<'div' | 'section' | 'main' | 'span' | false>();
  });

  it('正例：合法 prop 组合', () => {
    const sample: Pick<AppProps, 'component' | 'message' | 'notification'> = {
      component: 'section',
      message: { maxCount: 1 },
      notification: { placement: 'topLeft' },
    };
    expectTypeOf(sample).not.toBeNever();
  });

  it('负例（永不调用的闭包）', () => {
    const negative = () => {
      const props: AppProps = {
        // @ts-expect-error component 不接受 'article'
        component: 'article',
      };
      return props;
    };
    void negative;
  });
});
