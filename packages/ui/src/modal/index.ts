/**
 * Modal 的公共导出。
 *
 * 与 antd 的 `es/modal/index.js` 对齐的对外面：
 *   - 默认导出 = `Modal`（组件）；
 *   - 静态方法：`useModal` / `info` / `success` / `error` / `warning` / `warn` /
 *     `confirm` / `destroyAll` / `config`；
 *   - 私有静态属性 `_InternalPanelDoNotUseOrYouWillBeFired`（PurePanel）。
 *
 * ⚠️ 两处与上游的**平台差异**（同 message / notification，D96）：
 *   - 命令式路径用**游离 `div`** 承载 Vue 应用（React 用 `DocumentFragment`）；
 *   - 不实现 `holderRender`（D30 同源）。
 */
import { withInstall } from '../_internal/with-install';
import confirm, {
  modalGlobalConfig,
  withConfirm,
  withError,
  withInfo,
  withSuccess,
  withWarn,
} from './confirm';
import destroyFns from './destroyFns';
import ModalComponent from './Modal';
import PurePanel from './PurePanel';
import useModal from './useModal';

function modalWarn(props: Parameters<typeof confirm>[0]) {
  return confirm(withWarn(props));
}

/** Modal 组件。注册名 `AModal`（COMPONENT-RULES.md 规则 R2）。 */
// ⚠️ `withInstall` 的返回类型与「带静态方法的组件」不是可比较类型 ⇒ 按仓库惯例
//    （drawer 的静态属性同源）经 `unknown` 断言一次
export const Modal = withInstall(ModalComponent) as unknown as typeof ModalComponent & {
  useModal: typeof useModal;
  info: typeof confirm;
  success: typeof confirm;
  error: typeof confirm;
  warning: typeof confirm;
  warn: typeof confirm;
  confirm: typeof confirm;
  destroyAll: () => void;
  config: typeof modalGlobalConfig;
  /** @private Internal Component. Do not use in your production. */
  _InternalPanelDoNotUseOrYouWillBeFired: typeof PurePanel;
};

Modal.useModal = useModal;
Modal.info = (props) => confirm(withInfo(props));
Modal.success = (props) => confirm(withSuccess(props));
Modal.error = (props) => confirm(withError(props));
Modal.warning = modalWarn;
Modal.warn = modalWarn;
Modal.confirm = (props) => confirm(withConfirm(props));
Modal.destroyAll = () => {
  while (destroyFns.length) {
    const close = destroyFns.pop();
    if (close) close();
  }
};
Modal.config = modalGlobalConfig;
Modal._InternalPanelDoNotUseOrYouWillBeFired = PurePanel;

export default Modal;

export type {
  AutoFocusButton,
  ClosableConfig,
  ClosableType,
  FocusableConfig,
  MaskConfig,
  MaskType,
  ModalButtonProps,
  ModalFuncProps,
  ModalGetContainer,
  ModalGlobalConfig,
  ModalHookAPI,
  ModalInstance,
  ModalLocale,
  ModalOkType,
  ModalProps,
  ModalPurePanelProps,
  ModalSemanticType,
  ModalType,
  MousePosition,
} from './interface';
export { genModalStyle } from './style';
export type { ComponentToken as ModalComponentToken } from './style/token';
export { prepareComponentToken as prepareModalComponentToken } from './style/token';
export { PurePanel as ModalPurePanel };
