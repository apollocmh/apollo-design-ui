/**
 * L3 · 类型测试（含负例）。⚠️ 负例包在永不调用的闭包里。
 */

import { describe, expectTypeOf, it } from 'vitest';
import { h } from 'vue';
import type { Result } from '../index';
import type {
  ResultConfig,
  ResultProps,
  ResultSemanticClassNames,
  ResultSemanticStyles,
  ResultSemanticValue,
  ResultSlots,
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

describe('Result native public contracts', () => {
  it('types semantic factories against current props at both public configuration levels', () => {
    const classNames: ResultSemanticValue<ResultSemanticClassNames> = ({ props }) => ({
      root: `state-${props.status}`,
    });
    const styles: ResultProps['styles'] = ({ props }) => ({
      title: { opacity: props.status === 'success' ? 0.8 : 1 },
    });
    const props: ResultProps = { classNames, styles };
    const config: ResultConfig = { classNames, styles };
    expectTypeOf(props).toMatchTypeOf<ResultProps>();
    expectTypeOf(config).toMatchTypeOf<ResultConfig>();
  });
  it('types all five complete native slots and the actual nullable exposed root', () => {
    const slots: ResultSlots = {
      icon: () => [h('input'), h('span', 'Tail')],
      title: () => 0,
      subTitle: () => null,
      extra: () => h('button', 'Go'),
      default: () => [h('label', 'Draft'), h('input')],
    };
    expectTypeOf(slots).toMatchTypeOf<ResultSlots>();
    expectTypeOf<
      InstanceType<typeof Result>['nativeElement']
    >().toEqualTypeOf<HTMLDivElement | null>();
  });
  it('rejects removed or wrong content props without adding a compatibility channel', () => {
    const never = () => {
      // @ts-expect-error Extra content belongs to the existing native #extra slot.
      const extra: ResultProps = { extra: () => h('button') };
      // @ts-expect-error The switch accepts boolean/null; rich icons belong to #icon.
      const icon: ResultProps = { icon: h('span') };
      // @ts-expect-error Title props are text; rich content belongs to #title.
      const title: ResultProps = { title: () => 'T' };
      return [extra, icon, title];
    };
    void never;
  });
});
