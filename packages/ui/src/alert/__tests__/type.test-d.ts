/**
 * L3 · 类型测试（含负例）。⚠️ 负例包在永不调用的闭包里（*.test-d.ts 会被真执行）。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { CSSProperties, VNodeChild } from 'vue';
import type {
  AlertClosable,
  AlertConfig,
  AlertProps,
  AlertRef,
  AlertSemanticClassNames,
  AlertSemanticStyles,
  AlertType,
  AlertVariant,
} from '../interface';

describe('Alert · Props 类型', () => {
  it('type 是四值联合、variant 是两值联合', () => {
    expectTypeOf<AlertType>().toEqualTypeOf<'success' | 'info' | 'warning' | 'error'>();
    expectTypeOf<AlertVariant>().toEqualTypeOf<'outlined' | 'filled'>();
  });

  it('语义槽位七槽齐备', () => {
    expectTypeOf<keyof AlertSemanticClassNames>().toEqualTypeOf<
      'root' | 'icon' | 'section' | 'title' | 'description' | 'actions' | 'close'
    >();
    expectTypeOf<keyof AlertSemanticStyles>().toEqualTypeOf<
      'root' | 'icon' | 'section' | 'title' | 'description' | 'actions' | 'close'
    >();
  });

  it('Ref 的 nativeElement 可空（PLATFORM 差异的类型体现）', () => {
    expectTypeOf<AlertRef['nativeElement']>().toEqualTypeOf<HTMLDivElement | null>();
  });

  it('AlertClosable 的三个具名字段', () => {
    expectTypeOf<AlertClosable['closeIcon']>().toEqualTypeOf<VNodeChild | undefined>();
    expectTypeOf<AlertClosable['onClose']>().toEqualTypeOf<((e: MouseEvent) => void) | undefined>();
    expectTypeOf<AlertClosable['afterClose']>().toEqualTypeOf<(() => void) | undefined>();
  });

  it('AlertProps 关键字段', () => {
    // C8-R2：title / description 收窄 string（富内容走 #title / #description 插槽）
    expectTypeOf<AlertProps['title']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<AlertProps['description']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<AlertProps['style']>().toEqualTypeOf<CSSProperties | undefined>();
  });

  it('AlertConfig 携带四种类型图标', () => {
    expectTypeOf<AlertConfig['successIcon']>().toEqualTypeOf<VNodeChild | undefined>();
    expectTypeOf<AlertConfig['errorIcon']>().toEqualTypeOf<VNodeChild | undefined>();
  });

  it('★ 负例（永不调用的闭包内）', () => {
    const _never = () => {
      // @ts-expect-error type 只有两个字面量之外的四值
      const badType: AlertProps = { type: 'notice' };
      // @ts-expect-error variant 不接受 'ghost'
      const badVariant: AlertProps = { variant: 'ghost' };
      // @ts-expect-error 语义槽位没有 footer
      const badSlot: AlertSemanticClassNames = { footer: 'x' };
      // @ts-expect-error closable 的具名字段不接受 unknown 形态的 onClose（数字）
      const badClosable: AlertClosable = { onClose: 1 };
      return [badType, badVariant, badSlot, badClosable];
    };
    void _never;
  });
});
