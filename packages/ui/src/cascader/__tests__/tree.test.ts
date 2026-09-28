/**
 * S1 · 树算法单测（cascader/engine/tree.ts）
 *
 * 对账方式：同样的 options 与 key 输入，期望与 `@rc-component/tree` 的
 * `convertDataToEntities` / `conductCheck` 一致。断言值由 rc 的语义推导
 * （同源实现，非手抄期望值），关键分支逐条注释。
 */

import { describe, expect, it } from 'vitest';
import { conductCheck, convertDataToEntities } from '../engine/tree';

const VALUE_SPLIT = '__RC_CASCADER_SPLIT__';

interface CascaderOption {
  value: string;
  label?: string;
  disabled?: boolean;
  children?: CascaderOption[];
}

const OPTIONS: CascaderOption[] = [
  {
    value: 'zj',
    children: [{ value: 'hz', children: [{ value: 'xh' }, { value: 'gs' }] }, { value: 'nb' }],
  },
  {
    value: 'js',
    children: [{ value: 'nj' }, { value: 'sz' }],
  },
];

/** 与 rc-cascader `useEntities` 同构：key 覆写成 pathKey。 */
function buildPathKeyEntities(options: CascaderOption[]) {
  return convertDataToEntities(options as unknown as Record<string, unknown>[], {
    fieldNames: { key: 'value', children: 'children' },
    initWrapper: (wrapper) => ({ ...wrapper, pathKeyEntities: {} }),
    processEntity: (entity, wrapper) => {
      const pathKey = entity.nodes.map((node) => node.value as string).join(VALUE_SPLIT);
      (wrapper.pathKeyEntities as Record<string, unknown>)[pathKey] = entity;
      // 覆写 key，让 conduct 逻辑以路径为键（上游注释：this is very hack but …）
      entity.key = pathKey;
    },
  }).pathKeyEntities as Record<string, { key: string; level: number; nodes: unknown[] }>;
}

describe('convertDataToEntities', () => {
  it('摊平出 pos / key / level / parent 链', () => {
    const { posEntities, keyEntities } = convertDataToEntities(
      OPTIONS as unknown as Record<string, unknown>[],
      { fieldNames: { key: 'value', children: 'children' } },
    );

    expect(Object.keys(posEntities).sort()).toEqual([
      '0-0',
      '0-0-0',
      '0-0-0-0',
      '0-0-0-1',
      '0-0-1',
      '0-1',
      '0-1-0',
      '0-1-1',
    ]);
    expect(keyEntities.zj.level).toBe(0);
    expect(keyEntities.nb.level).toBe(1);
    expect(keyEntities.xh.level).toBe(2);
    // parent 链
    expect(keyEntities.xh.parent?.key).toBe('hz');
    expect(keyEntities.hz.parent?.key).toBe('zj');
    expect(keyEntities.zj.parent).toBeUndefined();
    // children 链
    expect(keyEntities.zj.children?.map((c) => c.key)).toEqual(['hz', 'nb']);
  });

  it('nodes 是从根到当前的路径链（Cascader 靠它拼 pathKey）', () => {
    const { keyEntities } = convertDataToEntities(OPTIONS as unknown as Record<string, unknown>[], {
      fieldNames: { key: 'value', children: 'children' },
    });
    expect(keyEntities.xh.nodes.map((n) => n.value)).toEqual(['zj', 'hz', 'xh']);
  });

  it('pathKeyEntities：key 被覆写成 value 链（useEntities 同构）', () => {
    const entities = buildPathKeyEntities(OPTIONS);
    expect(Object.keys(entities).sort()).toEqual([
      'js',
      `js${VALUE_SPLIT}nj`,
      `js${VALUE_SPLIT}sz`,
      'zj',
      `zj${VALUE_SPLIT}hz`,
      `zj${VALUE_SPLIT}hz${VALUE_SPLIT}gs`,
      `zj${VALUE_SPLIT}hz${VALUE_SPLIT}xh`,
      `zj${VALUE_SPLIT}nb`,
    ]);
    expect(entities[`zj${VALUE_SPLIT}hz${VALUE_SPLIT}xh`].level).toBe(2);
  });
});

