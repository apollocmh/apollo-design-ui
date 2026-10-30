import {
  compactAlgorithm,
  darkAlgorithm,
  getDesignToken,
  transformToken,
} from '@apollo-design/theme';
import { createSSRApp, defineComponent, h, nextTick, reactive, ref } from 'vue';
import { Button } from '../../../button';
import { genButtonStyle } from '../../../button/style';
import ConfigProvider from '../../../config-provider';
import { genProgressStyle } from '../../../progress/style';
import TokenDemo from '../../demo/component-token.vue';
import { Upload, UploadDragger } from '../../index';
import { genUploadStyle } from '../../style';

export function createFixture() {
  const state = reactive({ disabled: false, override: false, native: false, mode: 'default' });
  const files = ref([]);
  const upload = ref(null);
  const dragger = ref(null);
  const requests = [];
  const changes = [];
  const aborted = [];
  const warnings = [];
  const errors = [];
  const algorithm = () =>
    state.mode === 'dark'
      ? darkAlgorithm
      : state.mode === 'compact'
        ? compactAlgorithm
        : state.mode === 'dark-compact'
          ? [darkAlgorithm, compactAlgorithm]
          : undefined;
  const theme = () => ({
    algorithm: algorithm(),
    components: state.override
      ? { Upload: { pictureCardSize: 144, actionsColor: '#123456' } }
      : undefined,
  });
  const request = (option, info) => {
    requests.push({ option, defaultAvailable: typeof info.defaultRequest === 'function' });
    return { abort: () => aborted.push(option.file.name) };
  };
  const App = defineComponent({
    setup: () => () =>
      h(
        ConfigProvider,
        { theme: theme() },
        {
          default: () => [
            h('section', { id: 'main', style: { width: '380px' } }, [
              h(
                Upload,
                {
                  ref: upload,
                  fileList: files.value,
                  listType: 'picture-card',
                  'onUpdate:fileList': (value) => {
                    files.value = value;
                  },
                  onChange: (info) => changes.push(info.file.status),
                  beforeUpload: (file) =>
                    new File([file], `processed-${file.name}`, { type: file.type }),
                  customRequest: request,
                  style: state.native
                    ? { '--apollo-upload-picture-card-size': '160px' }
                    : undefined,
                  onPreview: () => {},
                },
                {
                  default: () => h(Button, { 'aria-label': 'Choose file' }, () => 'Upload'),
                  extra: () => 0,
                },
              ),
            ]),
            h('section', { id: 'drag' }, [
              h(
                UploadDragger,
                {
                  ref: dragger,
                  disabled: state.disabled,
                  pastable: true,
                  accept: '.txt',
                  customRequest: request,
                  'aria-label': 'Drop text file',
                },
                () => 'Drop text',
              ),
            ]),
            h('section', { id: 'demo' }, [h(TokenDemo)]),
          ],
        },
      ),
  });
  const app = createSSRApp(App);
  app.config.warnHandler = (message) => warnings.push(message);
  app.config.errorHandler = (error) => errors.push(String(error));
  return {
    app,
    state,
    files,
    requests,
    changes,
    aborted,
    warnings,
    errors,
    set: async (patch) => {
      Object.assign(state, patch);
      await nextTick();
      await nextTick();
    },
    refValid: () =>
      upload.value.nativeElement === document.querySelector('#main .apollo-upload-wrapper') &&
      dragger.value.upload.getInputRef() === document.querySelector('#drag input'),
    finish: () => requests[0].option.onSuccess({ ok: true }),
    progress: () => requests[0].option.onProgress({ percent: 47.5 }),
    fail: () => requests.at(-1).option.onError(new Error('local upload failed')),
    css: () =>
      `${Object.entries(transformToken(getDesignToken()).vars)
        .map(([name, value]) => `${name}:${value}`)
        .join(';')}`,
    token: () => getDesignToken({ algorithm: algorithm() }),
    unmount: () => app.unmount(),
  };
}
export const css = () => `${genUploadStyle()}\n${genButtonStyle('apollo')}\n${genProgressStyle()}`;
