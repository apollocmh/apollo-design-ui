/**
 * Tour · L1/L2 单元与交互测试（G5）。
 *
 * 判据：antd `components/tour/__tests__/index.test.tsx`（831 行）的主行为矩阵，
 * 用例逐条对应（上游用例名保留在注释）。额外钉 §9-V6 的 open 语义
 * （rc `?? true` / 重开归零 / 越界强关 —— antd 测试没覆盖，源自 rc 源码判据）。
 *
 * ⚠️ 测试必须禁 VTU teleport-stub（popconfirm 期教训）；
 *    rect mock 用**实例级**覆写 getBoundingClientRect（H5：不引 rc-util）。
 */

import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { Tour, TourPurePanel } from '../index';

import type { TourStepProps } from '../interface';

// ---------------------------------------------------------------------------
// harness
// ---------------------------------------------------------------------------

const popup = () => document.querySelector<HTMLElement>('.apollo-tour');
const mask = () => document.querySelector<HTMLElement>('.apollo-tour-mask');
const panel = () => document.querySelector<HTMLElement>('.apollo-tour-panel');
const nextBtn = () => document.querySelector<HTMLButtonElement>('.apollo-tour-next-btn');
const prevBtn = () => document.querySelector<HTMLButtonElement>('.apollo-tour-prev-btn');
const closeBtn = () => document.querySelector<HTMLButtonElement>('.apollo-tour-close');

function makeTarget(rect?: { x: number; y: number; width: number; height: number }): {
  el: HTMLButtonElement;
  restore: () => void;
} {
  const el = document.createElement('button');
  el.type = 'button';
  el.textContent = 'target';
  document.body.appendChild(el);
  if (rect) {
    const origin = el.getBoundingClientRect.bind(el);
    el.getBoundingClientRect = (() =>
      ({
        x: rect.x,
        y: rect.y,
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        right: rect.x + rect.width,
        bottom: rect.y + rect.height,
        toJSON: () => ({}),
      }) as DOMRect) as typeof origin;
  }
  return { el, restore: () => el.remove() };
}

async function waitOpen(): Promise<void> {
  await vi.waitUntil(() => panel() !== null, { timeout: 2000 }).catch(() => {});
  await nextTick();
}

afterEach(() => {
  document.body.innerHTML = '';
});

// ---------------------------------------------------------------------------
// 渲染门与 open 语义（§9-V6，rc 源码判据）
// ---------------------------------------------------------------------------

