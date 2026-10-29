import { describe, expectTypeOf, it } from 'vitest';
import { h, type VNodeChild } from 'vue';
import { Collapse as RootCollapse } from '../../index';
import type {
  CollapseExpandIconScope,
  CollapseHeadingLevel,
  CollapseItemType,
  CollapsePanelProps,
  CollapseProps,
  CollapseRef,
  CollapseSemanticClassNames,
  CollapsibleType,
  ExpandIconPlacement,
} from '../index';
import Collapse, { CollapsePanel, Collapse as NamedCollapse } from '../index';

type RootProps = InstanceType<typeof Collapse>['$props'];
type PanelProps = InstanceType<typeof CollapsePanel>['$props'];
type Model = NonNullable<RootProps['onUpdate:activeKey']>;
type Untyped<T> = 0 extends 1 & T ? true : false;

describe('Collapse strong public contracts', () => {
  it('keeps named/default/root static Panel and model payload typed', () => {
    expectTypeOf(Collapse.Panel).toEqualTypeOf(CollapsePanel);
    expectTypeOf(NamedCollapse.Panel).toEqualTypeOf(CollapsePanel);
    expectTypeOf(RootCollapse.Panel).toEqualTypeOf(CollapsePanel);
    expectTypeOf<Untyped<typeof NamedCollapse.Panel>>().toEqualTypeOf<false>();
    expectTypeOf<Untyped<Parameters<Model>[0]>>().toEqualTypeOf<false>();
    expectTypeOf<Parameters<Model>>().toEqualTypeOf<[string[]]>();
    expectTypeOf<CollapseRef['nativeElement']>().toEqualTypeOf<HTMLDivElement | null>();
  });
  it('accepts current model, heading, item VNode data and Panel fallback/style fields', () => {
    const root: RootProps = {
      items: [{ key: 1, label: h('span', 'Title'), extra: 0, children: h('input') }],
      activeKey: [1, 'a'],
      headingLevel: 2,
      onChange: (keys) => keys.join(','),
      'onUpdate:activeKey': (keys) => keys.join(','),
    };
    const panel: PanelProps = {
      header: 'Title',
      label: h('em', 'Fallback'),
      forceRender: true,
      onItemClick: (key) => key.toUpperCase(),
    };
    const declared: CollapsePanelProps = {
      style: [{ color: 'red' }, 'margin:0'],
      prefixCls: 'local-collapse',
      disabled: true,
    };
    void [root, panel, declared];
    expectTypeOf<CollapseHeadingLevel>().toEqualTypeOf<1 | 2 | 3 | 4 | 5 | 6>();
    expectTypeOf<CollapsibleType>().toEqualTypeOf<'header' | 'icon' | 'disabled'>();
    expectTypeOf<ExpandIconPlacement>().toEqualTypeOf<'start' | 'end'>();
    expectTypeOf<CollapseItemType['key']>().toEqualTypeOf<string | number | undefined>();
    expectTypeOf<NonNullable<CollapseProps['onChange']>>().toEqualTypeOf<
      (keys: string[]) => void
    >();
  });
  it('exposes named slot scopes and all five semantics without weakening VNode data', () => {
    type Icon = NonNullable<InstanceType<typeof Collapse>['$slots']['expandIcon']>;
    expectTypeOf<Parameters<Icon>[0]>().toEqualTypeOf<CollapseExpandIconScope>();
    expectTypeOf<CollapseItemType['children']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<keyof CollapseSemanticClassNames>().toEqualTypeOf<
      'root' | 'header' | 'title' | 'body' | 'icon'
    >();
    const render: Icon = (scope) => [
      h('span', scope.key),
      h('i', scope.isActive ? 'Open' : 'Closed'),
    ];
    void render;
  });
  it('rejects obsolete render props, invalid models/events, headings, slots and Panel content props', () => {
    // @ts-expect-error Component rendering belongs to #expandIcon, never a root prop.
    const oldIcon: RootProps = { expandIcon: () => h('span') };
    // @ts-expect-error Component content belongs to its default slot; item children remains valid.
    const oldChildren: CollapseProps = { children: h('div') };
    // @ts-expect-error Heading level must correspond to a real HTML heading.
    const heading: RootProps = { headingLevel: 7 };
    // @ts-expect-error Input keys accept only strings and numbers.
    const model: RootProps = { activeKey: [true] };
    // @ts-expect-error Emitted normalized keys are strings.
    const modelListener: RootProps = { 'onUpdate:activeKey': (_keys: number[]) => {} };
    // @ts-expect-error change emits a string array, never a DOM event.
    const change: RootProps = { onChange: (_event: MouseEvent) => {} };
    // @ts-expect-error itemClick retains its normalized business key.
    const itemListener: PanelProps = { onItemClick: (_event: MouseEvent) => {} };
    // @ts-expect-error Rich header rendering uses #header or label VNode data.
    const header: PanelProps = { header: h('span') };
    // @ts-expect-error Panel extra content is a named slot.
    const extra: PanelProps = { extra: h('span') };
    // @ts-expect-error The root icon slot uses a named object scope, not a boolean.
    const icon: NonNullable<InstanceType<typeof Collapse>['$slots']['expandIcon']> = (
      _active: boolean,
    ) => [];
    void [
      oldIcon,
      oldChildren,
      heading,
      model,
      modelListener,
      change,
      itemListener,
      header,
      extra,
      icon,
    ];
  });
});
