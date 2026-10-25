import { expectTypeOf, it } from 'vitest';
import { h, type VNodeChild } from 'vue';
import {
  Popconfirm,
  type PopconfirmProps,
  PopconfirmPurePanel,
  type PopconfirmSlots,
  Popover,
  type PopoverProps,
  PopoverPurePanel,
  type PopoverSlots,
  Tooltip,
  type TooltipContent,
  type TooltipProps,
  TooltipPurePanel,
  type TooltipSlots,
} from '../../index';

it('content data and native slots share VNodeChild, without render-function props', () => {
  expectTypeOf<TooltipContent>().toEqualTypeOf<VNodeChild>();
  expectTypeOf<ReturnType<NonNullable<PopconfirmProps['onConfirm']>>>().toEqualTypeOf<unknown>();
  expectTypeOf<NonNullable<TooltipSlots['title']>>().toEqualTypeOf<() => VNodeChild>();
  expectTypeOf<NonNullable<PopoverSlots['content']>>().toEqualTypeOf<() => VNodeChild>();
  expectTypeOf<NonNullable<PopconfirmSlots['description']>>().toEqualTypeOf<() => VNodeChild>();
  expectTypeOf<NonNullable<PopconfirmSlots['okText']>>().toEqualTypeOf<() => VNodeChild>();
  const tooltip: TooltipProps = { title: 0 };
  const popover: PopoverProps = { title: h('b', 'Title'), content: ['Body', 0] };
  const popconfirm: PopconfirmProps = { title: false, description: h('span', 'Details') };
  h(Tooltip, tooltip);
  h(TooltipPurePanel, { title: popover.title });
  h(Popover, popover);
  h(PopoverPurePanel, { title: popover.title, content: popover.content });
  h(Popconfirm, popconfirm);
  h(PopconfirmPurePanel, { title: popconfirm.title, description: popconfirm.description });
  const negative = () => {
    // @ts-expect-error Content functions migrate directly to #title.
    const oldTooltip: TooltipProps = { title: () => 'Old title' };
    // @ts-expect-error Content functions migrate directly to #content.
    const oldPopover: PopoverProps = { content: () => 'Old content' };
    // @ts-expect-error Content functions migrate directly to #description.
    const oldPopconfirm: PopconfirmProps = { description: () => 'Old description' };
    // @ts-expect-error Runtime component declarations reject renderer props too.
    h(TooltipPurePanel, { title: () => 'Old title' });
    // @ts-expect-error Runtime component declarations reject renderer props too.
    h(Popover, { content: () => 'Old content' });
    // @ts-expect-error Runtime component declarations reject renderer props too.
    h(PopconfirmPurePanel, { description: () => 'Old description' });
    return [oldTooltip, oldPopover, oldPopconfirm];
  };
  void negative;
});
