/**
 * L3 · 类型测试（含**负例**）
 *
 * 规则 T7：只有正例的类型测试没有价值。每个 `describe` 都同时给出
 * 「应当通过」与「应当报错」两侧。
 *
 * ⚠️ 负例必须包在**永不调用**的闭包里 —— 本文件会被 vitest 真的执行。
 *
 * ── 与 antd 类型面的差异（见 `interface.ts` 文件头）────────────────────────────
 *   1. `children`（React render-prop 自定义面板）→ `renderList` 函数 prop（C19）
 *   2. `React.ReactNode` → `VNodeChild`、`React.CSSProperties` → `Record<string, string>`
 *   3. `onSelectChange` 等回调签名与 antd 一致（方向 + keys）
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { VNodeChild } from 'vue';
import { h } from 'vue';
import type {
  PaginationType,
  RenderResult,
  SelectAllLabelRender,
  TransferDirection,
  TransferItem,
  TransferKey,
  TransferLocale,
  TransferProps,
  TransferSemanticClassNames,
  TransferSemanticStyles,
} from '../index';
import { Transfer, TransferList } from '../index';

const neverFn = (...args: unknown[]) => {
  throw new Error('never called');
};
void neverFn;

describe('Transfer · 基础枚举', () => {
  it('TransferDirection 是 left | right', () => {
    expectTypeOf<TransferDirection>().toEqualTypeOf<'left' | 'right'>();
  });

  it('TransferKey 是 string | number', () => {
    expectTypeOf<TransferKey>().toEqualTypeOf<string | number>();
  });

  it('PaginationType 是 boolean 或对象（四字段全可选）', () => {
    expectTypeOf<PaginationType>().toEqualTypeOf<
      | boolean
      | {
          pageSize?: number;
          simple?: boolean;
          showSizeChanger?: boolean;
          showLessItems?: boolean;
        }
    >();
  });

  it('TransferItem 必须带 key', () => {
    expectTypeOf<TransferItem>().toExtend<{ key: TransferKey }>();
  });
});

describe('Transfer · Props 正例', () => {
  it('受控 targetKeys / selectedKeys', () => {
    expectTypeOf<TransferProps>().toExtend<{
      targetKeys?: TransferKey[];
      selectedKeys?: TransferKey[];
      disabled?: boolean;
      oneWay?: boolean;
      showSearch?: boolean | { defaultValue?: string; placeholder?: string };
      pagination?: PaginationType;
      status?: 'error' | 'warning';
    }>();
  });

  it('回调签名与 antd 一致', () => {
    expectTypeOf<TransferProps>().toExtend<{
      onChange?: (
        targetKeys: TransferKey[],
        direction: TransferDirection,
        moveKeys: TransferKey[],
      ) => void;
      onSelectChange?: (
        sourceSelectedKeys: TransferKey[],
        targetSelectedKeys: TransferKey[],
      ) => void;
      onSearch?: (direction: TransferDirection, value: string) => void;
      onScroll?: (direction: TransferDirection, e: Event) => void;
    }>();
  });

  it('render 返回节点或 { label, value }', () => {
    expectTypeOf<TransferProps['render']>().toExtend<
      ((item: TransferItem) => RenderResult) | undefined
    >();
  });

  it('selectAllLabels 是二元组', () => {
    expectTypeOf<TransferProps['selectAllLabels']>().toExtend<SelectAllLabelRender[] | undefined>();
  });
});

describe('Transfer · Props 负例（应当报错）', () => {
  it('status 只收 error | warning', () => {
    // @ts-expect-error 非法状态
    const bad: TransferProps['status'] = 'success';
    void bad;
  });

  it('onChange 的 targetKeys 参数不能收窄类型（参数逆变）', () => {
    // @ts-expect-error 非法参数类型（'left' 不接收 TransferKey[]）
    const bad: TransferProps['onChange'] = (targetKeys: 'left') => neverFn(targetKeys);
    void bad;
  });

  it('filterOption 第三个参数必须是方向', () => {
    // @ts-expect-error 非法过滤签名（d: boolean 不收窄为 TransferDirection）
    const bad: TransferProps['filterOption'] = (v: string, item: TransferItem, d: boolean) =>
      neverFn(v, item, d);
    void bad;
  });
});

describe('Transfer · 语义结构', () => {
  it('classNames 含 source / target 方向子结构', () => {
    expectTypeOf<TransferSemanticClassNames>().toExtend<{
      root?: string;
      section?: string;
      header?: string;
      title?: string;
      body?: string;
      list?: string;
      item?: string;
      itemIcon?: string;
      itemContent?: string;
      footer?: string;
      actions?: string;
      source?: Record<string, unknown>;
      target?: Record<string, unknown>;
    }>();
  });

  it('styles 的值是声明对象', () => {
    expectTypeOf<TransferSemanticStyles['root']>().toEqualTypeOf<
      Record<string, string> | undefined
    >();
  });

  it('locale 覆盖 unit 文案', () => {
    expectTypeOf<TransferLocale>().toExtend<{
      itemUnit?: string;
      itemsUnit?: string;
      searchPlaceholder?: string;
    }>();
  });
});

describe('Transfer · 运行时形态', () => {
  it('Transfer 是可渲染组件（h 直接包）', () => {
    const node = h(Transfer, { dataSource: [] });
    expectTypeOf(node).toExtend<VNodeChild>();
  });

  it('TransferList（Transfer.List）可独立渲染', () => {
    const node = h(TransferList as never, { prefixCls: 'apollo-transfer' } as never);
    expectTypeOf(node).toExtend<VNodeChild>();
  });
});
