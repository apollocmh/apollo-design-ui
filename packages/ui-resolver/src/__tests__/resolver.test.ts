import { describe, expect, it } from 'vitest';
import { componentImports } from '../component-imports';
import { ApolloResolver } from '../index';

describe('ApolloResolver', () => {
  it.each([
    ['AButton', 'Button', 'button'],
    ['AInputSearch', 'InputSearch', 'input'],
    ['AInputOtp', 'InputOTP', 'input'],
    ['ATextarea', 'TextArea', 'input'],
    ['AAutoComplete', 'AutoComplete', 'auto-complete'],
    ['AAutoCompleteOption', 'AutoCompleteOption', 'auto-complete'],
    ['ATimePicker', 'TimePicker', 'time-picker'],
    ['ATimeRangePicker', 'TimeRangePicker', 'time-picker'],
    ['ADatePickerRangePicker', 'RangePicker', 'date-picker'],
    ['ATypographyText', 'Text', 'typography'],
    ['ALayoutSider', 'LayoutSider', 'layout'],
    ['ASpaceCompact', 'SpaceCompact', 'space'],
    ['AFormItem', 'FormItem', 'form'],
    ['ASelectOption', 'SelectOption', 'select'],
    ['ADropdownButton', 'DropdownButton', 'dropdown'],
    ['ATableSummaryRow', 'TableSummaryRow', 'table'],
    ['ATableSummaryCell', 'TableSummaryCell', 'table'],
  ])('resolves the public %s import', async (tag, name, path) => {
    expect(await ApolloResolver({ importStyle: false }).resolve(tag)).toMatchObject({
      name,
      from: `@apollo-design/ui/${path}`,
    });
  });

  it.each([
    'Button',
    'a-button',
    'AUnknown',
    'AButtonGroup',
    'AMessage',
    'ANotification',
    'AFormField',
    'constructor',
    '__proto__',
  ])('does not take over %s', async (name) =>
    expect(await ApolloResolver().resolve(name)).toBeUndefined(),
  );

  it('can disable all automatic styles without changing JavaScript imports', async () => {
    const resolver = ApolloResolver({ importStyle: false });
    for (const [name, component] of componentImports) {
      expect(await resolver.resolve(name)).toEqual({
        name: component.name,
        from: `@apollo-design/ui/${component.path}`,
        sideEffects: undefined,
      });
    }
  });
});