describe('Tour · open 语义', () => {
  // rc `internalOpen ?? true`：不传 open/defaultOpen 且 current 合法 ⇒ 默认打开
  it('不传 open：有 steps 时默认打开（V6）', async () => {
    mount(Tour, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: { steps: [{ title: 't' }] },
    });
    await waitOpen();
    expect(panel()).not.toBeNull();
  });

  it('steps 为空：不渲染（rc mergedSteps 空 ⇒ current 越界）', async () => {
    mount(Tour, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: { open: true, steps: [] },
    });
    await nextTick();
    expect(popup()).toBeNull();
    expect(mask()).toBeNull();
  });

  it('current 越界：强制关闭', async () => {
    mount(Tour, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: { open: true, current: 2, steps: [{ title: 'a' }, { title: 'b' }] },
    });
    await nextTick();
    expect(popup()).toBeNull();
  });

  it('重开：current 静默归零（不发 change）', async () => {
    const onChange = vi.fn();
    const w = mount(Tour, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: {
        open: false,
        defaultCurrent: 1,
        steps: [{ title: 'a' }, { title: 'b' }],
        onChange,
      },
    });
    await nextTick();
    expect(panel()).toBeNull();
    await w.setProps({ open: true });
    await waitOpen();
    // 归零：显示的是第一步
    expect(panel()?.querySelector('.apollo-tour-indicator-active')).not.toBeNull();
    // 静默：不发 change
    expect(onChange).not.toHaveBeenCalled();
  });

  it('关闭后 mask 卸载', async () => {
    const w = mount(Tour, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: { open: true, steps: [{ title: 'a' }] },
    });
    await waitOpen();
    expect(mask()).not.toBeNull();
    await w.setProps({ open: false });
    await nextTick();
    await vi.waitUntil(() => mask() === null, { timeout: 2000 }).catch(() => {});
    expect(mask()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 主行为矩阵（antd index.test.tsx 逐条）
// ---------------------------------------------------------------------------

describe('Tour · 主行为（antd 矩阵）', () => {
  // 上游 it('single')
  it('single：函数 target + title/description 渲染', async () => {
    const t = makeTarget();
    mount(Tour, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: {
        open: true,
        steps: [
          {
            title: 'cover title',
            description: 'cover description.',
            target: () => t.el,
          },
        ] satisfies TourStepProps[],
      },
    });
    await waitOpen();
    expect(document.body.textContent).toContain('cover title');
    expect(document.body.textContent).toContain('cover description.');
    t.restore();
  });

  // 上游 it('Primary')：panel 的 parentElement 带 -primary
  it('type="primary"：面板根带 -primary', async () => {
    const t = makeTarget();
    mount(Tour, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: {
        open: true,
        type: 'primary',
        steps: [
          { title: 'primary title', description: 'primary description.', target: () => t.el },
        ],
      },
    });
    await waitOpen();
    expect(panel()?.parentElement).toHaveClass('apollo-tour-primary');
    t.restore();
  });

  // 上游 it('step support Primary')
  it('步骤级 primary 覆盖全局 default', async () => {
    const t = makeTarget();
    const w = mount(Tour, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: {
        open: true,
        type: 'default',
        steps: [
          { title: 'cover title', description: 'cover description.', target: () => t.el },
          {
            title: 'primary title',
            description: 'primary description.',
            target: () => t.el,
            type: 'primary',
          },
        ],
      },
    });
    await waitOpen();
    expect(document.querySelector('.apollo-tour-primary .apollo-tour-panel')).toBeNull();
    nextBtn()?.click();
    await nextTick();
    expect(document.querySelector('.apollo-tour-primary .apollo-tour-panel')).not.toBeNull();
    t.restore();
    w.unmount();
  });

  // 上游 it('basic')：无 target 居中 → Next × 2 → Finish 关闭
  // ⚠️ 上游不传 open —— 非受控（rc `?? true` 默认打开），Finish 后内部关闭
  it('basic：三步流转，Finish 后关闭', async () => {
    const t = makeTarget();
    const w = mount(Tour, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: {
        steps: [
          { title: 'Show in Center', description: 'Here is the content of Tour.', target: null },
          { title: 'With Cover', description: 'Here is the content of Tour.', target: () => t.el },
          {
            title: 'Adjust Placement',
            description: 'Here is the content of Tour which show on the right.',
            placement: 'right',
            target: () => t.el,
          },
        ],
      },
    });
    await waitOpen();
    expect(document.body.textContent).toContain('Show in Center');
    nextBtn()?.click();
    await nextTick();
    nextBtn()?.click();
    await nextTick();
    expect(document.body.textContent).toContain('Adjust Placement');
    // 最后一步：按钮文案是 Finish
    expect(nextBtn()?.textContent).toContain('Finish');
    nextBtn()?.click();
    await nextTick();
    await vi.waitUntil(() => popup() === null, { timeout: 2000 }).catch(() => {});
    expect(popup()).toBeNull();
    t.restore();
    w.unmount();
  });

  // 上游 it('steps props indicatorsRender')
  it('prev/next/finish 全程点击：自定义 onClick 均被调用', async () => {
    const onClickMock = vi.fn();
    const t = makeTarget();
    mount(Tour, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: {
        open: true,
        type: 'default',
        steps: [
          { title: 's1', nextButtonProps: { onClick: onClickMock } },
          {
            title: 's2',
            nextButtonProps: { onClick: onClickMock },
            prevButtonProps: { onClick: onClickMock },
          },
          {
            title: 's3',
            prevButtonProps: { onClick: onClickMock },
            nextButtonProps: { onClick: onClickMock },
          },
        ],
      },
    });
    await waitOpen();
    // 首步无 prev
    expect(prevBtn()).toBeNull();
    nextBtn()?.click();
    await nextTick();
    prevBtn()?.click();
    await nextTick();
    nextBtn()?.click();
    await nextTick();
    nextBtn()?.click();
    await nextTick();
    // Finish 也带 onClick
    nextBtn()?.click();
    await nextTick();
    expect(onClickMock).toHaveBeenCalledTimes(5);
    t.restore();
  });

  // 上游 it('button props onClick')：onClick 与内部流转互不干扰
  it('nextButtonProps.onClick 与 onFinish 链（最后一步两处都触发）', async () => {
    const onFinish = vi.fn();
    const onNext = vi.fn();
    const t = makeTarget();
    const w = mount(Tour, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: {
        open: true,
        steps: [
          { title: '', target: () => t.el, nextButtonProps: { onClick: onNext } },
          { title: '', target: () => t.el, prevButtonProps: { onClick: onNext } },
        ],
        onFinish,
      },
    });
    await waitOpen();
    nextBtn()?.click();
    await nextTick();
    expect(onNext).toHaveBeenCalledTimes(1);
    // 最后一步：finish
    nextBtn()?.click();
    await nextTick();
    expect(onFinish).toHaveBeenCalledTimes(1);
    t.restore();
    w.unmount();
  });

  // 上游 it('controlled current')
  it('受控 current：点 Next 只发事件不自行更新', async () => {
    const onUpdate = vi.fn();
    const onChange = vi.fn();
    const t = makeTarget();
    const w = mount(Tour, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: {
        open: true,
        current: 0,
        steps: [
          { title: 'a', target: () => t.el },
          { title: 'b', type: 'primary', target: () => t.el },
        ],
        'onUpdate:current': onUpdate,
        onChange,
      },
    });
    await waitOpen();
    nextBtn()?.click();
    await nextTick();
    expect(onUpdate).toHaveBeenCalledWith(1);
    expect(onChange).toHaveBeenCalledWith(1);
    // 受控：父级未回传 ⇒ 停在第 0 步
    expect(document.body.textContent).toContain('a');
    t.restore();
    w.unmount();
  });

  // 上游 it('panelRender should correct render when title is undefined or null')
  it('title 为空：不渲染 header', async () => {
    mount(Tour, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: {
        open: true,
        steps: [{ title: undefined } as unknown as TourStepProps],
      },
    });
    await waitOpen();
    expect(document.querySelector('.apollo-tour-header')).toBeNull();
  });

  // 单步 ⇒ 无指示器（上游 total undefined/null 用例的本仓等价）
  it('单步：无指示器', async () => {
    mount(Tour, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: { open: true, steps: [{ title: 'only' }] },
    });
    await waitOpen();
    expect(document.querySelector('.apollo-tour-indicators')).toBeNull();
  });

  // 上游 it('custom step pre btn & next btn className & style')
  it('nextButtonProps 的 Vue 原生 class / style 落到按钮', async () => {
    mount(Tour, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: {
        open: true,
        steps: [
          {
            title: 'Show in Center',
            description: 'Here is the content of Tour.',
            nextButtonProps: {
              class: 'customClassName',
              style: { backgroundColor: 'rgb(69,69,255)' },
            },
          },
          { title: 'With Cover' },
        ],
      },
    });
    await waitOpen();
    const btn = nextBtn();
    expect(btn).toHaveClass('customClassName');
    expect(btn).toHaveClass('apollo-tour-next-btn');
    expect(btn?.getAttribute('style')).toContain('background-color: rgb(69, 69, 255)');
  });

  // 上游 it('custom indicator') → C8-R2：#indicators scoped slot
  it('#indicators slot 替换默认指示器', async () => {
    mount(Tour, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: {
        open: true,
        steps: [
          { title: 'Upload File', description: 'Put your files here.' },
          { title: 'Save', description: 'Save your changes.' },
        ],
      },
      slots: {
        indicators: (info: { current: number; total: number }) =>
          h('span', { class: 'custom-indicator' }, `${info.current + 1} / ${info.total}`),
      },
    });
    await waitOpen();
    expect(document.querySelector('.custom-indicator')?.textContent).toBe('1 / 2');
  });

  // 上游 it('first step should be primary')
  it('步骤 className 与 -primary 同时落在浮层根', async () => {
    const t = makeTarget();
    mount(Tour, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: {
        open: true,
        steps: [
          {
            title: '',
            description: '',
            target: () => t.el,
            type: 'primary',
            className: 'should-be-primary',
          },
          { title: '', target: () => t.el },
        ],
      },
    });
    await waitOpen();
    expect(document.querySelector('.should-be-primary')).not.toBeNull();
    expect(document.querySelector('.should-be-primary')).toHaveClass('apollo-tour-primary');
    t.restore();
  });

  // 上游 it('onClose current is correct')
  it('close 事件携带关闭时的 current', async () => {
    const onClose = vi.fn();
    mount(Tour, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: {
        onClose,
        open: true,
        steps: [{ title: '', type: 'primary' }, { title: '' }],
      },
    });
    await waitOpen();
    nextBtn()?.click();
    await nextTick();
    closeBtn()?.click();
    await nextTick();
    expect(onClose).toHaveBeenLastCalledWith(1);
  });

  // 上游 it('should support gap.radius')
  it('gap.radius → 挖洞 rect 的 rx', async () => {
    const t = makeTarget({ x: 0, y: 0, width: 100, height: 50 });
    const w = mount(Tour, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: {
        open: true,
        gap: { radius: 4 },
        steps: [{ title: 'Show in Center', description: '', target: () => t.el }],
      },
    });
    await waitOpen();
    const hole = document.querySelector('.apollo-tour-placeholder-animated');
    expect(hole).not.toBeNull();
    expect(hole).toHaveAttribute('rx', '4');
    await w.setProps({ gap: { radius: 0 } });
    await nextTick();
    expect(document.querySelector('.apollo-tour-placeholder-animated')).toHaveAttribute('rx', '0');
    t.restore();
    w.unmount();
  });

  // 上游 it('should support gap.offset')
  it('gap.offset → 挖洞 rect 四向外扩', async () => {
    const gap = { offset: 10 };
    const pos = { x: 100, y: 200, width: 230, height: 180 };
    const t = makeTarget(pos);
    mount(Tour, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: {
        open: true,
        gap,
        steps: [{ title: 'Show in Center', description: '', target: () => t.el }],
      },
    });
    await waitOpen();
    const hole = document.querySelector('.apollo-tour-placeholder-animated');
    expect(hole).toHaveAttribute('width', String(pos.width + gap.offset * 2));
    expect(hole).toHaveAttribute('height', String(pos.height + gap.offset * 2));
    expect(hole).toHaveAttribute('x', String(pos.x - gap.offset));
    expect(hole).toHaveAttribute('y', String(pos.y - gap.offset));
    t.restore();
  });

  // 上游 it('default aria-label')
  it('默认 aria-label = locale.global.close', async () => {
    mount(Tour, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: { open: true, steps: [{ title: 'test', description: 'test' }] },
    });
    await waitOpen();
    expect(closeBtn()).toHaveAttribute('aria-label', 'Close');
  });

  // 上游 it('custom aria-label')
  it('closable 的 aria-label 透传', async () => {
    mount(Tour, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: {
        open: true,
        steps: [
          { title: 'test', description: 'test', closable: { 'aria-label': 'Custom Close Button' } },
        ],
      },
    });
    await waitOpen();
    expect(closeBtn()).toHaveAttribute('aria-label', 'Custom Close Button');
  });
});

