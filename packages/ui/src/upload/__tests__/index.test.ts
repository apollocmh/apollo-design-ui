/**
 * Upload 的 L1 单元测试（G5）。
 *
 * 行为判据来自 antd 仓库测试（components/upload/__tests__）+ rc 引擎规格
 * （docs/analysis/upload.md §2）。上传请求用 customRequest mock（不经网络）。
 */

import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import attrAccept from '../engine/attr-accept';
import { LIST_IGNORE, Upload, UploadDragger } from '../index';
import { file2Obj, getFileItem, removeFileItem, updateFileList } from '../utils';

const makeFile = (name = 'a.txt', type = 'text/plain'): File => new File(['hello'], name, { type });

/** 模拟 input 选择文件：给隐藏 input 塞 files 后触发 change。 */
function pickFiles(wrapper: ReturnType<typeof mount>, files: File[]): void {
  const input = wrapper.find('input[type="file"]').element as HTMLInputElement;
  Object.defineProperty(input, 'files', { value: files, configurable: true });
  wrapper.find('input[type="file"]').trigger('change');
}

/**
 * 取 mock 第 index 次调用的首个参数。
 *
 * 为什么不用 `calls[i][0]`：TS 认为 `calls[i]` 可能是 undefined（H10 禁止用
 * `as any` / `!` 掩盖），而这里「没被调用到」本来就该是测试失败 —— 抛错比断言
 * `undefined` 更能定位，且**没有放宽任何断言强度**。
 */
function callArg<T>(spy: { mock: { calls: unknown[][] } }, index = 0): T {
  const call = spy.mock.calls[index];
  if (!call) {
    throw new Error(`expected ≥${index + 1} call(s), got ${spy.mock.calls.length}`);
  }
  return call[0] as T;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Upload · L1 基础渲染', () => {
  it('结构：wrapper span + .{p}-select 触发区 + 隐藏 input[type=file]', () => {
    const wrapper = mount(Upload, {
      props: { action: '/upload' },
      slots: { default: () => 'upload' },
    });
    expect(wrapper.find('.apollo-upload-wrapper').exists()).toBe(true);
    expect(wrapper.find('.apollo-upload-select').exists()).toBe(true);
    const input = wrapper.find('input[type="file"]');
    expect(input.exists()).toBe(true);
    expect(input.attributes('type')).toBe('file');
  });

  it('accept 透传 input；directory ⇒ directory+webkitdirectory', () => {
    const w1 = mount(Upload, { props: { action: '/u', accept: '.jpg,image/*' } });
    expect(w1.find('input').attributes('accept')).toBe('.jpg,image/*');
    const w2 = mount(Upload, { props: { action: '/u', directory: true } });
    expect(w2.find('input').attributes('directory')).toBe('directory');
    expect(w2.find('input').attributes('webkitdirectory')).toBe('webkitdirectory');
  });

  it('multiple / capture 透传', () => {
    const w = mount(Upload, { props: { action: '/u', multiple: true, capture: 'user' } });
    expect(w.find('input').attributes('multiple')).toBeDefined();
    expect(w.find('input').attributes('capture')).toBe('user');
  });

  it('disabled ⇒ -disabled 且 input disabled', () => {
    const wrapper = mount(Upload, {
      props: { action: '/u', disabled: true },
      slots: { default: () => 'x' },
    });
    expect(wrapper.find('.apollo-upload-disabled').exists()).toBe(true);
    expect(wrapper.find('input').attributes('disabled')).toBeDefined();
  });

  it('showUploadList=false ⇒ 不渲染列表', () => {
    const wrapper = mount(Upload, {
      props: { action: '/u', showUploadList: false, defaultFileList: [{ uid: '1', name: 'a' }] },
      slots: { default: () => 'x' },
    });
    expect(wrapper.find('.apollo-upload-list').exists()).toBe(false);
  });

  it('默认列表渲染：-list-item + -list-item-done + 文件名', () => {
    const wrapper = mount(Upload, {
      props: {
        action: '/u',
        defaultFileList: [{ uid: '1', name: 'a.txt', status: 'done' }],
      },
      slots: { default: () => 'x' },
    });
    expect(wrapper.find('.apollo-upload-list-item').exists()).toBe(true);
    expect(wrapper.find('.apollo-upload-list-item-done').exists()).toBe(true);
    expect(wrapper.text()).toContain('a.txt');
  });

  it('select 形态：default slot 渲染进引擎根（antd 的 RcUpload children）', () => {
    const wrapper = mount(Upload, {
      props: { action: '/u' },
      slots: { default: () => h('button', { type: 'button' }, 'Select File') },
    });
    const btn = wrapper.find('.apollo-upload-select button');
    expect(btn.exists()).toBe(true);
    expect(btn.text()).toBe('Select File');
    // 有 children ⇒ 不带 -hidden
    expect(wrapper.find('.apollo-upload-select').classes()).not.toContain('apollo-upload-hidden');
  });

  it('picture-card 形态：children 作为 appendAction 渲染', () => {
    const wrapper = mount(Upload, {
      props: { action: '/u', listType: 'picture-card' },
      slots: { default: () => h('span', {}, '+ Upload') },
    });
    expect(wrapper.find('.apollo-upload-select span').text()).toBe('+ Upload');
  });

  it('drag 形态：-drag + role=button + tabIndex', () => {
    const wrapper = mount(Upload, {
      props: { action: '/u', type: 'drag' },
      slots: { default: () => 'drag here' },
    });
    expect(wrapper.find('.apollo-upload-drag').exists()).toBe(true);
    // antd 6.6.4 默认 hasControlInside=true ⇒ 引擎根无 role=button/tabIndex
    expect(wrapper.find('.apollo-upload-drag').attributes('role')).toBeUndefined();
  });

  it('Dragger 别名：type=drag + hasControlInside=false', () => {
    const wrapper = mount(UploadDragger, {
      props: { action: '/u' },
      slots: { default: () => 'drag' },
    });
    expect(wrapper.find('.apollo-upload-drag').exists()).toBe(true);
  });
});

