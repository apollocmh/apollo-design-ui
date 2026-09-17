import { describe, expect, it } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';
import type { UseActiveDescendantReturn } from '../index';
import { useActiveDescendant } from '../index';

describe('useActiveDescendant', () => {
  it('三个 id 的关系与 rc-select 一致', () => {
    const api = useActiveDescendant({ id: 'my', activeIndex: 2 });
    expect(api.baseId).toBe('my');
    expect(api.listboxId).toBe('my_list');
    expect(api.getOptionId(0)).toBe('my_list_0');
    expect(api.getOptionId(2)).toBe('my_list_2');
    expect(api.activeDescendantId.value).toBe('my_list_2');
  });

  it('⭐ 显式 id 优先于自动生成', () => {
    const explicit = useActiveDescendant({ id: 'explicit' });
    expect(explicit.baseId).toBe('explicit');
  });

  it('不传 id 时自动生成非空且稳定', () => {
    const api = useActiveDescendant();
    expect(api.baseId.length).toBeGreaterThan(0);
    expect(api.listboxId).toBe(`${api.baseId}_list`);
    // 同一个实例上重复读同一个字段必须一致
    expect(api.getOptionId(3)).toBe(api.getOptionId(3));
  });

  it('⭐ 没有活动项（undefined / -1）时 activeDescendantId 是 undefined', () => {
    expect(useActiveDescendant({ id: 'a' }).activeDescendantId.value).toBeUndefined();
    expect(
      useActiveDescendant({ id: 'a', activeIndex: -1 }).activeDescendantId.value,
    ).toBeUndefined();
  });

  it('activeIndex 是响应式的', async () => {
    const index = ref<number | undefined>(undefined);
    const scope = effectScope();
    // effectScope.run 的返回类型带 | undefined；回调一定返回值，这里收窄一次
    const api = scope.run(() =>
      useActiveDescendant({ id: 'r', activeIndex: index }),
    ) as UseActiveDescendantReturn;

    expect(api.activeDescendantId.value).toBeUndefined();
    index.value = 1;
    await nextTick();
    expect(api.activeDescendantId.value).toBe('r_list_1');
    index.value = undefined;
    await nextTick();
    expect(api.activeDescendantId.value).toBeUndefined();
    scope.stop();
  });

  it('activeIndex 传 0 时是有效的活动项（不能被当成 falsy 漏掉）', () => {
    expect(useActiveDescendant({ id: 'z', activeIndex: 0 }).activeDescendantId.value).toBe(
      'z_list_0',
    );
  });
});
