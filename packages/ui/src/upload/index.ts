/**
 * Upload 的公共导出。
 *
 * 与 antd 的 `es/upload/index.js` 对齐：默认导出 Upload + 静态属性
 * `Upload.Dragger` / `Upload.LIST_IGNORE`；另有具名别名 `UploadDragger`
 * （Vue 模板里没有 `Upload.Dragger` 写法，具名导出是模板唯一可用形态 ——
 * 与 Radio.Form 同判）。
 */

import { withInstall } from '../_internal/with-install';
import { DraggerComponent } from './Dragger';
import { LIST_IGNORE, UploadComponent } from './Upload';

/** Upload 组件。注册名 `AUpload`。 */
export const Upload = withInstall(
  Object.assign(UploadComponent, {
    Dragger: withInstall(DraggerComponent),
    LIST_IGNORE,
  }),
);

/** `Upload.Dragger`（拖拽区域形态）。 */
export const UploadDragger = withInstall(DraggerComponent);

export default Upload;

export type { DraggerProps } from './Dragger';
export type {
  // eslint-disable-next-line @typescript-eslint/no-duplicate-imports -- 分组语义：Dragger 类型独立

  HttpRequestHeader,
  InternalUploadFile,
  ItemRender,
  PreviewFileHandler,
  ShowUploadListInterface,
  UploadChangeParam,
  UploadFile,
  UploadFileStatus,
  UploadListProgressProps,
  UploadListProps,
  UploadListType,
  UploadLocale,
  UploadProps,
  UploadSemanticType,
  UploadType,
} from './interface';
export { LIST_IGNORE, UploadComponent };
