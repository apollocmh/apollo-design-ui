/** UPLOAD-PROGRESS-20261029: public progress options must reach the actual bar. */
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { ConfigProvider } from '../../config-provider';
import CustomProgressDemo from '../demo/customize-progress-bar.vue';
import { Upload, UploadDragger } from '../index';
import type { UploadFile, UploadListProgressProps, UploadProps } from '../interface';

const trigger = () => h('button', { type: 'button' }, 'Choose file');
const uploading = (extra: Partial<UploadFile> = {}): UploadFile => ({
  uid: 'progress',
  name: 'report.txt',
  status: 'uploading',
  percent: 55.5,
  'aria-label': 'File progress',
  ...extra,
});
const reveal = async () => {
  await vi.advanceTimersByTimeAsync(350);
  await nextTick();
};
const mountUpload = async (props: UploadProps = {}) => {
  const wrapper = mount(Upload, {
    props: { fileList: [uploading()], ...props },
    slots: { default: trigger },
    attachTo: document.body,
  });
  await reveal();
  return wrapper;
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('Upload progress · complete public presentation options', () => {
  it.each<UploadListProgressProps | undefined>([
    undefined,
    {},
    { strokeColor: '#722ed1' },
    { showInfo: true },
    { 'aria-label': 'Upload progress' },
  ])('keeps a full-width 2px default for partial configuration %j', async (progress) => {
    const wrapper = await mountUpload({ progress });
    expect(wrapper.get<HTMLElement>('.apollo-progress-body').element.style.width).toBe('100%');
    expect(wrapper.get<HTMLElement>('.apollo-progress-rail').element.style.height).toBe('2px');
    expect(wrapper.get<HTMLElement>('.apollo-progress-track').element.style.height).toBe('2px');
  });

  it.each<{ progress: UploadListProgressProps; width: string; height: string }>([
    { progress: { strokeWidth: 4 }, width: '100%', height: '4px' },
    { progress: { strokeWidth: '4px' }, width: '100%', height: '4px' },
    { progress: { strokeWidth: '0.25rem' }, width: '100%', height: '0.25rem' },
    { progress: { size: 'small' }, width: '100%', height: '6px' },
    { progress: { size: 'default' }, width: '100%', height: '8px' },
    { progress: { size: 24 }, width: '24px', height: '24px' },
    { progress: { size: [180, 5] }, width: '180px', height: '5px' },
    { progress: { size: [180, 5], strokeWidth: '9px' }, width: '180px', height: '5px' },
    { progress: { size: 24, strokeWidth: 9 }, width: '24px', height: '24px' },
    { progress: { size: 'small', strokeWidth: 4 }, width: '100%', height: '4px' },
    { progress: { size: 'default', strokeWidth: '0.25rem' }, width: '100%', height: '0.25rem' },
  ])('consumes dimensions and priority: $progress', async ({ progress, width, height }) => {
    const wrapper = await mountUpload({ progress });
    expect(wrapper.get<HTMLElement>('.apollo-progress-body').element.style.width).toBe(width);
    expect(wrapper.get<HTMLElement>('.apollo-progress-rail').element.style.height).toBe(height);
    expect(wrapper.get<HTMLElement>('.apollo-progress-track').element.style.height).toBe(height);
  });

  it.each<NonNullable<UploadListProgressProps['strokeColor']>>([
    { from: '#108ee9', to: '#87d068' },
    { '100%': '#87d068', '0%': '#108ee9' },
  ])('uses the real Progress gradient implementation: %j', async (strokeColor) => {
    const wrapper = await mountUpload({ progress: { strokeColor } });
    expect(wrapper.get<HTMLElement>('.apollo-progress-track').element.style.background).toContain(
      'linear-gradient(to right',
    );
  });

  it('shows current information, toggles it, and waits for upload completion at 100%', async () => {
    const wrapper = await mountUpload({ progress: { showInfo: true } });
    expect(wrapper.get('.apollo-progress-indicator').text()).toBe('55.5%');
    await wrapper.setProps({ fileList: [uploading({ percent: 100 })] });
    expect(wrapper.get('.apollo-progress-indicator').text()).toBe('100%');
    expect(wrapper.get('[role="progressbar"]').classes()).toContain(
      'apollo-progress-status-normal',
    );
    await wrapper.setProps({ progress: { showInfo: false } });
    expect(wrapper.find('.apollo-progress-indicator').exists()).toBe(false);
    await wrapper.setProps({ fileList: [uploading({ status: 'done', percent: 100 })] });
    // jsdom has no CSS animationend; exercise the existing 2000ms leave deadline.
    await vi.advanceTimersByTimeAsync(2100);
    expect(wrapper.find('[role="progressbar"]').exists()).toBe(false);
  });

  it('names the actual bar from the file, then the current configuration', async () => {
    const wrapper = await mountUpload({
      fileList: [uploading({ 'aria-labelledby': 'file-title' })],
    });
    expect(wrapper.get('[role="progressbar"]').attributes('aria-label')).toBe('File progress');
    expect(wrapper.get('[role="progressbar"]').attributes('aria-labelledby')).toBe('file-title');
    await wrapper.setProps({
      progress: { 'aria-label': 'Configured progress', 'aria-labelledby': 'config-title' },
    });
    expect(wrapper.get('[role="progressbar"]').attributes('aria-label')).toBe(
      'Configured progress',
    );
    expect(wrapper.get('[role="progressbar"]').attributes('aria-labelledby')).toBe('config-title');
    await wrapper.setProps({ progress: undefined });
    expect(wrapper.get('[role="progressbar"]').attributes('aria-label')).toBe('File progress');
    expect(wrapper.get('[role="progressbar"]').attributes('aria-labelledby')).toBe('file-title');
  });

  it('uses the associated file name when optional ARIA names are absent', async () => {
    const wrapper = await mountUpload({
      fileList: [uploading({ 'aria-label': undefined })],
    });
    expect(wrapper.get('[role="progressbar"]').attributes('aria-label')).toBe('report.txt');
  });

  it('replaces and clears all options without retaining old paint, dimensions or names', async () => {
    const wrapper = await mountUpload({
      progress: { strokeWidth: '4px', strokeColor: '#722ed1', showInfo: true, 'aria-label': 'Old' },
    });
    await wrapper.setProps({
      fileList: [uploading({ percent: 72.25 })],
      progress: { size: [180, 5], strokeColor: { '100%': '#87d068', '0%': '#108ee9' } },
    });
    expect(wrapper.get<HTMLElement>('.apollo-progress-body').element.style.width).toBe('180px');
    expect(wrapper.get<HTMLElement>('.apollo-progress-rail').element.style.height).toBe('5px');
    expect(wrapper.get<HTMLElement>('.apollo-progress-track').element.style.background).toContain(
      'linear-gradient',
    );
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('72.25');
    expect(wrapper.get('[role="progressbar"]').attributes('aria-label')).toBe('File progress');
    expect(wrapper.find('.apollo-progress-indicator').exists()).toBe(false);
    await wrapper.setProps({ progress: { strokeWidth: '0.5rem' } });
    await wrapper.setProps({ progress: undefined });
    expect(wrapper.get<HTMLElement>('.apollo-progress-body').element.style.width).toBe('100%');
    expect(wrapper.get<HTMLElement>('.apollo-progress-rail').element.style.height).toBe('2px');
    expect(wrapper.get<HTMLElement>('.apollo-progress-track').element.style.height).toBe('2px');
    expect(
      wrapper.get<HTMLElement>('.apollo-progress-track').element.style.background,
    ).not.toContain('linear-gradient');
  });
});

describe('Upload progress · related reactive and lifecycle paths', () => {
  it('hydrates its delayed bar without replacing the existing trigger or leaking the mount timer', async () => {
    const component = defineComponent({
      setup: () => () => h(Upload, { fileList: [uploading()] }, { default: trigger }),
    });
    const container = document.createElement('div');
    container.innerHTML = await renderToString(createSSRApp(component));
    document.body.append(container);
    const button = container.querySelector('button');
    expect(container.querySelector('[role="progressbar"]')).toBeNull();
    const warnings = vi.spyOn(console, 'warn');
    const errors = vi.spyOn(console, 'error');
    const app = createSSRApp(component);
    try {
      app.mount(container);
      await reveal();
      expect(container.querySelector('button')).toBe(button);
      expect(container.querySelector<HTMLElement>('.apollo-progress-rail')?.style.height).toBe(
        '2px',
      );
      expect(warnings).not.toHaveBeenCalled();
      expect(errors).not.toHaveBeenCalled();
    } finally {
      app.unmount();
      container.remove();
      warnings.mockRestore();
      errors.mockRestore();
    }
    await reveal();
    expect(container.childElementCount).toBe(0);
  });

  it('shows the actual numeric thickness and information in the public progress demo', async () => {
    const wrapper = mount(CustomProgressDemo);
    await reveal();
    expect(wrapper.get<HTMLElement>('.apollo-progress-rail').element.style.height).toBe('4px');
    expect(wrapper.get('.apollo-progress-indicator').text()).toBe('30%');
    await vi.advanceTimersByTimeAsync(500);
    expect(wrapper.get('.apollo-progress-indicator').text()).toBe('40%');
  });

  it('reads current Provider fields with local precedence, prefix and RTL', async () => {
    const configured = ref<UploadListProgressProps | undefined>({
      strokeWidth: '4px',
      strokeColor: '#722ed1',
      'aria-label': 'Provider',
    });
    const local = ref<UploadListProgressProps | undefined>({
      showInfo: true,
      'aria-label': 'Local',
    });
    const direction = ref<'ltr' | 'rtl'>('ltr');
    const prefixCls = ref('apollo');
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            {
              components: { upload: { progress: configured.value } },
              direction: direction.value,
              prefixCls: prefixCls.value,
            },
            {
              default: () =>
                h(Upload, { fileList: [uploading()], progress: local.value }, { default: trigger }),
            },
          ),
      }),
      { attachTo: document.body, global: { stubs: { teleport: false } } },
    );
    await reveal();
    expect(wrapper.get('[role="progressbar"]').attributes('aria-label')).toBe('Local');
    expect(wrapper.get('.apollo-progress-indicator').text()).toBe('55.5%');
    expect(wrapper.get<HTMLElement>('.apollo-progress-rail').element.style.height).toBe('4px');
    const triggerElement = wrapper.get('button').element;
    configured.value = {
      size: [160, 3],
      strokeColor: { from: '#108ee9', to: '#87d068' },
      'aria-label': 'New provider',
    };
    local.value = undefined;
    direction.value = 'rtl';
    await nextTick();
    expect(wrapper.get('button').element).toBe(triggerElement);
    await reveal();
    expect(wrapper.get('[role="progressbar"]').attributes('aria-label')).toBe('New provider');
    expect(wrapper.get<HTMLElement>('.apollo-progress-body').element.style.width).toBe('160px');
    expect(wrapper.get<HTMLElement>('.apollo-progress-rail').element.style.height).toBe('3px');
    expect(wrapper.get<HTMLElement>('.apollo-progress-track').element.style.background).toContain(
      'to left',
    );
    expect(wrapper.get('[role="progressbar"]').classes()).toContain('apollo-progress-rtl');
    configured.value = undefined;
    prefixCls.value = 'custom';
    await nextTick();
    await reveal();
    expect(wrapper.get('[role="progressbar"]').classes()).toContain('custom-progress');
    expect(wrapper.get<HTMLElement>('.custom-progress-rail').element.style.height).toBe('2px');
    expect(wrapper.get('[role="progressbar"]').attributes('aria-label')).toBe('File progress');
  });

  it.each(['text', 'picture', 'picture-card', 'picture-circle'] satisfies NonNullable<
    UploadProps['listType']
  >[])('uses the same actual bar in %s lists', async (listType) => {
    const wrapper = await mountUpload({ listType });
    expect(wrapper.findAll('[role="progressbar"]')).toHaveLength(1);
    expect(wrapper.get<HTMLElement>('.apollo-progress-rail').element.style.height).toBe('2px');
  });

  it('keeps the shared list path in Dragger', async () => {
    const wrapper = mount(UploadDragger, {
      attrs: { fileList: [uploading()], progress: { strokeWidth: 4, showInfo: true } },
      slots: { default: trigger },
    });
    await reveal();
    expect(wrapper.get<HTMLElement>('.apollo-progress-rail').element.style.height).toBe('4px');
    expect(wrapper.get('.apollo-progress-indicator').text()).toBe('55.5%');
  });

  it.each([
    0,
    55.5,
    -10,
    120,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    undefined,
  ])('keeps the file percent authoritative and normalizes %s', async (percent) => {
    const wrapper = await mountUpload({ fileList: [uploading({ percent })] });
    const expected =
      Number.isFinite(percent) && typeof percent === 'number'
        ? Math.min(100, Math.max(0, percent))
        : 0;
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe(String(expected));
    expect(wrapper.get<HTMLElement>('.apollo-progress-track').element.style.width).toBe(
      `${expected}%`,
    );
  });

  it('omits absent percent and responds when the field returns', async () => {
    const file: UploadFile = { uid: 'progress', name: 'report.txt', status: 'uploading' };
    const wrapper = await mountUpload({ fileList: [file] });
    expect(wrapper.find('[role="progressbar"]').exists()).toBe(false);
    await wrapper.setProps({ fileList: [{ ...file, percent: 0 }] });
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('0');
  });

  it('preserves delay, focus, independent instances and repeated list/mount cycles', async () => {
    const mounted = ref(true);
    const visible = ref(true);
    const progress = ref<UploadListProgressProps>({ strokeWidth: '4px' });
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h('div', [
            mounted.value
              ? h(
                  Upload,
                  {
                    fileList: [uploading()],
                    showUploadList: visible.value,
                    progress: progress.value,
                  },
                  { default: trigger },
                )
              : null,
            h(
              Upload,
              { fileList: [uploading({ uid: 'other', percent: 20 })] },
              { default: trigger },
            ),
          ]),
      }),
      { attachTo: document.body },
    );
    const button = wrapper.get<HTMLButtonElement>('button').element;
    button.focus();
    await vi.advanceTimersByTimeAsync(299);
    expect(wrapper.findAll('[role="progressbar"]')).toHaveLength(0);
    await reveal();
    expect(document.activeElement).toBe(button);
    expect(wrapper.findAll('[role="progressbar"]')).toHaveLength(2);
    progress.value = { size: [150, 5], showInfo: true };
    await nextTick();
    expect(
      wrapper
        .findAll<HTMLElement>('.apollo-progress-rail')
        .map((node) => node.element.style.height),
    ).toEqual(['5px', '2px']);
    for (let iteration = 0; iteration < 2; iteration += 1) {
      visible.value = false;
      await nextTick();
      expect(wrapper.findAll('[role="progressbar"]')).toHaveLength(1);
      visible.value = true;
      await nextTick();
      await reveal();
      expect(wrapper.findAll('[role="progressbar"]')).toHaveLength(2);
      mounted.value = false;
      await nextTick();
      expect(wrapper.findAll('[role="progressbar"]')).toHaveLength(1);
      mounted.value = true;
      await nextTick();
      await reveal();
      expect(wrapper.findAll('[role="progressbar"]')).toHaveLength(2);
    }
    wrapper.unmount();
    await reveal();
    expect(document.querySelectorAll('[role="progressbar"]')).toHaveLength(0);
  });

  it('allows a whole-row slot to own the content and reacts when it is removed', async () => {
    const custom = ref(true);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Upload,
            { fileList: [uploading()] },
            {
              default: trigger,
              ...(custom.value ? { itemRender: () => h('span', 'Custom file row') } : {}),
            },
          ),
      }),
    );
    await reveal();
    expect(wrapper.find('[role="progressbar"]').exists()).toBe(false);
    custom.value = false;
    await nextTick();
    expect(wrapper.get<HTMLElement>('.apollo-progress-rail').element.style.height).toBe('2px');
  });

  it('renders non-controlled custom request progress and clears it after success', async () => {
    let request: Parameters<NonNullable<UploadProps['customRequest']>>[0] | undefined;
    const changes: { status: UploadFile['status']; percent: number | undefined }[] = [];
    const wrapper = await mountUpload({
      fileList: undefined,
      defaultFileList: [],
      progress: { showInfo: true },
      customRequest: (options) => {
        request = options;
      },
      onChange: (info) => changes.push({ status: info.file.status, percent: info.file.percent }),
    });
    const input = wrapper.get<HTMLInputElement>('input[type="file"]');
    Object.defineProperty(input.element, 'files', {
      value: [new File(['data'], 'request.txt')],
      configurable: true,
    });
    await input.trigger('change');
    await reveal();
    if (!request) throw new Error('Expected the selected file to start the custom request');
    request.onProgress?.({ percent: 63.5 });
    await nextTick();
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('63.5');
    expect(wrapper.get('.apollo-progress-indicator').text()).toBe('63.5%');
    expect(wrapper.get<HTMLElement>('.apollo-progress-rail').element.style.height).toBe('2px');
    request.onSuccess?.({ ok: true });
    await vi.advanceTimersByTimeAsync(2100);
    expect(wrapper.find('[role="progressbar"]').exists()).toBe(false);
    expect(changes).toEqual([
      { status: 'uploading', percent: 0 },
      { status: 'uploading', percent: 63.5 },
      { status: 'done', percent: 100 },
    ]);
  });
});
