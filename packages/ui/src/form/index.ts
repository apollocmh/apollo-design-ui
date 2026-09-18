/**
 * `Form` / `Form.Item` / `Form.List` 的公共导出（**骨架阶段**）。
 *
 * ⚠️⚠️ **本目录是骨架，不是实现** —— 见 `README.md`。
 *
 * ⚠️ 因此本模块**暂不接入 `packages/ui/src/index.ts` 的 barrel**。
 * 理由：barrel 的语义是「这些组件可用」，而骨架的内部是 TODO
 * （不产校验状态、不渲染 label/help/error）。提前导出会让
 * 「`import { Form } from '@apollo-design/ui'` 能用」变成一句假话。
 * 落地（G1→G14）后连同 export 段一起加进 barrel。
 */

import { withInstall } from '../_internal/with-install';
import FormComponent from './Form.vue';
import FormItemComponent from './FormItem.vue';
import FormListComponent from './FormList.vue';

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
  }),
);

export default Form;

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
