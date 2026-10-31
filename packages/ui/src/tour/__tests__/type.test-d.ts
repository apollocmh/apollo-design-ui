/**
 * L3 · 类型测试（Tour）
 *
 * 正例钉 API 形状，负例钉「哪些写法必须被类型系统拒绝」。
 * ⚠️ 负例一律写在**未被调用的闭包**里（`*.test-d.ts` 会被 vitest 真执行）。
 */

import { expectTypeOf, it } from 'vitest';
import { h } from 'vue';
import { Tour, TourPurePanel } from '../index';
import type {
  TourButtonProps,
  TourClosableConfig,
  TourPlacement,
  TourProps,
  TourPurePanelProps,
  TourSemanticClassNames,
  TourSlots,
  TourStepProps,
  TourType,
} from '../interface';

it('TourProps 的关键字段类型', () => {
  expectTypeOf<TourProps['open']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<TourProps['defaultOpen']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<TourProps['current']>().toEqualTypeOf<number | undefined>();
  expectTypeOf<TourProps['keyboard']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<TourProps['placement']>().toEqualTypeOf<TourPlacement | undefined>();
  expectTypeOf<TourProps['type']>().toEqualTypeOf<TourType | undefined>();
  expectTypeOf<TourProps['steps']>().toEqualTypeOf<TourStepProps[] | undefined>();
  // C8-R2：VNode 类 prop 收窄（title / description / cover 是 string）
  expectTypeOf<TourStepProps['title']>().toEqualTypeOf<string | undefined>();
  expectTypeOf<TourStepProps['description']>().toEqualTypeOf<string | undefined>();
  expectTypeOf<TourStepProps['cover']>().toEqualTypeOf<string | undefined>();
  // D111 例外清单：closeIcon 保留 VNode
  expectTypeOf<TourProps['closeIcon']>().not.toBeNever();
  // 对象形态
  expectTypeOf<TourProps['mask']>().not.toBeNever();
  expectTypeOf<TourProps['gap']>().not.toBeNever();
  expectTypeOf<TourProps['animated']>().not.toBeNever();
});

it('Tour 按钮配置使用 Vue 原生 class attrs', () => {
  const props: TourButtonProps = {
    class: ['tour-action', { active: true }],
    style: { color: 'red' },
  };
  expectTypeOf(props.class).not.toBeNever();

  const _never = () => {
    // @ts-expect-error nested button config uses Vue's class attr, not className
    const legacy: TourButtonProps = { className: 'legacy' };
    return legacy;
  };
  void _never;
});

it('placement 含 center（13 个值）', () => {
  expectTypeOf<TourPlacement>().toEqualTypeOf<
    | 'left'
    | 'leftTop'
    | 'leftBottom'
    | 'right'
    | 'rightTop'
    | 'rightBottom'
    | 'top'
    | 'topLeft'
    | 'topRight'
    | 'bottom'
    | 'bottomLeft'
    | 'bottomRight'
    | 'center'
  >();
});

it('语义槽 12 个（对象与函数双形态）', () => {
  expectTypeOf<keyof TourSemanticClassNames>().toEqualTypeOf<
    | 'root'
    | 'cover'
    | 'close'
    | 'mask'
    | 'section'
    | 'footer'
    | 'actions'
    | 'indicator'
    | 'indicators'
    | 'header'
    | 'title'
    | 'description'
  >();
  expectTypeOf<TourProps['classNames']>().not.toBeNever();
});

it('插槽面（scoped slot 的参数形状）', () => {
  expectTypeOf<TourSlots['indicators']>().not.toBeNever();
  expectTypeOf<TourSlots['actions']>().not.toBeNever();
  type Actions = NonNullable<InstanceType<typeof Tour>['$slots']['actions']>;
  expectTypeOf<Parameters<Actions>[0]['current']>().toEqualTypeOf<number>();
  expectTypeOf<Parameters<Actions>[0]['originNode']>().toEqualTypeOf<import('vue').Component>();
  expectTypeOf<
    Parameters<NonNullable<InstanceType<typeof Tour>['$slots']['title']>>[0]['step']
  >().toEqualTypeOf<TourStepProps>();
  expectTypeOf<InstanceType<typeof TourPurePanel>['$slots']['actions']>().toEqualTypeOf<
    TourSlots['actions']
  >();
});

it('真实组件支持 typed props、具名槽与 Vue owned 通知', () => {
  const props: TourProps = {
    open: true,
    current: 0,
    steps: [
      {
        target: () => null,
        nextButtonProps: {
          onClick: (event) => {
            expectTypeOf(event).toEqualTypeOf<MouseEvent>();
          },
        },
      },
    ],
    getPopupContainer: (node) => node.attachShadow({ mode: 'open' }),
    onPopupAlign: (element, align) => {
      expectTypeOf(element).toEqualTypeOf<HTMLElement>();
      expectTypeOf(align).toEqualTypeOf<import('../../_internal/trigger').TriggerAlign>();
    },
    'onUpdate:open': (_open: boolean) => {},
    onClose: (_current: number) => {},
  };
  const slots: TourSlots = {
    actions: ({ originNode }) => h(originNode),
    title: ({ current }) => ['Title ', current],
  };
  h(Tour, props, slots);
  const preview: TourPurePanelProps = { current: 1, total: 3, title: 'Preview' };
  h(TourPurePanel, preview, slots);
  expectTypeOf(Tour._InternalPanelDoNotUseOrYouWillBeFired).toEqualTypeOf<typeof TourPurePanel>();
});

function actualEvents(instance: InstanceType<typeof Tour>) {
  instance.$emit('update:current', 1);
  instance.$emit('popupAlign', document.createElement('div'), {});
  // @ts-expect-error current proposal is numeric
  instance.$emit('update:current', '1');
  // @ts-expect-error finish has no synthetic event payload
  instance.$emit('finish', new Event('finish'));
  // @ts-expect-error a title slot has no arbitrary record field
  instance.$slots.title?.({ record: {}, current: 0, total: 1 });
}
void actualEvents;

it('closable 的对象形态透传 aria-* / data-*', () => {
  const config: TourClosableConfig = { 'aria-label': 'x', 'data-id': '1' };
  expectTypeOf(config['aria-label']).not.toBeNever();
});

it('负例（仅类型层面）', () => {
  void ((): void => {
    // @ts-expect-error 非法 placement（无 'centerTop' 这种值）
    h(Tour, { placement: 'centerTop' });
  });
  void ((): void => {
    // @ts-expect-error 非法 type
    h(Tour, { type: 'danger' });
  });
  void ((): void => {
    // @ts-expect-error 非法 mask（对象形态只有 style / color）
    h(Tour, { mask: { fill: 'red' } });
  });
  void ((): void => {
    // @ts-expect-error gap.offset 不接受字符串
    h(Tour, { gap: { offset: '10px' } });
  });
  void ((): void => {
    // @ts-expect-error steps[].title 收窄为 string（VNode 走 #title 插槽）
    h(Tour, { steps: [{ title: h('span', 'x') }] });
  });
});
