/**
 * S2 · utils 单测 —— `@rc-component/cascader` 的 commonUtil / treeUtil 对账。
 * 断言值由 rc 的语义推导（同源实现），关键分支逐条注释。
 */

import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { computeSearchOptions } from '../hooks/search';
import { computeDisplayValues, createSelectHandler, useOptions, useValues } from '../hooks/values';
import {
  type BaseOptionType,
  fillFieldNames,
  formatStrategyValues,
  isLeaf,
  SHOW_CHILD,
  SHOW_PARENT,
  toPathKey,
  toPathOptions,
  toPathValueStr,
  toRawValues,
} from '../utils';

const FIELD = fillFieldNames();

const OPTIONS: BaseOptionType[] = [
  {
    value: 'zj',
    label: '浙江',
    children: [
      {
        value: 'hz',
        label: '杭州',
        children: [
          { value: 'xh', label: '西湖' },
          { value: 'gs', label: '拱墅' },
        ],
      },
      { value: 'nb', label: '宁波' },
    ],
  },
  { value: 'js', label: '江苏', children: [{ value: 'nj', label: '南京' }] },
];

describe('utils · 值与路径', () => {
  it('toPathKey / toPathValueStr 互逆', () => {
    expect(toPathKey(['zj', 'hz'])).toBe('zj__RC_CASCADER_SPLIT__hz');
    expect(toPathValueStr('zj__RC_CASCADER_SPLIT__hz')).toEqual(['zj', 'hz']);
  });

  it('toRawValues：一维包一层 / 二维原样 / 空兜底', () => {
    expect(toRawValues('a')).toEqual([['a']]);
    expect(toRawValues(['a', 'b'])).toEqual([['a', 'b']]);
    expect(toRawValues([['a', 'b'], ['c']])).toEqual([['a', 'b'], ['c']]);
    expect(toRawValues(undefined)).toEqual([]);
    expect(toRawValues([])).toEqual([]);
  });

  it('fillFieldNames：key 与 value 同字段（rc 判据）', () => {
    expect(fillFieldNames()).toEqual({
      label: 'label',
      value: 'value',
      key: 'value',
      children: 'children',
    });
    expect(fillFieldNames({ value: 'id', label: 'name' })).toEqual({
      label: 'name',
      value: 'id',
      key: 'id',
      children: 'children',
    });
  });

  it('isLeaf：显式 isLeaf 优先', () => {
    expect(isLeaf({ value: 'a' }, FIELD)).toBe(true);
    expect(isLeaf({ value: 'a', children: [{ value: 'b' }] } as BaseOptionType, FIELD)).toBe(false);
    expect(
      isLeaf({ value: 'a', isLeaf: true, children: [{ value: 'b' }] } as BaseOptionType, FIELD),
    ).toBe(true);
  });

  it('toPathOptions：逐层下钻，找不到的层 option 为 null', () => {
    const path = toPathOptions(['zj', 'hz', 'xh'], OPTIONS, FIELD);
    expect(path.map((p) => p.option?.label)).toEqual(['浙江', '杭州', '西湖']);
    const missing = toPathOptions(['zj', 'nope'], OPTIONS, FIELD);
    expect(missing[1]?.option).toBeNull();
  });
});

describe('formatStrategyValues（多选回填去重）', () => {
  const { getPathKeyEntities } = useOptions(ref(FIELD), ref(OPTIONS));

  it('SHOW_PARENT：父被选时子丢弃', () => {
    const result = formatStrategyValues(
      ['zj', 'zj__RC_CASCADER_SPLIT__hz'],
      getPathKeyEntities,
      SHOW_PARENT,
    );
    expect(result).toEqual(['zj']);
  });

  it('SHOW_CHILD：有子被选的父不保留', () => {
    const result = formatStrategyValues(
      ['zj', 'zj__RC_CASCADER_SPLIT__hz'],
      getPathKeyEntities,
      SHOW_CHILD,
    );
    expect(result).toEqual(['zj__RC_CASCADER_SPLIT__hz']);
  });
});

