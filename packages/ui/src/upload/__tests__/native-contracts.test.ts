import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import ConfigProvider from '../../config-provider';
import type { UploadRequestOptionLike } from '../engine/request';
import { Upload, UploadDragger } from '../index';
import type { UploadFile, UploadProps } from '../interface';
import { previewImage } from '../utils';
import NativeContracts from './fixtures/NativeContracts.vue';

const mounted: { unmount: () => void }[] = [];
afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount();
  vi.restoreAllMocks();
});

function keep<T extends { unmount: () => void }>(wrapper: T): T {
  mounted.push(wrapper);
  return wrapper;
}

async function pick(wrapper: ReturnType<typeof mount>, files: File[]): Promise<void> {
  const input = wrapper.get('input[type="file"]');
  Object.defineProperty(input.element, 'files', { value: files, configurable: true });
  await input.trigger('change');
  await flushPromises();
}

function deferred<T>() {
  let finish: (value: T) => void = () => {
    throw new Error('deferred not initialized');
  };
  const promise = new Promise<T>((resolve) => {
    finish = resolve;
  });
  return { promise, finish: (value: T) => finish(value) };
}

describe('Upload native contracts', () => {
  it('the real SFC fixture resolves both public constructors and scoped slots', () => {
    const wrapper = keep(mount(NativeContracts));
    expect(wrapper.findAll('input[type="file"]')).toHaveLength(2);
    expect(wrapper.get('.apollo-upload-drag-container').text()).toBe('Drop a file');
  });
  it('capture booleans use native presence semantics', async () => {
    const wrapper = keep(mount(Upload, { props: { capture: false } }));
    expect(wrapper.get('input').attributes('capture')).toBeUndefined();
    await wrapper.setProps({ capture: true });
    expect(wrapper.get('input').attributes('capture')).toBe('');
  });
  it('beforeUpload replacements reach customRequest and defaultRequest is available', async () => {
    const replacement = new File(['changed'], 'changed.txt', { type: 'text/plain' });
    const request = vi.fn<NonNullable<UploadProps['customRequest']>>();
    const wrapper = keep(
      mount(Upload, { props: { beforeUpload: () => replacement, customRequest: request } }),
    );
    await pick(wrapper, [new File(['original'], 'original.txt')]);
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0]?.[0].file).toBe(replacement);
    expect(request.mock.calls[0]?.[1]?.defaultRequest).toBeTypeOf('function');
    expect(wrapper.find('.apollo-upload-list-item-name').text()).toBe('original.txt');
  });

  it('async action failure marks only that file as error and keeps the successful batch member', async () => {
    const request = vi.fn();
    const failure = new Error('cannot resolve action');
    const wrapper = keep(
      mount(Upload, {
        props: {
          multiple: true,
          action: (file) =>
            file.name === 'bad' ? Promise.reject(failure) : Promise.resolve('/local'),
          customRequest: request,
        },
      }),
    );
    await pick(wrapper, [new File(['bad'], 'bad'), new File(['good'], 'good')]);
    expect(request).toHaveBeenCalledTimes(1);
    expect(wrapper.find('.apollo-upload-list-item-error').text()).toContain('bad');
    expect(wrapper.find('.apollo-upload-list-item-error').attributes('title')).toBe(
      failure.message,
    );
    expect(wrapper.find('.apollo-upload-list-item-uploading').text()).toContain('good');
  });

  it('remove proposes a new list without mutating a rejected controlled value', async () => {
    const file: UploadFile = { uid: 'fixed', name: 'fixed.txt', status: 'done' };
    const wrapper = keep(mount(Upload, { props: { fileList: [file] } }));
    await wrapper.get('button[title="Remove file"]').trigger('click');
    await flushPromises();
    expect(file.status).toBe('done');
    expect(wrapper.find('.apollo-upload-list-item-done').exists()).toBe(true);
    expect(wrapper.emitted('update:fileList')?.[0]?.[0]).toEqual([]);
    await wrapper.setProps({ fileList: undefined });
    expect(wrapper.find('.apollo-upload-list-item-done').exists()).toBe(true);
  });

  it('a pending remove cannot remove a replacement with the same uid', async () => {
    const decision = deferred<boolean>();
    const original: UploadFile = { uid: 'fixed', name: 'old.txt', status: 'done' };
    const wrapper = keep(
      mount(Upload, { props: { fileList: [original], onRemove: () => decision.promise } }),
    );
    await wrapper.get('button[title="Remove file"]').trigger('click');
    await wrapper.setProps({ fileList: [{ uid: 'fixed', name: 'new.txt', status: 'done' }] });
    decision.finish(true);
    await flushPromises();
    expect(wrapper.emitted('update:fileList')).toBeUndefined();
    expect(wrapper.text()).toContain('new.txt');
  });

  it('pending preprocessing and late customRequest callbacks stop on unmount', async () => {
    const before = deferred<boolean>();
    const request = vi.fn();
    const change = vi.fn();
    const pending = keep(
      mount(Upload, {
        props: { beforeUpload: () => before.promise, customRequest: request, onChange: change },
      }),
    );
    await pick(pending, [new File(['x'], 'pending')]);
    pending.unmount();
    before.finish(true);
    await flushPromises();
    expect(request).not.toHaveBeenCalled();
    expect(change).not.toHaveBeenCalled();

    let options: UploadRequestOptionLike | undefined;
    const abort = vi.fn();
    const running = keep(
      mount(Upload, {
        props: {
          customRequest: (value) => {
            options = value;
            return { abort };
          },
          onChange: change,
        },
      }),
    );
    await pick(running, [new File(['x'], 'active')]);
    change.mockClear();
    running.unmount();
    options?.onProgress?.({ percent: 50 });
    options?.onSuccess?.({ ok: true });
    expect(abort).toHaveBeenCalledTimes(1);
    expect(change).not.toHaveBeenCalled();
  });

  it('successful synchronous customRequest is settled once and never aborted later', async () => {
    const abort = vi.fn();
    const change = vi.fn();
    const wrapper = keep(
      mount(Upload, {
        props: {
          customRequest: (option) => {
            option.onSuccess?.({ ok: true });
            option.onSuccess?.({ duplicate: true });
            option.onProgress?.({ percent: 1 });
            return { abort };
          },
          onChange: change,
        },
      }),
    );
    await pick(wrapper, [new File(['x'], 'sync')]);
    expect(change).toHaveBeenCalledTimes(2);
    wrapper.unmount();
    expect(abort).not.toHaveBeenCalled();
  });

  it('an asynchronous remove accepts progress updates for the same file and deduplicates confirmation', async () => {
    const decision = deferred<boolean>();
    const remove = vi.fn(() => decision.promise);
    let options: UploadRequestOptionLike | undefined;
    const abort = vi.fn();
    const wrapper = keep(
      mount(Upload, {
        props: {
          onRemove: remove,
          customRequest: (value) => {
            options = value;
            return { abort };
          },
        },
      }),
    );
    await pick(wrapper, [new File(['x'], 'active')]);
    await wrapper.get('button[title="Remove file"]').trigger('click');
    options?.onProgress?.({ percent: 30 });
    await nextTick();
    await wrapper.get('button[title="Remove file"]').trigger('click');
    expect(remove).toHaveBeenCalledTimes(1);
    decision.finish(true);
    await flushPromises();
    expect(wrapper.vm.fileList).toEqual([]);
    expect(abort).toHaveBeenCalledTimes(1);
  });

  it('a rejected remove keeps the list and reaches the Vue error handler once', async () => {
    const failure = new Error('confirmation unavailable');
    const errorHandler = vi.fn();
    const wrapper = keep(
      mount(Upload, {
        props: {
          fileList: [{ uid: 'a', name: 'retained' }],
          onRemove: () => Promise.reject(failure),
        },
        global: { config: { errorHandler } },
      }),
    );
    await wrapper.get('button[title="Remove file"]').trigger('click');
    await flushPromises();
    expect(wrapper.emitted('change')).toBeUndefined();
    expect(errorHandler).toHaveBeenCalledTimes(1);
    expect(errorHandler.mock.calls[0]?.[0]).toBe(failure);
  });

  it('file-list removal aborts the accepted request and ignores its late result', async () => {
    const fileList = ref<UploadFile[]>([]);
    const abort = vi.fn();
    let options: UploadRequestOptionLike | undefined;
    const change = vi.fn();
    const Host = defineComponent({
      setup: () => () =>
        h(Upload, {
          fileList: fileList.value,
          'onUpdate:fileList': (value: UploadFile[]) => {
            fileList.value = value;
          },
          customRequest: (value) => {
            options = value;
            return { abort };
          },
          onChange: change,
        }),
    });
    const wrapper = keep(mount(Host));
    await pick(wrapper, [new File(['x'], 'active')]);
    fileList.value.splice(0);
    await nextTick();
    expect(abort).toHaveBeenCalledTimes(1);
    const previousCalls = change.mock.calls.length;
    options?.onSuccess?.({ late: true });
    expect(change).toHaveBeenCalledTimes(previousCalls);
  });

  it('replacing an active file with the same uid cancels the old request', async () => {
    const abort = vi.fn();
    const wrapper = keep(mount(Upload, { props: { customRequest: () => ({ abort }) } }));
    await pick(wrapper, [new File(['x'], 'active')]);
    const activeFile = wrapper.vm.fileList[0];
    if (!activeFile) throw new Error('expected active file');
    await wrapper.setProps({
      fileList: [{ uid: activeFile.uid, name: 'replacement', status: 'done' }],
    });
    expect(abort).toHaveBeenCalledTimes(1);
  });

  it('single-file drop applies accept before truncation', async () => {
    const request = vi.fn();
    const wrapper = keep(
      mount(UploadDragger, { props: { accept: '.png', customRequest: request } }),
    );
    await wrapper.get('.apollo-upload-btn').trigger('drop', {
      dataTransfer: {
        files: [new File(['x'], 'bad.txt'), new File(['x'], 'good.png', { type: 'image/png' })],
        items: [],
      },
    });
    await flushPromises();
    expect(request).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).toContain('good.png');
    expect(wrapper.text()).not.toContain('bad.txt');
  });

  it('Dragger forwards disabled/prefix, named slots and all public refs', async () => {
    const wrapper = keep(
      mount(UploadDragger, {
        props: {
          disabled: true,
          prefixCls: 'sample-upload',
          fileList: [{ uid: 'a', name: 'file.txt' }],
        },
        slots: { default: () => 'drag', extra: () => 'extra' },
      }),
    );
    expect(wrapper.find('input').attributes('disabled')).toBeDefined();
    expect(wrapper.find('.sample-upload-drag').exists()).toBe(true);
    expect(wrapper.text()).toContain('extra');
    expect(wrapper.vm.nativeElement).toBe(wrapper.element);
  });

  it('native class/style update on the wrapper and ARIA listeners reach the trigger exactly once', async () => {
    const click = vi.fn();
    const wrapper = keep(
      mount(Upload, {
        props: { hasControlInside: false, openFileDialogOnClick: false },
        attrs: {
          class: 'native-a',
          style: 'width: 140px',
          'aria-label': 'Choose files',
          onClick: click,
        },
        slots: { default: () => 'choose' },
      }),
    );
    expect(wrapper.element.classList.contains('native-a')).toBe(true);
    expect(wrapper.attributes('style')).toContain('width: 140px');
    const trigger = wrapper.get('[role="button"]');
    expect(trigger.attributes('aria-label')).toBe('Choose files');
    await trigger.trigger('click');
    expect(click).toHaveBeenCalledTimes(1);
    await wrapper.setProps({ style: 'width: 220px' });
    expect(wrapper.attributes('style')).toContain('width: 220px');
  });

  it('default action icons use the current Button icon slot', () => {
    const wrapper = keep(
      mount(Upload, { props: { defaultFileList: [{ uid: 'a', name: 'file' }] } }),
    );
    expect(wrapper.find('button .apollo-icon-delete').exists()).toBe(true);
    expect(wrapper.find('button').attributes('icon')).toBeUndefined();
  });

  it('beforeUpload false returns an UploadFile change payload and LIST_IGNORE is omitted', async () => {
    const request = vi.fn();
    const wrapper = keep(
      mount(Upload, { props: { beforeUpload: () => false, customRequest: request } }),
    );
    await pick(wrapper, [new File(['x'], 'stopped')]);
    const info = wrapper.emitted('change')?.[0]?.[0];
    expect(info).toMatchObject({ file: { name: 'stopped', originFileObj: expect.any(File) } });
    expect(request).not.toHaveBeenCalled();
  });

  it('explicit abort cancels pending preprocessing without events', async () => {
    const before = deferred<boolean>();
    const request = vi.fn();
    const wrapper = keep(
      mount(Upload, { props: { beforeUpload: () => before.promise, customRequest: request } }),
    );
    await pick(wrapper, [new File(['x'], 'pending')]);
    wrapper.vm.upload?.abort();
    before.finish(true);
    await flushPromises();
    expect(request).not.toHaveBeenCalled();
    expect(wrapper.emitted('change')).toBeUndefined();
  });

  it('maxCount excludes excess requests and cancels an accepted replaced request', async () => {
    const abort = vi.fn();
    const request = vi.fn(() => ({ abort }));
    const wrapper = keep(
      mount(Upload, { props: { multiple: true, maxCount: 1, customRequest: request } }),
    );
    await pick(wrapper, [new File(['x'], 'first'), new File(['x'], 'second')]);
    expect(request).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted('change')).toHaveLength(1);
    await pick(wrapper, [new File(['x'], 'replacement')]);
    expect(abort).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).toContain('replacement');
  });

  it('asynchronous data and thrown custom requests finish with an observable error', async () => {
    const failure = new Error('request failed');
    const request = vi.fn<NonNullable<UploadProps['customRequest']>>(() => {
      throw failure;
    });
    const wrapper = keep(
      mount(Upload, {
        props: {
          data: async (file) => ({ filename: file.name }),
          customRequest: request,
        },
      }),
    );
    await pick(wrapper, [new File(['x'], 'file.txt')]);
    expect(request.mock.calls[0]?.[0].data).toEqual({ filename: 'file.txt' });
    expect(wrapper.get('.apollo-upload-list-item-error').attributes('title')).toBe(failure.message);
  });

  it('preview initialization is immediate, keeps controlled files immutable and ignores stale thumbnails', async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    const file = Object.freeze({
      uid: 'fixed',
      name: 'a.png',
      originFileObj: Object.assign(new File(['x'], 'a.png', { type: 'image/png' }), {
        uid: 'fixed',
      }),
    });
    const previewFile = vi.fn(() => first.promise);
    const wrapper = keep(
      mount(Upload, { props: { listType: 'picture', fileList: [file], previewFile } }),
    );
    expect(previewFile).toHaveBeenCalledTimes(1);
    expect(file).not.toHaveProperty('thumbUrl');
    await wrapper.setProps({ previewFile: () => second.promise });
    first.finish('data:image/png;base64,OLD');
    await flushPromises();
    expect(wrapper.find('img').exists()).toBe(false);
    second.finish('data:image/png;base64,NEW');
    await flushPromises();
    expect(wrapper.get('img').attributes('src')).toBe('data:image/png;base64,NEW');
    expect(file).not.toHaveProperty('thumbUrl');
  });

  it('cancelled native image previews release their object URL and retain no canvas', async () => {
    const create = vi.fn(() => 'blob:preview');
    const revoke = vi.fn();
    vi.stubGlobal(
      'URL',
      class extends URL {
        static override createObjectURL = create;
        static override revokeObjectURL = revoke;
      },
    );
    const context = { drawImage: vi.fn() };
    const descriptor = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'getContext');
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: () => context,
      configurable: true,
    });
    const controller = new AbortController();
    const result = previewImage(
      new File(['x'], 'image.png', { type: 'image/png' }),
      controller.signal,
    );
    controller.abort();
    expect(await result).toBe('');
    expect(revoke).toHaveBeenCalledWith('blob:preview');
    expect(document.querySelector('canvas')).toBeNull();
    if (descriptor) Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', descriptor);
    vi.unstubAllGlobals();
  });

  it('preview and download callbacks replace navigation once while defaults still work', async () => {
    const preview = vi.fn();
    const download = vi.fn();
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const file: UploadFile = { uid: 'a', name: 'file', status: 'done', url: '/local.txt' };
    const wrapper = keep(
      mount(Upload, {
        props: {
          fileList: [file],
          onPreview: preview,
          onDownload: download,
          showUploadList: { showDownloadIcon: true },
        },
      }),
    );
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    wrapper.get('.apollo-upload-list-item-name').element.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(preview).toHaveBeenCalledTimes(1);
    await wrapper.get('button[title="Download file"]').trigger('click');
    expect(download).toHaveBeenCalledTimes(1);
    expect(open).not.toHaveBeenCalled();
    await wrapper.setProps({ onPreview: undefined, onDownload: undefined });
    await wrapper.get('button[title="Download file"]').trigger('click');
    expect(open).toHaveBeenCalledWith('/local.txt', '_blank', 'noopener');
  });

  it('current Provider configuration and native class/style clear without stale snapshots', async () => {
    const phase = ref(0);
    const Host = defineComponent({
      setup: () => () =>
        h(
          ConfigProvider,
          {
            components:
              phase.value === 2
                ? undefined
                : {
                    upload: {
                      className: `provider-${phase.value}`,
                      style: { height: `${100 + phase.value}px` },
                      accept: phase.value === 0 ? '.png' : '.txt',
                    },
                  },
          },
          {
            default: () =>
              h(Upload, {
                class: `native-${phase.value}`,
                style: phase.value === 2 ? undefined : { width: `${200 + phase.value}px` },
              }),
          },
        ),
    });
    const wrapper = keep(mount(Host, { global: { stubs: { teleport: false } } }));
    expect(wrapper.get('.apollo-upload-wrapper').classes()).toContain('provider-0');
    phase.value = 1;
    await nextTick();
    expect(wrapper.get('.apollo-upload-wrapper').classes()).toContain('native-1');
    expect(wrapper.get('.apollo-upload-wrapper').classes()).not.toContain('native-0');
    expect(wrapper.get('.apollo-upload-wrapper').attributes('style')).toContain('width: 201px');
    expect(wrapper.get('input').attributes('accept')).toBe('.txt');
    phase.value = 2;
    await nextTick();
    expect(wrapper.get('.apollo-upload-wrapper').classes()).not.toContain('provider-1');
    expect(wrapper.get('.apollo-upload-wrapper').attributes('style') ?? '').not.toContain('width');
    expect(wrapper.get('input').attributes('accept')).toBe('');
  });

  it('zero and empty named slots retain ownership and appendAction keeps a working file input', async () => {
    const phase = ref(0);
    const Host = defineComponent({
      setup: () => () =>
        h(
          Upload,
          {
            listType: 'picture-card',
            fileList: [{ uid: 'a', name: 'picture', status: 'done', url: '/picture.png' }],
          },
          {
            default: () => 'fallback',
            appendAction: () => [h('b', 'first'), h('b', 'second')],
            extra: () => 0,
            previewIcon: () => 0,
            ...(phase.value === 0 ? { removeIcon: () => [] } : {}),
          },
        ),
    });
    const wrapper = keep(mount(Host));
    expect(wrapper.get('.apollo-upload-list-item-extra').text()).toBe('0');
    expect(wrapper.get('a[title="Preview file"]').text()).toBe('0');
    expect(wrapper.get('.apollo-upload-select').text()).toBe('firstsecond');
    expect(wrapper.find('.apollo-upload-select input[type="file"]').exists()).toBe(true);
    expect(wrapper.find('button .apollo-icon-delete').exists()).toBe(false);
    phase.value = 1;
    await nextTick();
    expect(wrapper.find('button .apollo-icon-delete').exists()).toBe(true);
  });
});
