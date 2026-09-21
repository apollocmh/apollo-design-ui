/**
 * L3 · 类型测试（含负例）。⚠️ 负例包在永不调用的闭包里。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type {
  ResultProps,
  ResultSemanticClassNames,
  ResultSemanticStyles,
  ResultStatusType,
} from '../interface';

describe('Result · Props 类型', () => {
  it('status 是九值联合', () => {
    expectTypeOf<ResultStatusType>().toEqualTypeOf<
      403 | 404 | 500 | '403' | '404' | '500' | 'success' | 'error' | 'info' | 'warning'
    >();
  });

  it('语义槽位六槽齐备', () => {
    expectTypeOf<keyof ResultSemanticClassNames>().toEqualTypeOf<
      'root' | 'title' | 'subTitle' | 'body' | 'extra' | 'icon'
    >();
    expectTypeOf<keyof ResultSemanticStyles>().toEqualTypeOf<
      'root' | 'title' | 'subTitle' | 'body' | 'extra' | 'icon'
    >();
  });

  it('★ 负例（永不调用的闭包内）', () => {
    const _never = () => {
      // @ts-expect-error status 不接受任意字符串
      const badStatus: ResultProps = { status: 'ok' };
      // @ts-expect-error 语义槽位没有 footer
      const badSlot: ResultSemanticClassNames = { footer: 'x' };
      return [badStatus, badSlot];
    };
    void _never;
  });
});