// ---------------------------------------------------------------------------
// closeIcon 合并矩阵（上游 it('support closeIcon') 全量）
// ---------------------------------------------------------------------------

describe('Tour · closeIcon 合并（step 层覆盖 root 层）', () => {
  /**
   * 上游 Demo 的逐字移植：
   *   s1 = { mask: true, target }                                ← 只吃全局
   *   s2 = { closeIcon: !closeIcon, target }                     ← 步骤级布尔翻转
   *   s3 = { closeIcon: <span class="custom-del-close-icon"> }   ← 步骤级 vnode
   */
  const Demo = defineComponent({
    props: { closeIcon: { type: null, default: false } },
    setup(props) {
      const t1 = makeTarget();
      const t2 = makeTarget();
      const t3 = makeTarget();
      const steps: TourStepProps[] = [
        { title: '创建', description: '创建一条数据', target: () => t1.el, mask: true },
        {
          title: '更新',
          closeIcon: !props.closeIcon,
          description: '更新一条数据',
          target: () => t2.el,
        },
        {
          title: '删除',
          closeIcon: h('span', { class: 'custom-del-close-icon' }, 'Close'),
          description: '危险操作:删除一条数据',
          target: () => t3.el,
        },
      ];
      return () => h(Tour, { closeIcon: props.closeIcon, open: true, steps });
    },
  });

  const resetIndex = async (): Promise<void> => {
    prevBtn()?.click();
    await nextTick();
    prevBtn()?.click();
    await nextTick();
  };

  it('全局 closeIcon=false：s1 无关闭钮，s2 默认图标，s3 自定义图标', async () => {
    mount(Demo, { attachTo: document.body, global: { stubs: { teleport: false } } });
    await waitOpen();
    expect(closeBtn()).toBeNull();
    nextBtn()?.click();
    await nextTick();
    expect(closeBtn()).not.toBeNull();
    expect(document.querySelector('.apollo-tour-close-icon')).not.toBeNull();
    nextBtn()?.click();
    await nextTick();
    expect(closeBtn()).not.toBeNull();
    expect(document.querySelector('.apollo-tour-close-icon')).toBeNull();
    expect(document.querySelector('.custom-del-close-icon')).not.toBeNull();
    await resetIndex();
  });

  it('全局 closeIcon=true：s1 默认图标，s2 被步骤 false 关闭，s3 自定义', async () => {
    const w = mount(Demo, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: { closeIcon: true },
    });
    await waitOpen();
    expect(closeBtn()).not.toBeNull();
    expect(document.querySelector('.apollo-tour-close-icon')).not.toBeNull();
    nextBtn()?.click();
    await nextTick();
    expect(closeBtn()).toBeNull();
    nextBtn()?.click();
    await nextTick();
    expect(closeBtn()).not.toBeNull();
    expect(document.querySelector('.custom-del-close-icon')).not.toBeNull();
    w.unmount();
  });

  it('全局 closeIcon=vnode：s1 用全局自定义，s3 用步骤自定义', async () => {
    const w = mount(Demo, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: { closeIcon: h('span', { class: 'custom-global-close-icon' }, 'X') },
    });
    await waitOpen();
    expect(closeBtn()).not.toBeNull();
    expect(document.querySelector('.custom-global-close-icon')).not.toBeNull();
    nextBtn()?.click();
    await nextTick();
    expect(closeBtn()).toBeNull();
    nextBtn()?.click();
    await nextTick();
    expect(closeBtn()).not.toBeNull();
    expect(document.querySelector('.custom-del-close-icon')).not.toBeNull();
    w.unmount();
  });
});

