/**
 * 2026-10-22 通知动效审计 MN-04：placementMotion 必须完整透传给 MotionList。
 *
 * rc 2.0.8 的写法是 `{ component:false, keys, motionAppear:true, ...placementMotion }`；
 * 本仓原先只取了 `motionName`，自定义 enter/leave/appear/hooks/deadline 全部丢失。
 * 这里用一个记录 props 的 MotionList 桩钉住白名单映射。
 */
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick } from 'vue';

const captured = vi.hoisted(() => ({ attrs: {} as Record<string, unknown> }));

vi.mock('@apollo-design/motion', () => ({
  MotionList: defineComponent({
    name: 'StubMotionList',
    setup(_props, { attrs }) {
      captured.attrs = { ...attrs };
      return () => null;
    },
  }),
}));

import NoticeList from '../engine/NoticeList';

beforeEach(() => {
  captured.attrs = {};
});

describe('通知内核 MN-04 · motion 配置透传', () => {
  it('motionName / appear / enter / leave / deadline / hooks / supportMotion 都到达 MotionList', async () => {
    const hooks = { onVisibleChanged: vi.fn() };
    const wrapper = mount(NoticeList, {
      props: {
        placement: 'topRight',
        configList: [{ key: 'a', title: 'A' }],
        motion: {
          motionName: 'custom-fade',
          motionAppear: false,
          motionEnter: false,
          motionLeave: false,
          motionLeaveImmediately: true,
          motionDeadline: 42,
          removeOnLeave: false,
          forceRender: true,
          leavedClassName: 'custom-leaved',
          supportMotion: true,
          hooks,
        },
      } as never,
    });
    await nextTick();

    expect(captured.attrs.motionName).toBe('custom-fade');
    expect(captured.attrs.motionAppear).toBe(false);
    expect(captured.attrs.motionEnter).toBe(false);
    expect(captured.attrs.motionLeave).toBe(false);
    expect(captured.attrs.motionLeaveImmediately).toBe(true);
    expect(captured.attrs.motionDeadline).toBe(42);
    expect(captured.attrs.removeOnLeave).toBe(false);
    expect(captured.attrs.forceRender).toBe(true);
    expect(captured.attrs.leavedClassName).toBe('custom-leaved');
    expect(captured.attrs.supportMotion).toBe(true);
    expect(captured.attrs.hooks).toStrictEqual(hooks);
    // 内核控制字段不能被 motion 配置覆盖
    expect(captured.attrs.onAllRemoved).toBeTypeOf('function');
    wrapper.unmount();
  });

  it('默认只给 motionName 时，motionAppear 仍为 true、deadline 走 500ms 兜底', async () => {
    const wrapper = mount(NoticeList, {
      props: {
        placement: 'topRight',
        configList: [{ key: 'a', title: 'A' }],
        motion: { motionName: 'apollo-notification-fade' },
      } as never,
    });
    await nextTick();

    expect(captured.attrs.motionName).toBe('apollo-notification-fade');
    expect(captured.attrs.motionAppear).toBe(true);
    expect(captured.attrs.motionDeadline).toBe(500);
    wrapper.unmount();
  });
});
