import { describe, expectTypeOf, it } from 'vitest';
import { type CSSProperties, h, type VNode, type VNodeChild } from 'vue';
import type { SemanticInput } from '../../_internal/use-merge-semantic';
import type { SizeType } from '../../config-provider/size-context';
import type { SelectVariant } from '../../select/interface';
import type {
  CascaderEmits,
  CascaderOutputValue,
  CascaderPanelProps,
  CascaderProps,
  CascaderRef,
  CascaderSearchConfig,
  CascaderSelectedOptions,
  CascaderSemanticClassNames,
  CascaderSemanticStyles,
  CascaderSlots,
  CascaderValue,
} from '../index';
import { Cascader, CascaderPanel } from '../index';
import type { BaseOptionType, ValueCell } from '../utils';

describe('Cascader public Vue contracts', () => {
  it('keeps data paths, owned events and constructor props aligned', () => {
    expectTypeOf<CascaderProps['value']>().toEqualTypeOf<CascaderValue | undefined>();
    expectTypeOf<CascaderOutputValue>().toEqualTypeOf<ValueCell | ValueCell[]>();
    expectTypeOf<InstanceType<typeof Cascader>['$props']['value']>().toEqualTypeOf<
      CascaderValue | undefined
    >();
    expectTypeOf<InstanceType<typeof CascaderPanel>['$props']['value']>().toEqualTypeOf<
      CascaderValue | undefined
    >();
    expectTypeOf<Parameters<CascaderEmits['change']>>().toEqualTypeOf<
      [CascaderOutputValue, CascaderSelectedOptions]
    >();
    expectTypeOf<NonNullable<CascaderProps['onChange']>>().toEqualTypeOf<CascaderEmits['change']>();
    expectTypeOf<CascaderProps['size']>().toEqualTypeOf<SizeType | undefined>();
    expectTypeOf<CascaderProps['variant']>().toEqualTypeOf<SelectVariant | undefined>();
    expectTypeOf<CascaderPanelProps['loadData']>().toEqualTypeOf<
      ((options: BaseOptionType[]) => void | Promise<void>) | undefined
    >();
  });
  it('uses Vue content slots and CSSProperties throughout semantic targets', () => {
    expectTypeOf<NonNullable<CascaderSlots['popupRender']>>().parameters.toEqualTypeOf<
      [{ menu: VNode }]
    >();
    expectTypeOf<NonNullable<CascaderSlots['displayRender']>>().parameters.toEqualTypeOf<
      [{ labels: VNodeChild[]; selectedOptions: (BaseOptionType | null)[] }]
    >();
    expectTypeOf<NonNullable<CascaderSlots['optionRender']>>().parameters.toEqualTypeOf<
      [{ option: BaseOptionType; pathOptions: BaseOptionType[] }]
    >();
    expectTypeOf<CascaderProps['classNames']>().toEqualTypeOf<
      SemanticInput<CascaderSemanticClassNames, CascaderProps> | undefined
    >();
    expectTypeOf<CascaderProps['styles']>().toEqualTypeOf<
      SemanticInput<CascaderSemanticStyles, CascaderProps> | undefined
    >();
    expectTypeOf<CascaderSemanticStyles['root']>().toEqualTypeOf<CSSProperties | undefined>();
    expectTypeOf<CascaderProps['popupStyle']>().toEqualTypeOf<CSSProperties | undefined>();
    expectTypeOf<CascaderProps>().not.toHaveProperty('displayRender');
    expectTypeOf<CascaderProps>().not.toHaveProperty('optionRender');
    expectTypeOf<CascaderProps>().not.toHaveProperty('popupRender');
    expectTypeOf<CascaderProps>().not.toHaveProperty('trigger');
    expectTypeOf<CascaderSearchConfig>().not.toHaveProperty('render');
    expectTypeOf<CascaderSearchConfig>().not.toHaveProperty('onSearch');
  });
  it('exposes a native root property and focus options on actual component refs', () => {
    expectTypeOf<
      InstanceType<typeof Cascader>['nativeElement']
    >().toEqualTypeOf<HTMLElement | null>();
    expectTypeOf<InstanceType<typeof Cascader>['focus']>().toEqualTypeOf<CascaderRef['focus']>();
    expectTypeOf<InstanceType<typeof Cascader>['blur']>().toEqualTypeOf<CascaderRef['blur']>();
  });
});

// Compile negative and positive callers without executing their refs or invalid inputs.
function callers() {
  const props: CascaderProps = {
    multiple: true,
    value: [[0], ['0']],
    size: 'medium',
    variant: 'underlined',
    styles: (info) => ({
      root: { cursor: info.props.disabled ? 'wait' : 'pointer' },
      popup: { root: { zIndex: 'var(--layer)' } },
    }),
    loadData: async (options) => {
      options.at(-1);
    },
  };
  h(Cascader, props);
  h(CascaderPanel, {
    value: [0],
    onChange: (value, options) => {
      value.length;
      options.length;
    },
  });
  const slots: CascaderSlots = {
    popupRender: ({ menu }) => h('section', [menu]),
    displayRender: ({ labels }) => [labels, 0, false],
    optionRender: ({ option, pathOptions }) => [String(option.label), pathOptions.length],
  };
  const invalidPath: CascaderProps = {
    // @ts-expect-error path values are strings or numbers, never option objects
    value: [{ value: 'a' }],
  };
  const invalidStyle: CascaderProps = {
    // @ts-expect-error semantic CSS must use Vue CSSProperties
    styles: { popup: { root: { display: { invalid: true } } } },
  };
  const oldContent: CascaderProps = {
    // @ts-expect-error render content moved to the native scoped slot
    popupRender: () => h('span'),
  };
  const oldSearch: CascaderSearchConfig = {
    // @ts-expect-error search content moved to #searchRender
    render: () => 'old',
  };
  const oldNotification: CascaderProps = {
    // @ts-expect-error change receives paths and option paths
    onChange: (_event: MouseEvent) => {},
  };
  void [slots, invalidPath, invalidStyle, oldContent, oldSearch, oldNotification];
}
void callers;