describe('conductCheck', () => {
  const pathEntities = () =>
    buildPathKeyEntities(OPTIONS) as unknown as Record<
      string,
      Parameters<typeof conductCheck>[2][string]
    >;

  it('fill：选中父 ⇒ 向下补全所有子', () => {
    const { checkedKeys, halfCheckedKeys } = conductCheck(['zj'], true, pathEntities());
    expect(checkedKeys.sort()).toEqual(
      [
        'zj',
        `zj${VALUE_SPLIT}hz`,
        `zj${VALUE_SPLIT}hz${VALUE_SPLIT}gs`,
        `zj${VALUE_SPLIT}hz${VALUE_SPLIT}xh`,
        `zj${VALUE_SPLIT}nb`,
      ].sort(),
    );
    expect(halfCheckedKeys).toEqual([]);
  });

  it('fill：某父的全部子被选 ⇒ 补该父；父的兄弟未选 ⇒ 祖先只记 half', () => {
    // hz 的两个子全选 ⇒ hz 被补上；但 zj 的另一个子 nb 没选 ⇒ zj 不能进 checked
    const { checkedKeys, halfCheckedKeys } = conductCheck(
      [`zj${VALUE_SPLIT}hz${VALUE_SPLIT}xh`, `zj${VALUE_SPLIT}hz${VALUE_SPLIT}gs`],
      true,
      pathEntities(),
    );
    expect(checkedKeys).toContain(`zj${VALUE_SPLIT}hz`);
    expect(checkedKeys).not.toContain('zj');
    expect(halfCheckedKeys).toContain('zj');
  });

  it('fill：部分选中 ⇒ 父进 halfChecked（且不进 checked）', () => {
    const { checkedKeys, halfCheckedKeys } = conductCheck(
      [`zj${VALUE_SPLIT}hz${VALUE_SPLIT}xh`],
      true,
      pathEntities(),
    );
    expect(checkedKeys).not.toContain(`zj${VALUE_SPLIT}hz`);
    expect(halfCheckedKeys).toContain(`zj${VALUE_SPLIT}hz`);
    expect(halfCheckedKeys).toContain('zj');
  });

  it('clean：取消一个子 ⇒ 父不再是 checked，但记 half', () => {
    const entities = pathEntities();
    const filled = conductCheck([`zj${VALUE_SPLIT}hz`], true, entities);
    const nextKeys = filled.checkedKeys.filter(
      (key) => key !== `zj${VALUE_SPLIT}hz${VALUE_SPLIT}xh`,
    );
    const cleaned = conductCheck(
      nextKeys,
      { checked: false, halfCheckedKeys: filled.halfCheckedKeys },
      entities,
    );
    expect(cleaned.checkedKeys).not.toContain(`zj${VALUE_SPLIT}hz`);
    expect(cleaned.halfCheckedKeys).toContain(`zj${VALUE_SPLIT}hz`);
  });

  it('disabled 节点不参与传导（既不补子也不当父的判定依据）', () => {
    const withDisabled: CascaderOption[] = [
      {
        value: 'p',
        children: [{ value: 'c1' }, { value: 'c2', disabled: true }],
      },
    ];
    const entities = buildPathKeyEntities(withDisabled) as unknown as Record<
      string,
      Parameters<typeof conductCheck>[2][string]
    >;
    const { checkedKeys } = conductCheck(['p'], true, entities);
    // c2 是 disabled ⇒ 不被补全
    expect(checkedKeys).toContain(`p${VALUE_SPLIT}c1`);
    expect(checkedKeys).not.toContain(`p${VALUE_SPLIT}c2`);
  });

  it('缺失的 key 被静默过滤（上游只是 warning）', () => {
    const { checkedKeys } = conductCheck(['not-exist'], true, pathEntities());
    expect(checkedKeys).toEqual([]);
  });
});
