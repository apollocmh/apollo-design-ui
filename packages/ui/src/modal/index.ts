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
export const Modal = Object.assign(withInstall(ModalComponent), {
  useModal,
  info: (props: Parameters<typeof confirm>[0]) => confirm(withInfo(props)),
  success: (props: Parameters<typeof confirm>[0]) => confirm(withSuccess(props)),
  error: (props: Parameters<typeof confirm>[0]) => confirm(withError(props)),
  warning: modalWarn,
  warn: modalWarn,
  confirm: (props: Parameters<typeof confirm>[0]) => confirm(withConfirm(props)),
  destroyAll() {
    while (destroyFns.length) destroyFns.pop()?.();
  },
  config: modalGlobalConfig,
  _InternalPanelDoNotUseOrYouWillBeFired: PurePanel,
});

export default Modal;

export type {
  AutoFocusButton,
  ClosableConfig,
  ClosableType,
  FocusableConfig,
  MaskConfig,
  MaskType,
  ModalAction,
  ModalButtonProps,
  ModalClosableConfig,
  ModalClose,
  ModalEmits,
  ModalFooterExtra,
  ModalFuncProps,
  ModalGetContainer,
  ModalGlobalConfig,
  ModalHookAPI,
  ModalHookInstance,
  ModalInstance,
  ModalLocale,
  ModalOkType,
  ModalPanelRef,
  ModalProps,
  ModalPurePanelProps,
  ModalRenderSlotProps,
  ModalSemanticType,
  ModalSlots,
  ModalType,
  MousePosition,
} from './interface';
export { genModalStyle } from './style';
export type { ComponentToken as ModalComponentToken } from './style/token';
export { prepareComponentToken as prepareModalComponentToken } from './style/token';
export { PurePanel as ModalPurePanel };
