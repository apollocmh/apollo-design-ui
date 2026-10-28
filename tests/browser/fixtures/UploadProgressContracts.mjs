import { ConfigProvider, Progress, Upload, UploadDragger } from '@apollo-design/ui';
import { createApp, h, nextTick, ref } from 'vue';

const baseFile = (id, extra = {}) => ({
  uid: id,
  name: `${id}.txt`,
  status: 'uploading',
  percent: 55.5,
  'aria-label': `File ${id}`,
  ...extra,
});
const trigger = () => h('button', { type: 'button' }, 'Choose file');
const upload = (id, progress, extra = {}, fileExtra = {}) =>
  h(
    Upload,
    {
      fileList: [baseFile(id, fileExtra)],
      ...(progress === undefined ? {} : { progress }),
      ...extra,
    },
    { default: trigger },
  );
const progress = (props = {}) =>
  h(Progress, { type: 'line', status: 'normal', showInfo: false, percent: 55.5, ...props });
const dynamicProgress = ref(undefined);
const dynamicFile = ref(baseFile('dynamic'));
const dynamicShow = ref(true);
const dynamicMount = ref(true);
const providerConfig = ref({
  upload: {
    progress: {
      strokeColor: '#722ed1',
      strokeWidth: '4px',
      size: 'default',
      'aria-label': 'Provider progress',
    },
  },
});
const providerDirection = ref('ltr');
const dynamicGeneration = ref(0);
const request = ref(null);
const uploadEvents = [];
const cases = [
  ['upload-default', () => upload('default')],
  ['upload-empty-config', () => upload('empty', {})],
  ['upload-stroke-number', () => upload('stroke-number', { strokeWidth: 4 })],
  ['upload-stroke-string', () => upload('stroke-string', { strokeWidth: '4px' })],
  ['upload-stroke-rem', () => upload('stroke-rem', { strokeWidth: '0.25rem' })],
  ['upload-size-small', () => upload('size-small', { size: 'small' })],
  ['upload-size-default', () => upload('size-default', { size: 'default' })],
  ['upload-size-number', () => upload('size-number', { size: 24 })],
  ['upload-size-tuple', () => upload('size-tuple', { size: [180, 5] })],
  ['upload-size-priority', () => upload('size-priority', { size: [180, 5], strokeWidth: '9px' })],
  ['upload-solid', () => upload('solid', { strokeColor: '#722ed1', strokeWidth: '4px' })],
  [
    'upload-gradient-stops',
    () =>
      upload('stops', { strokeColor: { '100%': '#87d068', '0%': '#108ee9' }, strokeWidth: '4px' }),
  ],
  [
    'upload-gradient-from-to',
    () =>
      upload('from-to', { strokeColor: { from: '#108ee9', to: '#87d068' }, strokeWidth: '4px' }),
  ],
  ['upload-info-true', () => upload('info-true', { showInfo: true, strokeWidth: '4px' })],
  [
    'upload-aria-precedence',
    () =>
      upload(
        'aria',
        {
          strokeWidth: '4px',
          'aria-label': 'Config progress',
          'aria-labelledby': 'config-heading',
        },
        {},
        { 'aria-labelledby': 'file-heading' },
      ),
  ],
  ['upload-percent-zero', () => upload('zero', { strokeWidth: '4px' }, {}, { percent: 0 })],
  [
    'upload-percent-undefined',
    () => upload('undefined', { strokeWidth: '4px' }, {}, { percent: undefined }),
  ],
  [
    'upload-percent-absent',
    () => {
      const file = baseFile('absent');
      delete file.percent;
      return h(Upload, { fileList: [file] }, { default: trigger });
    },
  ],
  [
    'upload-percent-negative',
    () => upload('negative', { strokeWidth: '4px' }, {}, { percent: -10 }),
  ],
  [
    'upload-percent-overflow',
    () => upload('overflow', { strokeWidth: '4px' }, {}, { percent: 120 }),
  ],
  [
    'upload-percent-hundred',
    () => upload('hundred', { strokeWidth: '4px', showInfo: true }, {}, { percent: 100 }),
  ],
  ['upload-status-done', () => upload('done', { strokeWidth: '4px' }, {}, { status: 'done' })],
  ['upload-status-error', () => upload('error', { strokeWidth: '4px' }, {}, { status: 'error' })],
  [
    'upload-hidden-list',
    () => upload('hidden-list', { strokeWidth: '4px' }, { showUploadList: false }),
  ],
  [
    'upload-item-slot',
    () =>
      h(
        Upload,
        { fileList: [baseFile('item-slot')], progress: { strokeWidth: '4px' } },
        { default: trigger, itemRender: () => h('span', { 'data-item-slot': '' }, 'Custom row') },
      ),
  ],
  ...['picture', 'picture-card', 'picture-circle'].map((listType) => [
    `upload-${listType}`,
    () => upload(listType, { strokeWidth: '4px' }, { listType }),
  ]),
  [
    'upload-dragger',
    () =>
      h(
        UploadDragger,
        { fileList: [baseFile('dragger')], progress: { strokeWidth: '4px' } },
        { default: trigger },
      ),
  ],
  [
    'upload-provider',
    () =>
      h(
        ConfigProvider,
        { components: providerConfig.value, direction: providerDirection.value },
        { default: () => upload('provider', { showInfo: true, 'aria-label': 'Local progress' }) },
      ),
  ],
  [
    'upload-custom-prefix',
    () =>
      h(
        ConfigProvider,
        { prefixCls: 'custom' },
        { default: () => upload('custom-prefix', { strokeWidth: '4px' }) },
      ),
  ],
  [
    'upload-dynamic',
    () =>
      dynamicMount.value
        ? h(
            Upload,
            {
              key: dynamicGeneration.value,
              fileList: [dynamicFile.value],
              progress: dynamicProgress.value,
              showUploadList: dynamicShow.value,
            },
            { default: trigger },
          )
        : null,
  ],
  [
    'upload-uncontrolled',
    () =>
      h(
        Upload,
        {
          defaultFileList: [],
          customRequest: (options) => {
            request.value = options;
            return { abort: () => uploadEvents.push('abort') };
          },
          onChange: (info) =>
            uploadEvents.push({ status: info.file.status, percent: info.file.percent }),
        },
        { default: trigger },
      ),
  ],
  ['progress-default-two', () => progress({ size: [-1, 2] })],
  ['progress-stroke-number', () => progress({ strokeWidth: 4 })],
  ['progress-size-small', () => progress({ size: 'small' })],
  ['progress-size-default', () => progress({ size: 'default' })],
  ['progress-size-number', () => progress({ size: 24 })],
  ['progress-size-tuple', () => progress({ size: [180, 5] })],
  [
    'progress-string-adapter',
    () => progress({ styles: { rail: { height: '0.25rem' }, track: { height: '0.25rem' } } }),
  ],
  [
    'progress-gradient-stops',
    () => progress({ strokeColor: { '100%': '#87d068', '0%': '#108ee9' }, size: [-1, 4] }),
  ],
  ['progress-info', () => progress({ showInfo: true })],
  ['progress-aria-fraction', () => progress({ 'aria-label': 'Direct progress' })],
  ['progress-hundred-auto', () => h(Progress, { percent: 100, showInfo: true, size: [-1, 4] })],
  ['progress-hundred-normal', () => progress({ percent: 100, showInfo: true, size: [-1, 4] })],
];
const app = createApp({
  render: () =>
    h(
      'main',
      { style: { width: '760px', padding: '16px' } },
      cases.map(([name, render]) =>
        h(
          'section',
          {
            'data-case': name,
            key: name,
            style: {
              width: '470px',
              minHeight: '110px',
              padding: '12px',
              border: '1px solid #ddd',
              marginBlockEnd: '12px',
            },
          },
          [
            h(
              'h2',
              {
                id: name === 'upload-aria-precedence' ? 'config-heading' : undefined,
                style: { fontSize: '14px', margin: '0 0 10px' },
              },
              name,
            ),
            h('div', { 'data-host': '', style: { width: '440px' } }, [render()]),
          ],
        ),
      ),
    ),
});
app.mount('#app');
window.uploadProgressProbe = {
  async setProgress(value) {
    dynamicProgress.value = value;
    await nextTick();
  },
  async setFile(value) {
    dynamicFile.value = value;
    await nextTick();
  },
  async patchFile(patch) {
    dynamicFile.value = { ...dynamicFile.value, ...patch };
    await nextTick();
  },
  async setShow(value) {
    dynamicShow.value = value;
    await nextTick();
  },
  async setMount(value) {
    dynamicMount.value = value;
    if (value) dynamicGeneration.value++;
    await nextTick();
  },
  async setProvider(value) {
    providerConfig.value = value;
    await nextTick();
  },
  async setDirection(value) {
    providerDirection.value = value;
    await nextTick();
  },
  requestProgress(percent) {
    if (!request.value) throw new Error('Missing custom request');
    request.value.onProgress?.({ percent });
  },
  requestSuccess() {
    if (!request.value) throw new Error('Missing custom request');
    request.value.onSuccess?.({ ok: true });
  },
  events: uploadEvents,
  unmount() {
    app.unmount();
  },
};
window.uploadProgressMounted = true;