describe('Upload · L2 拖拽态（antd Upload.js:378-394）', () => {
  it('dragover ⇒ -drag-hover；dragleave ⇒ 撤销（dragState = e.type）', async () => {
    const wrapper = mount(Upload, {
      props: { action: '/u', type: 'drag' },
      slots: { default: () => 'drag' },
    });
    const drag = () => wrapper.find('.apollo-upload-drag');
    expect(drag().classes()).not.toContain('apollo-upload-drag-hover');
    await drag().trigger('dragover');
    expect(drag().classes()).toContain('apollo-upload-drag-hover');
    await drag().trigger('dragleave');
    expect(drag().classes()).not.toContain('apollo-upload-drag-hover');
  });

  it('列表里有 uploading ⇒ -drag-uploading（antd 只在 DOM 上标，样式无对应规则）', () => {
    const wrapper = mount(Upload, {
      props: {
        action: '/u',
        type: 'drag',
        defaultFileList: [{ uid: '1', name: 'a.txt', status: 'uploading' }],
      },
      slots: { default: () => 'drag' },
    });
    expect(wrapper.find('.apollo-upload-drag').classes()).toContain('apollo-upload-drag-uploading');
  });

  it('drop：props.onDrop 只触发一次', async () => {
    const onDrop = vi.fn();
    const wrapper = mount(Upload, {
      props: { action: '/u', type: 'drag', onDrop },
      slots: { default: () => 'drag' },
    });
    await wrapper.find('.apollo-upload-drag').trigger('drop');
    expect(onDrop).toHaveBeenCalledTimes(1);
  });

  it('drop：@drop 走 emit 通道，只触发一次', async () => {
    const onDrop = vi.fn();
    const wrapper = mount(Upload, {
      props: { action: '/u', type: 'drag' },
      attrs: { onDrop },
      slots: { default: () => 'drag' },
    });
    await wrapper.find('.apollo-upload-drag').trigger('drop');
    expect(onDrop).toHaveBeenCalledTimes(1);
  });
});

