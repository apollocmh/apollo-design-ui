/** L3 类型（G7）—— 正例 + 负例（负例包在永不调用的闭包里）。 */
import { describe, expectTypeOf } from 'vitest';
import type {
  AutoFocusButton,
  FocusableConfig,
  MaskType,
  ModalButtonProps,
  ModalFuncProps,
  ModalHookAPI,
  ModalInstance,
  ModalOkType,
  ModalProps,
  ModalSemanticType,
  ModalType,
  MousePosition,
} from '../interface';

describe('Modal · 类型', () => {
  it('ModalType 是 6 值联合（warn 与 warning 同义）', () => {
    expectTypeOf<ModalType>().toEqualTypeOf<
      'info' | 'success' | 'error' | 'warn' | 'warning' | 'confirm'
    >();
  });

  it('AutoFocusButton 含 null（显式 null = 不自动聚焦）', () => {
    expectTypeOf<null>().toMatchTypeOf<AutoFocusButton>();
    expectTypeOf<'ok'>().toMatchTypeOf<AutoFocusButton>();
    expectTypeOf<'cancel'>().toMatchTypeOf<AutoFocusButton>();
  });

  it('ModalOkType 含 antd LegacyButtonType 的 5 值 + danger', () => {
    expectTypeOf<'primary'>().toMatchTypeOf<ModalOkType>();
    expectTypeOf<'dashed'>().toMatchTypeOf<ModalOkType>();
    // ⚠️ `danger` 是 `LegacyButtonType = ButtonType | 'danger'` 的一部分
    expectTypeOf<'danger'>().toMatchTypeOf<ModalOkType>();
    expectTypeOf<'ghost'>().not.toMatchTypeOf<ModalOkType>();
  });

  it('MaskType 复用 _internal 的单一真源', () => {
    expectTypeOf<boolean>().toMatchTypeOf<MaskType>();
    expectTypeOf<{
      enabled?: boolean;
      blur?: boolean;
      closable?: boolean;
    }>().toMatchTypeOf<MaskType>();
  });

  it('ModalSemanticType 有 9 个槽', () => {
    const cn = {} as NonNullable<ModalSemanticType['classNames']>;
    expectTypeOf(cn).toHaveProperty('root');
    expectTypeOf(cn).toHaveProperty('container');
    expectTypeOf(cn).toHaveProperty('close');
    expectTypeOf(cn).toHaveProperty('wrapper');
    expectTypeOf(cn).toHaveProperty('mask');
  });

  it('ModalProps 含 open / width / title / focusable / destroyOnHidden', () => {
    expectTypeOf<ModalProps>().toHaveProperty('open');
    expectTypeOf<ModalProps>().toHaveProperty('width');
    expectTypeOf<ModalProps>().toHaveProperty('title');
    expectTypeOf<ModalProps>().toHaveProperty('okText');
    expectTypeOf<ModalProps>().toHaveProperty('cancelText');
    expectTypeOf<ModalProps>().toHaveProperty('focusable');
    expectTypeOf<ModalProps>().toHaveProperty('destroyOnHidden');
    expectTypeOf<ModalProps>().toHaveProperty('maskClosable');
  });

  it('MousePosition 允许 null（无鼠标位置时）', () => {
    expectTypeOf<null>().toMatchTypeOf<MousePosition>();
    expectTypeOf<{ x: number; y: number }>().toMatchTypeOf<MousePosition>();
  });

  it('FocusableConfig 的两个键都可选', () => {
    expectTypeOf<Record<string, never>>().toMatchTypeOf<FocusableConfig>();
  });

  it('ModalInstance / ModalHookAPI 的形态', () => {
    expectTypeOf<ModalInstance>().toHaveProperty('destroy');
    expectTypeOf<ModalInstance>().toHaveProperty('update');
    expectTypeOf<ModalHookAPI>().toHaveProperty('confirm');
    expectTypeOf<ModalHookAPI>().toHaveProperty('warn');
    expectTypeOf<ModalHookAPI>().toHaveProperty('warning');
  });

  it('Modal button config uses Vue-native class/style attrs', () => {
    const button: ModalButtonProps = {
      class: ['ok-button', { active: true }],
      style: { color: 'red' },
    };
    expectTypeOf(button.class).not.toBeNever();

    const _never = () => {
      // @ts-expect-error nested Button config uses `class`, not className
      const oldClassName: ModalButtonProps = { className: 'legacy' };
      // @ts-expect-error nested Button config uses `class`, not rootClassName
      const oldRootClassName: ModalButtonProps = { rootClassName: 'legacy' };
      return [oldClassName, oldRootClassName];
    };
    void _never;
  });

  it('正例：合法配置', () => {
    const sample: ModalProps = {
      open: true,
      width: { xs: 100, md: '50%' },
      title: 't',
      mask: { closable: false },
      focusable: { trap: true, focusTriggerAfterClose: false },
      closable: { disabled: false },
    };
    expectTypeOf(sample).not.toBeNever();

    const funcSample: ModalFuncProps = {
      title: 't',
      content: 'c',
      type: 'confirm',
      okCancel: true,
      autoFocusButton: null,
      focusable: { autoFocusButton: 'cancel' },
    };
    expectTypeOf(funcSample).not.toBeNever();
  });

  it('负例（永不调用的闭包）', () => {
    const negative = () => {
      // @ts-expect-error type 不接受任意字符串
      const a: ModalFuncProps = { type: 'danger' };
      // @ts-expect-error autoFocusButton 不接受 'confirm'
      const b: ModalFuncProps = { autoFocusButton: 'confirm' };
      // @ts-expect-error okType 不接受 'ghost'（它是布尔 prop，不是 LegacyButtonType）
      const c: ModalProps = { okType: 'ghost' };
      // @ts-expect-error mask 不接受字符串
      const d: ModalProps = { mask: 'blur' };
      return [a, b, c, d];
    };
    void negative;
  });
});
