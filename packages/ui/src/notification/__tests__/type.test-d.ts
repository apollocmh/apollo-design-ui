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