// ---------------------------------------------------------------------------
// PurePanel
// ---------------------------------------------------------------------------

describe('Tour · PurePanel', () => {
  // 上游 PurePanel.closeIcon（数组图标）
  it('closeIcon 数组渲染；静态面板带 -pure', () => {
    const w = mount(TourPurePanel, {
      props: {
        title: 'a',
        closeIcon: [h('span', { class: 'bamboo' }), h('span', { class: 'little' })],
      },
    });
    expect(w.find('.bamboo').exists()).toBe(true);
    expect(w.find('.little').exists()).toBe(true);
    expect(w.find('.apollo-tour-pure').exists()).toBe(true);
  });

  it('静态挂到 Tour._InternalPanelDoNotUseOrYouWillBeFired', () => {
    expect(Tour._InternalPanelDoNotUseOrYouWillBeFired).toBe(TourPurePanel);
  });
});

// ---------------------------------------------------------------------------
// 受控 open（v-model 通道）
// ---------------------------------------------------------------------------

describe('Tour · 受控 open', () => {
  it('关闭按钮发 update:open(false)；受控时父级未回传 ⇒ 仍开着', async () => {
    const onUpdate = vi.fn();
    const w = mount(Tour, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: {
        open: true,
        steps: [{ title: 'a' }],
        'onUpdate:open': onUpdate,
      },
    });
    await waitOpen();
    closeBtn()?.click();
    await nextTick();
    expect(onUpdate).toHaveBeenCalledWith(false);
    expect(panel()).not.toBeNull();
    w.unmount();
  });
});