describe('search（computeSearchOptions）', () => {
  it('只对叶子做过滤；结果挂 SEARCH_MARK 并用 render 产 label', () => {
    const result = computeSearchOptions('西', OPTIONS, FIELD, 'apollo-cascader', {}, false);
    expect(result).toHaveLength(1);
    expect(result[0]?.label).toBe('浙江 / 杭州 / 西湖');
    expect(result[0]?.__rc_cascader_search_mark__).toHaveLength(3);
  });

  it('enableHalfPath（changeOnSelect / 多选）时中间层也过滤', () => {
    const result = computeSearchOptions('杭州', OPTIONS, FIELD, 'apollo-cascader', {}, true);
    // 路径包含「杭州」的三条：hz 中间层、xh / gs 两条叶子（filter 对路径 some 匹配）
    expect(result).toHaveLength(3);
    expect(result.some((opt) => opt.value === 'hz')).toBe(true);
  });

  it('limit 生效；limit<=0 视为不限', () => {
    const limited = computeSearchOptions(
      '州',
      OPTIONS,
      FIELD,
      'apollo-cascader',
      { limit: 1 },
      true,
    );
    expect(limited).toHaveLength(1);
    const all = computeSearchOptions(
      '州',
      OPTIONS,
      FIELD,
      'apollo-cascader',
      { limit: false },
      true,
    );
    expect(all.length).toBeGreaterThan(1);
  });

  it('自定义 filter / sort', () => {
    const result = computeSearchOptions(
      'z',
      OPTIONS,
      FIELD,
      'apollo-cascader',
      {
        filter: (search, pathOptions) =>
          pathOptions.some((opt) => String(opt.value).toLowerCase().includes(search)),
        sort: (a) => (a[a.length - 1]?.value === 'hz' ? -1 : 1),
      },
      true,
    );
    expect(result[0]?.value).toBe('hz');
  });
});

describe('displayValues（computeDisplayValues）', () => {
  it('单选：全路径 ` / ` 连接', () => {
    const result = computeDisplayValues([['zj', 'hz', 'xh']], OPTIONS, FIELD, false);
    expect(result[0]?.label).toBe('浙江 / 杭州 / 西湖');
    expect(result[0]?.value).toBe('zj__RC_CASCADER_SPLIT__hz__RC_CASCADER_SPLIT__xh');
  });

  it('多选：只取最后一段', () => {
    const result = computeDisplayValues([['zj', 'hz']], OPTIONS, FIELD, true);
    expect(result[0]?.label).toBe('杭州');
  });

  it('缺失值回退 value 本身', () => {
    const result = computeDisplayValues([['ghost', 'x']], OPTIONS, FIELD, false);
    expect(result[0]?.label).toBe('ghost / x');
  });

  it('disabled 取路径最后一层的 option', () => {
    const withDisabled: BaseOptionType[] = [
      { value: 'p', children: [{ value: 'c', disabled: true }] },
    ];
    const result = computeDisplayValues([['p', 'c']], withDisabled, FIELD, false);
    expect(result[0]?.disabled).toBe(true);
  });
});

describe('select（createSelectHandler）', () => {
  const { getPathKeyEntities, getValueByKeyPath } = useOptions(ref(FIELD), ref(OPTIONS));
  const { checkedValues, halfCheckedValues, missingCheckedValues } = useValues(
    true,
    ref([['zj', 'hz', 'xh']]),
    getPathKeyEntities,
    getValueByKeyPath,
    (rawValues) => {
      const exists = rawValues.filter((v) => v[0] === 'zj');
      return [exists, rawValues.filter((v) => v[0] !== 'zj')];
    },
  );

  it('多选勾选父 ⇒ SHOW_PARENT 向上收', () => {
    const changed: (string | number)[][] = [];
    const handler = createSelectHandler(
      true,
      (next) => changed.push(...next),
      checkedValues,
      halfCheckedValues,
      missingCheckedValues,
      getPathKeyEntities,
      getValueByKeyPath,
      SHOW_PARENT,
    );
    handler(['zj', 'hz']);
    // 勾选 hz ⇒ xh 保持 + hz 加入（gs 未选，hz 不被去掉；zj 因 nb 未选不收敛）
    expect(changed).toContainEqual(['zj', 'hz']);
  });

  it('单选直接透传', () => {
    const changed: (string | number)[][] = [];
    const handler = createSelectHandler(
      false,
      (next) => changed.push(...next),
      [],
      [],
      [],
      getPathKeyEntities,
      getValueByKeyPath,
      SHOW_PARENT,
    );
    handler(['zj', 'nb']);
    // 单选 triggerChange 收到一维路径；测试收集器 push 展开后是两个元素
    expect(changed).toEqual(['zj', 'nb']);
  });
});