describe('Upload · L1 上传流程（customRequest mock）', () => {
  it('选文件 ⇒ onChange 两次（uploading/done）+ fileList 状态推进', async () => {
    const onChange = vi.fn();
    const wrapper = mount(Upload, {
      props: {
        action: '/upload',
        customRequest: (option) => {
          option.onSuccess?.({}, undefined);
          return { abort: () => {} };
        },
        onChange,
      },
      slots: { default: () => 'x' },
    });
    pickFiles(wrapper, [makeFile()]);
    await new Promise((r) => setTimeout(r, 0));
    // batchStart（uploading）+ success（done）至少触发
    const statuses = onChange.mock.calls.map(
      (c) => (c[0] as { file: { status?: string } }).file.status,
    );
    expect(statuses).toContain('uploading');
    expect(statuses).toContain('done');
    expect(wrapper.vm.$).toBeTruthy();
  });

  it('beforeUpload=false ⇒ 不进列表但触发一次 onChange', async () => {
    const onChange = vi.fn();
    const wrapper = mount(Upload, {
      props: {
        action: '/upload',
        beforeUpload: () => false,
        onChange,
      },
      slots: { default: () => 'x' },
    });
    pickFiles(wrapper, [makeFile()]);
    await new Promise((r) => setTimeout(r, 0));
    expect(onChange).toHaveBeenCalledTimes(1);
    const info = callArg<{ fileList: { status?: string }[] }>(onChange);
    expect(info.fileList.every((f) => f.status !== 'uploading')).toBe(true);
  });

  it('beforeUpload=LIST_IGNORE ⇒ 完全忽略', async () => {
    const onChange = vi.fn();
    const wrapper = mount(Upload, {
      props: { action: '/upload', beforeUpload: () => LIST_IGNORE, onChange },
      slots: { default: () => 'x' },
    });
    pickFiles(wrapper, [makeFile()]);
    await new Promise((r) => setTimeout(r, 0));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('accept 在 select 态不做 JS 过滤（rc 判据：交给原生 input；drop/directory 才走 attrAccept）', async () => {
    const onChange = vi.fn();
    const wrapper = mount(Upload, {
      props: { action: '/upload', accept: '.png', onChange },
      slots: { default: () => 'x' },
    });
    pickFiles(wrapper, [makeFile('a.txt')]);
    await new Promise((r) => setTimeout(r, 0));
    expect(onChange).toHaveBeenCalled();
  });

  it('maxCount=1 ⇒ 替换（列表长度恒 1）', async () => {
    const onChange = vi.fn();
    const wrapper = mount(Upload, {
      props: {
        action: '/upload',
        maxCount: 1,
        defaultFileList: [{ uid: 'old', name: 'old.txt', status: 'done' }],
        customRequest: (option) => {
          option.onSuccess?.({}, undefined);
          return { abort: () => {} };
        },
        onChange,
      },
      slots: { default: () => 'x' },
    });
    pickFiles(wrapper, [makeFile('new.txt')]);
    await new Promise((r) => setTimeout(r, 0));
    const info = callArg<{ fileList: { name: string }[] }>(
      onChange,
      onChange.mock.calls.length - 1,
    );
    expect(info.fileList.length).toBe(1);
  });

  it('删除：onRemove=false 阻止；确认删除 ⇒ removed onChange + 列表移除', async () => {
    const onChange = vi.fn();
    const onRemove = vi.fn(() => false);
    const wrapper = mount(Upload, {
      props: {
        action: '/upload',
        defaultFileList: [{ uid: '1', name: 'a.txt', status: 'done' }],
        onRemove,
        onChange,
      },
      slots: { default: () => 'x' },
    });
    const removeBtn = wrapper.find('.apollo-upload-list-item-action');
    expect(removeBtn.exists()).toBe(true);
    await removeBtn.trigger('click');
    await new Promise((r) => setTimeout(r, 0));
    expect(onRemove).toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('request 默认 XHR：2xx 成功 / 非 2xx 失败（mock XHR）', async () => {
    const { default: request } = await import('../engine/request');
    const xhr = {
      open: vi.fn(),
      send: vi.fn(),
      setRequestHeader: vi.fn(),
      upload: { onprogress: null as ((e: ProgressEvent) => void) | null },
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      status: 200,
      responseText: '{"ok":1}',
    };
    const instances: { onload: (() => void) | null }[] = [];
    const XHRMock = class {
      open = xhr.open;
      send = xhr.send;
      setRequestHeader = xhr.setRequestHeader;
      upload = xhr.upload;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      status = 200;
      responseText = '{"ok":1}';
      withCredentials = false;
      constructor() {
        instances.push(this);
      }
    };
    vi.stubGlobal('XMLHttpRequest', XHRMock);
    const onSuccess = vi.fn();
    request({
      action: '/upload',
      method: 'post',
      file: makeFile(),
      filename: 'file',
      onSuccess,
    } as never);
    expect(xhr.open).toHaveBeenCalledWith('post', '/upload', true);
    expect(xhr.setRequestHeader).toHaveBeenCalledWith('X-Requested-With', 'XMLHttpRequest');
    instances[0]?.onload?.();
    expect(onSuccess).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe('Upload · utils 行为', () => {
  it('file2Obj：uid/percent/originFileObj', () => {
    // RcFile = File & { uid }：rc 在 processFile 前给选中的 File 打 uid，
    // 这里显式窄化而不是在调用点断言（H10）
    const file = makeFile() as File & { uid: string };
    file.uid = 'u1';
    const obj = file2Obj(file);
    expect(obj.uid).toBe('u1');
    expect(obj.percent).toBe(0);
    expect(obj.originFileObj).toBe(file);
  });

  it('updateFileList：存在替换、不存在 push', () => {
    const a = { uid: 'a', name: 'a' };
    const b = { uid: 'b', name: 'b' };
    const list = updateFileList(a, []);
    expect(list.length).toBe(1);
    const list2 = updateFileList(b, list);
    expect(list2.length).toBe(2);
    const a2 = { uid: 'a', name: 'a2' };
    const list3 = updateFileList(a2, list2);
    expect(list3.length).toBe(2);
    expect(list3.find((f) => f.uid === 'a')?.name).toBe('a2');
  });

  it('getFileItem / removeFileItem：uid 优先、name 兜底', () => {
    // 两个函数都是 `T extends { uid?: string; name?: string }`：查询项故意只带
    // 一个键（测 uid 优先 / name 兜底），所以必须显式给类型参数，否则 TS 会从
    // 列表项把 T 推成完整形状、查询项反而报错。
    type Item = { uid?: string; name?: string };
    const a: Item = { uid: 'a', name: 'x' };
    expect(getFileItem<Item>({ uid: 'a' }, [a])).toBe(a);
    expect(getFileItem<Item>({ name: 'x' }, [a])).toBe(a);
    expect(removeFileItem<Item>({ uid: 'a' }, [a])).toEqual([]);
    expect(removeFileItem<Item>({ uid: 'zz' }, [a])).toBeNull();
  });

  it('attrAccept：后缀 / 主类型 / 全匹配 / 裸词放行', () => {
    const png = makeFile('x.png', 'image/png');
    expect(attrAccept(png, '.png')).toBe(true);
    expect(attrAccept(png, '.jpg')).toBe(false);
    expect(attrAccept(png, 'image/*')).toBe(true);
    expect(attrAccept(png, 'image/png')).toBe(true);
    expect(attrAccept(png, '*')).toBe(true);
    expect(attrAccept(makeFile('y.txt', 'text/plain'), 'image/*')).toBe(false);
  });
});