// ---------------------------------------------------------------------------
// slot 优先（C8-R2）
// ---------------------------------------------------------------------------

describe('Tour · slot 优先（C8-R2）', () => {
  it('#title / #description 优先于同名 string prop', async () => {
    const t = makeTarget();
    mount(Tour, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: {
        open: true,
        steps: [{ title: 'prop title', description: 'prop desc', target: () => t.el }],
      },
      slots: {
        title: () => h('span', { class: 'slot-title' }, 'slot title'),
        description: () => h('span', { class: 'slot-desc' }, 'slot desc'),
      },
    });
    await waitOpen();
    expect(document.querySelector('.slot-title')?.textContent).toBe('slot title');
    expect(document.querySelector('.slot-desc')?.textContent).toBe('slot desc');
    expect(document.body.textContent).not.toContain('prop title');
    t.restore();
  });

  it('#nextButton 优先于 nextButtonProps.children', async () => {
    mount(Tour, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: {
        open: true,
        steps: [{ title: 'a', nextButtonProps: { children: 'prop next' } }],
      },
      slots: { nextButton: () => 'slot next' },
    });
    await waitOpen();
    expect(nextBtn()?.textContent).toBe('slot next');
  });
});

// ---------------------------------------------------------------------------
// 非受控内部状态
// ---------------------------------------------------------------------------

describe('Tour · 非受控内部状态', () => {
  it('defaultCurrent + Next：内部 current 前进，第二步出现 prev', async () => {
    const t = makeTarget();
    mount(Tour, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: {
        open: true,
        defaultCurrent: 0,
        steps: [
          { title: 'a', target: () => t.el },
          { title: 'b', target: () => t.el },
        ],
      },
    });
    await waitOpen();
    expect(document.body.textContent).toContain('a');
    nextBtn()?.click();
    await nextTick();
    expect(document.body.textContent).toContain('b');
    expect(prevBtn()).not.toBeNull();
    t.restore();
  });
});
