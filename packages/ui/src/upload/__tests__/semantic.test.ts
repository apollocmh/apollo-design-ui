/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— Upload 家族
 *
 * 基准：`tests/compat/baselines/upload.dom.json`（机械 oracle，20 个用例，
 * 产出者 `tests/compat/baseline/upload.mjs`）。`keepStyle: true`。
 *
 * ⚠️ hash/css-var 类由 dom-contract 统一过滤器剥除（D1/D5）。
 * React 19 的缩略图 `<link rel=preload>` 提升为平台产物，已在生成器剥除。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { defineComponent, h, provide } from 'vue';
import baseline from '../../../../../tests/compat/baselines/upload.dom.json';
import {
  type ConfigContextValue,
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
} from '../../config-provider/context';
import { Upload, UploadDragger } from '../index';
import type { UploadFile } from '../interface';

const BP = { prefixCls: 'apollo-upload' };

const doneFile: UploadFile = { uid: '1', name: 'a.txt', status: 'done' };
const urlFile: UploadFile = { uid: '2', name: 'b.png', status: 'done', url: 'http://x/b.png' };
const errFile: UploadFile = { uid: '3', name: 'c.txt', status: 'error' };
const upFile: UploadFile = { uid: '4', name: 'd.txt', status: 'uploading', percent: 50 };

/** 用例规格表：id → Vue 侧渲染产物。必须覆盖基线里的每一个用例。 */
const specs: Record<string, { render: () => DomRenderResult }> = {
  'upload:basic': {
    render: () => h(Upload, { ...BP, action: '/u' } as never, { default: () => 'upload' }),
  },
  'upload:no-children': { render: () => h(Upload, { ...BP, action: '/u' } as never) },
  'upload:accept': {
    render: () =>
      h(Upload, { ...BP, action: '/u', accept: '.jpg,image/*' } as never, { default: () => 'x' }),
  },
  'upload:directory': {
    render: () =>
      h(Upload, { ...BP, action: '/u', directory: true } as never, { default: () => 'x' }),
  },
  'upload:multiple': {
    render: () =>
      h(Upload, { ...BP, action: '/u', multiple: true } as never, { default: () => 'x' }),
  },
  'upload:capture': {
    render: () =>
      h(Upload, { ...BP, action: '/u', capture: 'user' } as never, { default: () => 'x' }),
  },
  'upload:disabled': {
    render: () =>
      h(Upload, { ...BP, action: '/u', disabled: true } as never, { default: () => 'x' }),
  },

  'upload:list-text': {
    render: () =>
      h(Upload, { ...BP, action: '/u', defaultFileList: [doneFile] } as never, {
        default: () => 'x',
      }),
  },
  'upload:list-text-mixed': {
    render: () =>
      h(
        Upload,
        {
          ...BP,
          action: '/u',
          defaultFileList: [doneFile, urlFile, errFile, upFile],
        } as never,
        { default: () => 'x' },
      ),
  },
  'upload:list-show-false': {
    render: () =>
      h(
        Upload,
        {
          ...BP,
          action: '/u',
          showUploadList: false,
          defaultFileList: [doneFile],
        } as never,
        { default: () => 'x' },
      ),
  },
  'upload:list-err-removed-icon': {
    render: () =>
      h(
        Upload,
        {
          ...BP,
          action: '/u',
          defaultFileList: [doneFile],
          showUploadList: { showRemoveIcon: false, showPreviewIcon: false },
        } as never,
        { default: () => 'x' },
      ),
  },
  'upload:list-download-icon': {
    render: () =>
      h(
        Upload,
        {
          ...BP,
          action: '/u',
          defaultFileList: [doneFile],
          showUploadList: { showDownloadIcon: true },
        } as never,
        { default: () => 'x' },
      ),
  },

  'upload:list-picture': {
    render: () =>
      h(Upload, { ...BP, action: '/u', listType: 'picture', defaultFileList: [urlFile] } as never, {
        default: () => 'x',
      }),
  },
  'upload:picture-card': {
    render: () =>
      h(
        Upload,
        { ...BP, action: '/u', listType: 'picture-card', defaultFileList: [urlFile] } as never,
        {
          default: () => 'card',
        },
      ),
  },
  'upload:picture-circle': {
    render: () =>
      h(
        Upload,
        { ...BP, action: '/u', listType: 'picture-circle', defaultFileList: [urlFile] } as never,
        {
          default: () => 'cir',
        },
      ),
  },
  'upload:picture-card-empty': {
    render: () =>
      h(Upload, { ...BP, action: '/u', listType: 'picture-card' } as never, {
        default: () => 'card',
      }),
  },

  'upload:drag': {
    render: () =>
      h(Upload, { ...BP, action: '/u', type: 'drag' } as never, { default: () => 'drag here' }),
  },
  'upload:drag-disabled': {
    render: () =>
      h(Upload, { ...BP, action: '/u', type: 'drag', disabled: true } as never, {
        default: () => 'drag',
      }),
  },

  'upload:semantic': {
    render: () =>
      h(
        Upload,
        {
          ...BP,
          action: '/u',
          classNames: { root: 'cls-root', list: 'cls-list', trigger: 'cls-trigger' },
          styles: { root: { width: '200px' } },
          defaultFileList: [doneFile],
        } as never,
        { default: () => 'x' },
      ),
  },
};

domContractTest('Upload', {
  baseline,
  keepStyle: true,
  allow: {},
  render: (id) => {
    if (id === 'upload:rtl') {
      // 方向由 ConfigProvider 注入（同 input/input-number 范式）
      return defineComponent({
        name: 'AUploadRtlProbe',
        setup() {
          provide(configContextKey, {
            ...DEFAULT_CONFIG_CONTEXT,
            direction: 'rtl',
          } as ConfigContextValue);
          return () =>
            h(Upload, { ...BP, action: '/u', defaultFileList: [doneFile] } as never, {
              default: () => 'x',
            });
        },
      });
    }
    const spec = specs[id];
    if (!spec)
      throw new Error(`[Upload L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    return spec.render();
  },
});

// UploadDragger 冒烟挂载（避免未使用导入）
export const _draggerSmoke = UploadDragger;
