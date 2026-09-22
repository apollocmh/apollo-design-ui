/**
 * L3 · 类型测试（含负例）。⚠️ 负例包在永不调用的闭包里。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type {
  CheckableTagProps,
  TagColor,
  TagProps,
  TagSemanticClassNames,
  TagVariant,
} from '../interface';

describe('Tag · Props 类型', () => {
  it('variant 三值联合；语义槽位四槽', () => {
    expectTypeOf<TagVariant>().toEqualTypeOf<'filled' | 'solid' | 'outlined'>();
    expectTypeOf<keyof TagSemanticClassNames>().toEqualTypeOf<
      'root' | 'icon' | 'content' | 'close'
    >();
  });

  it('color 是预设键与任意串的联合', () => {
    const c: TagColor = 'success';
    const c2: TagColor = '#2db7f5';
    void c;
    void c2;
    expectTypeOf<TagProps['variant']>().toEqualTypeOf<TagVariant | undefined>();
  });

  it('★ 负例（永不调用的闭包内）', () => {
    const _never = () => {
      // @ts-expect-error variant 不接受任意字符串
      const badVariant: TagProps = { variant: 'dashed' };
      // @ts-expect-error checked 不在 TagProps（CheckableTag 专有）
      const badChecked: TagProps = { checked: true };
      return [badVariant, badChecked];
    };
    void _never;
  });

  it('CheckableTag onChange 布尔', () => {
    expectTypeOf<CheckableTagProps['onChange']>().toEqualTypeOf<
      ((checked: boolean) => void) | undefined
    >();
  });
});
