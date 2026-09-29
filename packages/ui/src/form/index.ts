/**
 * `Form` / `Form.Item` / `Form.List` 的公共导出（G5 实现落地）。
 *
 * 静态属性：`Form.Item` / `Form.List` / `Form.useForm` / `Form.useWatch` /
 * `Form.ErrorList`（antd 复合组件对齐）。
 */

import { withInstall } from '../_internal/with-install';
import ErrorListComponent from './ErrorList';
import FormComponent from './Form.vue';
import FormItemComponent from './FormItem.vue';
import FormListComponent from './FormList.vue';
import { useForm as useFormHook } from './hooks/use-form';
import { useWatch as useWatchHook } from './hooks/use-watch';

/** `Form.Item`。 */
export const FormItem = withInstall(FormItemComponent);

/** `Form.List`。 */
export const FormList = withInstall(FormListComponent);

/**
 * `Form`。
 *
 * ⭐ `Form.Item` / `Form.List` 同时提供**静态别名**（`Form.Item`）与**独立具名导出**
 * （`FormItem`）—— 与 antd 的复合组件写法一致（`COMPONENT-RULES.md` 规则 R17），
 * 两种写法都必须有测试（落地时补）。
 */
export const Form = withInstall(
  Object.assign(FormComponent, {
    Item: FormItem,
    List: FormList,
    useForm: useFormHook,
    useWatch: useWatchHook,
    ErrorList: ErrorListComponent,
  }),
);

export default Form;

export { ErrorList as ErrorListComponent } from './ErrorList';
// ── 静态属性与 hooks（antd Form 复合面）──
export { useForm, useForm as useFormInstance } from './hooks/use-form';
export { stringify, useWatch, useWatch as useFormWatch } from './hooks/use-watch';
export type {
  ColProps,
  FeedbackIcons,
  FormEmits,
  FormItemLayout,
  FormItemProps,
  FormItemSlots,
  FormItemTooltipType,
  FormLabelAlign,
  FormLayout,
  FormListProps,
  FormListSlots,
  FormProps,
  FormSemanticClassNames,
  FormSemanticStyles,
  FormSlots,
  FormTooltipProps,
  RequiredMark,
  ScrollFocusOptions,
  ScrollOptions,
  SizeType,
  ValidateStatus,
  Variant,
} from './interface';
export { genFormStyle, genFormTokenDecls } from './style';
export type { ComponentToken as FormComponentToken } from './style/token';
export { prepareComponentToken as prepareFormComponentToken } from './style/token';
