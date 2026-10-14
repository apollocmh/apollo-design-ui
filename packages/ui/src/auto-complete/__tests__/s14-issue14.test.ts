/**
 * Issue #14 —— auto-complete 三件回归（先复现失败路径，修复后转正）。
 *
 * 1. **[P1] VNode dataSource**：`mergedOptions` 对 VNode 数据源返回 `[]` ⇒
 *    `options=[]` 显式传给 Select ⇒ `childrenAsData = ![] = false` ⇒ 默认插槽
 *    里的 VNode 选项整条丢弃（修复前实测：popup 都不渲染，0 选项）。
 *    同时覆盖 antd `optionChildren` 分支的另两面：混合 dataSource 两类都在；
 *    Option children 与 dataSource 同传时 children 胜（修复前实测：0 选项）。
 * 2. **[P2] size 类型缺 medium**：静态差异，类型断言在 type.test-d.ts；这里
 *    验证运行时接受 `medium` 且不加 `-lg`/`-sm`（默认档）。
 * 3. **[P2] 动态 slot 分类过期**：`optionInfo` 是 computed 读 `slots.default()`；
 *    修复前实测：自定义输入结构切回 Option 列表后候选**不恢复**（Select 侧
 *    `parsed` computed 上次求值没 track 任何依赖 ⇒ 缓存干净 ⇒ 永远停在上个周期）。
 *    修复 = 默认插槽始终下传 + 包装函数显式读分类态（见 AutoComplete.ts 文件头 #6）。
 */
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { SelectOption } from '../../select';
import AutoCompleteComponent from '../AutoComplete';

const P = 'apollo-select';

const mountAC = (
  props: Record<string, unknown> = {},
  slots: Record<string, (...args: never[]) => unknown> = {},
) =>
  mount(AutoCompleteComponent, {
    props: props as never,
    slots,
    attachTo: document.body,
    global: { stubs: { teleport: false } },
  });

/** 打开浮层并等一拍（jsdom 下受控 open 是稳定通道）。 */
const openAndWait = async () => {
  await new Promise((r) => setTimeout(r, 30));
};

describe('#14.1 VNode dataSource', () => {
  it('仅 VNode dataSource ⇒ 下拉列出全部 VNode 选项', async () => {
    const w = mountAC({
      dataSource: [
        h(SelectOption, { value: 'vnode-a' }, { default: () => 'VNode A' }),
        h(SelectOption, { value: 'vnode-b' }, { default: () => 'VNode B' }),
      ],
      open: true,
    });
    await openAndWait();
    const items = document.body.querySelectorAll(`.${P}-item-option`);
    expect(items.length).toBe(2);
    expect(items[0]?.textContent).toContain('VNode A');
    w.unmount();
  });

  it('VNode + 结构化混合 dataSource ⇒ 两类都在（antd optionChildren 语义）', async () => {
    const w = mountAC({
      dataSource: [
        'plain-string',
        { value: 'obj-item', text: 'Obj Item' },
        h(SelectOption, { value: 'vnode-a' }, { default: () => 'VNode A' }),
      ],
      open: true,
    });
    await openAndWait();
    const items = document.body.querySelectorAll(`.${P}-item-option`);
    expect(items.length).toBe(3);
    w.unmount();
  });

  it('Option children 与 dataSource 同传 ⇒ children 胜（antd：dataSource 整条忽略）', async () => {
    const w = mountAC(
      {
        dataSource: [h(SelectOption, { value: 'ds-a' }, { default: () => 'DS A' })],
        open: true,
      },
      {
        default: () => [
          h(SelectOption, { value: 'child-a' }, { default: () => 'Child A' }),
          h(SelectOption, { value: 'child-b' }, { default: () => 'Child B' }),
        ],
      },
    );
    await openAndWait();
    const items = document.body.querySelectorAll(`.${P}-item-option`);
    expect(items.length).toBe(2);
    expect(items[0]?.textContent).toContain('Child A');
    w.unmount();
  });

  it('选择 VNode dataSource 候选 ⇒ update:value + onChange 双发', async () => {
    const onChange = vi.fn();
    const w = mountAC({
      dataSource: [h(SelectOption, { value: 'vnode-a' }, { default: () => 'VNode A' })],
      onChange,
      open: true,
    });
    await openAndWait();
    const item = document.body.querySelector(`.${P}-item-option`);
    expect(item).not.toBeNull();
    (item as HTMLElement).click();
    await nextTick();
    await nextTick();
    expect(w.emitted('update:value')).toEqual([['vnode-a']]);
    expect(onChange).toHaveBeenCalled();
    w.unmount();
  });
});

describe('#14.2 size 类型', () => {
  it('medium 是合法 size（运行时类名与 TS 类型一致）', () => {
    // TS 正例在 type.test-d.ts（共享 SizeType）；这里验证运行时接受 medium
    const w = mountAC({ options: [{ value: 'a' }], size: 'medium' });
    expect(w.find(`.${P}-auto-complete`).exists()).toBe(true);
    // medium/middle 都不加 -lg/-sm（默认尺寸）
    const root = w.find(`.${P}-auto-complete`);
    expect(root.classes()).not.toContain(`${P}-lg`);
    expect(root.classes()).not.toContain(`${P}-sm`);
    w.unmount();
  });
});

describe('#14.3 动态 slot 分类', () => {
  const Host = defineComponent({
    components: { AutoComplete: AutoCompleteComponent, SelectOption },
    setup() {
      const useCustom = ref(false);
      return { useCustom };
    },
    template: `
      <AutoComplete defaultOpen>
        <input v-if="useCustom" class="custom-input-el" />
        <SelectOption v-else value="opt-a">Option A</SelectOption>
      </AutoComplete>
    `,
  });

  it('条件 slot 在 Option 列表 / 自定义输入结构间切换 ⇒ 分类同步', async () => {
    const w = mount(Host, { attachTo: document.body, global: { stubs: { teleport: false } } });
    await openAndWait();
    let items = document.body.querySelectorAll(`.${P}-item-option`);
    expect(items.length).toBe(1);
    expect(items[0]?.textContent).toContain('Option A');

    // 切到自定义输入结构 ⇒ 选项列表应消失（v1 缺口：usage 告警 + 丢弃）
    w.vm.useCustom = true;
    await nextTick();
    await nextTick();
    items = document.body.querySelectorAll(`.${P}-item-option`);
    expect(items.length).toBe(0);

    // 切回 Option 列表 ⇒ 选项应恢复（分类不能停在旧态）
    w.vm.useCustom = false;
    await nextTick();
    await nextTick();
    items = document.body.querySelectorAll(`.${P}-item-option`);
    expect(items.length).toBe(1);
    expect(items[0]?.textContent).toContain('Option A');
    w.unmount();
  });
});
