/**
 * L3 类型（G7）—— 正例 + 负例（负例包在**永不调用**的闭包里，CHECKLIST §一）。
 *
 * 重点钉三件事：
 *   1. 上游的 `Omit` 链（`BaseTextareaAttrs` 的 5 个键 + rc 层的 `styles`）真的生效；
 *   2. `prefix` 从 `VNodeChild` 换成 `string | string[]`（mentions 自有语义）；
 *   3. `onChange` 收**字符串**（不是事件）—— 这是 mentions 与 TextArea 最大的语义差。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { MentionsOptionProps, MentionsProps, MentionsRef } from '../interface';

describe('Mentions · 类型', () => {
  it('prefix 是 `string | string[]`（不是 VNodeChild —— 上游 Omit 后重声明）', () => {
    expectTypeOf<MentionsProps['prefix']>().toEqualTypeOf<string | string[] | undefined>();
  });

  it('onChange 收字符串（不是事件）—— 与 TextArea 的 `(e: unknown) => void` 不同', () => {
    expectTypeOf<MentionsProps['onChange']>().toEqualTypeOf<
      ((value: string) => void) | undefined
    >();
  });

  it('onSelect / onSearch 的载荷', () => {
    expectTypeOf<MentionsProps['onSelect']>().toEqualTypeOf<
      ((option: MentionsOptionProps, prefix: string) => void) | undefined
    >();
    expectTypeOf<MentionsProps['onSearch']>().toEqualTypeOf<
      ((text: string, prefix: string) => void) | undefined
    >();
  });

  it('filterOption 可以是 `false`（全保留）', () => {
    expectTypeOf<MentionsProps['filterOption']>().toEqualTypeOf<
      false | ((input: string, option: MentionsOptionProps) => boolean) | undefined
    >();
  });

  it('placement 是 `top | bottom`；variant 是四值联合', () => {
    expectTypeOf<MentionsProps['placement']>().toEqualTypeOf<'top' | 'bottom' | undefined>();
    expectTypeOf<MentionsProps['variant']>().toEqualTypeOf<
      'outlined' | 'borderless' | 'filled' | 'underlined' | undefined
    >();
  });

  it('styles 是 mentions 自己的 4 键（不是 TextArea 的语义键）', () => {
    const styles: MentionsProps['styles'] = {
      root: { width: '100px' },
      textarea: { resize: 'vertical' },
      popup: { zIndex: 1 },
      suffix: { color: 'red' },
    };
    expectTypeOf(styles).not.toBeNever();
  });

  it('MentionsRef：focus / blur / textarea / nativeElement', () => {
    expectTypeOf<MentionsRef['focus']>().toEqualTypeOf<() => void>();
    expectTypeOf<MentionsRef['blur']>().toEqualTypeOf<() => void>();
    expectTypeOf<MentionsRef['textarea']>().toEqualTypeOf<HTMLTextAreaElement | null>();
    expectTypeOf<MentionsRef['nativeElement']>().toEqualTypeOf<HTMLElement | null>();
  });

  it('正例（受控 + 候选 + 浮层配置）', () => {
    const sample: MentionsProps = {
      value: '@a',
      prefix: ['@', '#'],
      split: ' ',
      options: [{ value: 'afc163', label: 'afc163' }],
      filterOption: (input, option) => option.value.includes(input),
      placement: 'top',
      onChange: (value) => void value,
      onSelect: (option, prefix) => void [option, prefix],
    };
    expectTypeOf(sample).not.toBeNever();
  });

  it('负例（永不调用的闭包）', () => {
    const negative = () => {
      const props: MentionsProps = {
        // @ts-expect-error `prefix` 不是 VNodeChild（那是 TextArea 的语义，已被 Omit）
        prefix: { render: () => null },
        // @ts-expect-error `onChange` 收字符串 —— 传 `(n: number) => void` 会因**逆变**失败
        onChange: (n: number) => void n,
        // @ts-expect-error `placement` 只有 top / bottom
        placement: 'left',
      };
      return props;
    };
    void negative;
  });
});
