/**
 * L3 · 类型测试（含负例）
 *
 * ⚠️ `*.test-d.ts` 会被 vitest **真的执行**：负例必须包在**永不调用的闭包**里。
 *
 * ── 本文件钉的七类判据 ───────────────────────────────────────────────────────
 *
 * 1. **三个枚举的取值面**：`UploadType` / `UploadListType` / `UploadFileStatus`。
 * 2. **`action` 的三态**：字符串 / `(file) => string` / `(file) => PromiseLike<string>`。
 * 3. **`beforeUpload` 的返回**：`BeforeUploadValueType | Promise<…>`，而
 *    `BeforeUploadValueType = void | boolean | string | Blob | File` ——
 *    ⚠️ **含 `void`**（antd 的语句体回调推断成 `void`，换 `undefined` 会破坏用户代码）。
 * 4. **`customRequest` 的三参签名**（含 `info.defaultRequest`）。
 * 5. **`onRemove` 的返回**：`void | boolean | Promise<void | boolean>`。
 * 6. **语义化四槽**（root / list / item / trigger）+ 函数形态。
 * 7. **泛型默认 `T = unknown`**（`UploadProps` / `UploadFile` / `UploadChangeParam`）。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { VNodeChild } from 'vue';
import { Upload } from '../index';
import type {
  BeforeUploadValueType,
  HttpRequestHeader,
  ItemRender,
  PreviewFileHandler,
  RcFile,
  ShowUploadListInterface,
  UploadChangeParam,
  UploadFile,
  UploadFileStatus,
  UploadListType,
  UploadProps,
  UploadSemanticType,
  UploadType,
} from '../interface';

describe('Upload · 枚举取值面', () => {
  it('`UploadType` / `UploadListType` / `UploadFileStatus` 与 antd 一致', () => {
    expectTypeOf<UploadType>().toEqualTypeOf<'drag' | 'select'>();
    expectTypeOf<UploadListType>().toEqualTypeOf<
      'text' | 'picture' | 'picture-card' | 'picture-circle'
    >();
    expectTypeOf<UploadFileStatus>().toEqualTypeOf<'error' | 'done' | 'uploading' | 'removed'>();
  });

  it('`UploadProps` 的枚举字段都是可选', () => {
    expectTypeOf<UploadProps['type']>().toEqualTypeOf<UploadType | undefined>();
    expectTypeOf<UploadProps['listType']>().toEqualTypeOf<UploadListType | undefined>();
    expectTypeOf<UploadProps['method']>().toEqualTypeOf<
      'POST' | 'PUT' | 'PATCH' | 'post' | 'put' | 'patch' | undefined
    >();
  });
});

describe('Upload · 回调签名', () => {
  it('🚨 `action` 是**三态**（字符串 / 同步函数 / 异步函数）', () => {
    // ⚠️ 三个形态**分别**断言可赋值，不做整个联合的精确比对：
    //    函数形态的参数是 `RcFile`（`File & { uid: string }`），而函数参数**逆变** ⇒
    //    写成 `(file: unknown) => …` 的 `toEqualTypeOf` 必然失败（实测）。
    expectTypeOf<string>().toMatchTypeOf<NonNullable<UploadProps['action']>>();
    expectTypeOf<(file: RcFile) => string>().toMatchTypeOf<NonNullable<UploadProps['action']>>();
    expectTypeOf<(file: RcFile) => PromiseLike<string>>().toMatchTypeOf<
      NonNullable<UploadProps['action']>
    >();
  });

  it('🚨 `beforeUpload` 的返回含 **`void`**（antd 逐字契约）', () => {
    expectTypeOf<BeforeUploadValueType>().toEqualTypeOf<void | boolean | string | Blob | File>();
    expectTypeOf<NonNullable<UploadProps['beforeUpload']>>().returns.toEqualTypeOf<
      BeforeUploadValueType | Promise<BeforeUploadValueType>
    >();
  });

  it('🚨 `onRemove` 的返回是 `void | boolean | Promise<void | boolean>`', () => {
    expectTypeOf<NonNullable<UploadProps['onRemove']>>().returns.toEqualTypeOf<
      void | boolean | Promise<void | boolean>
    >();
  });

  it('`onChange` 的载荷是 `UploadChangeParam<UploadFile<T>>`', () => {
    expectTypeOf<NonNullable<UploadProps['onChange']>>().parameters.toEqualTypeOf<
      [info: UploadChangeParam<UploadFile<unknown>>]
    >();
    expectTypeOf<UploadChangeParam['file']>().toEqualTypeOf<UploadFile<unknown>>();
    expectTypeOf<NonNullable<UploadChangeParam['event']>>().toEqualTypeOf<{ percent: number }>();
  });

  it('`ItemRender` 是 4 参（originNode / file / fileList / actions）', () => {
    expectTypeOf<ItemRender>().parameters.toEqualTypeOf<
      [
        originNode: VNodeChild,
        file: UploadFile<unknown>,
        fileList: UploadFile<unknown>[],
        actions: { download: () => void; preview: () => void; remove: () => void },
      ]
    >();
  });

  it('`PreviewFileHandler` 接 `File | Blob`，返回 `PromiseLike<string>`', () => {
    expectTypeOf<PreviewFileHandler>().parameters.toEqualTypeOf<[file: File | Blob]>();
    expectTypeOf<PreviewFileHandler>().returns.toEqualTypeOf<PromiseLike<string>>();
  });
});

describe('Upload · 数据面与语义化', () => {
  it('`UploadFile` 的关键字段（含索引签名）', () => {
    expectTypeOf<UploadFile['uid']>().toEqualTypeOf<string>();
    expectTypeOf<UploadFile['name']>().toEqualTypeOf<string>();
    expectTypeOf<UploadFile['status']>().toEqualTypeOf<UploadFileStatus | undefined>();
    expectTypeOf<UploadFile['percent']>().toEqualTypeOf<number | undefined>();
    // ⚠️ `originFileObj` 是 `RcFile | undefined`（`File & { uid: string }`）⇒
    //    写 `File | undefined` 的精确比对会被判成 `never`（实测）⇒ 用 `toMatchTypeOf`。
    expectTypeOf<NonNullable<UploadFile['originFileObj']>>().toMatchTypeOf<File>();
    // 索引签名 ⇒ 未知字段不报错（antd 同判）
    expectTypeOf<UploadFile>().toHaveProperty('uid');
  });

  it('`showUploadList` 是 `boolean | ShowUploadListInterface<T>`，三个子字段都支持函数', () => {
    expectTypeOf<UploadProps['showUploadList']>().toEqualTypeOf<
      boolean | ShowUploadListInterface<unknown> | undefined
    >();
    expectTypeOf<ShowUploadListInterface['showRemoveIcon']>().toEqualTypeOf<
      boolean | ((file: UploadFile<unknown>) => boolean) | undefined
    >();
  });

  it('`headers` 是字符串字典', () => {
    expectTypeOf<HttpRequestHeader>().toEqualTypeOf<Record<string, string>>();
  });

  it('语义化槽是**四个**（root / list / item / trigger），支持函数形态', () => {
    expectTypeOf<keyof NonNullable<UploadSemanticType['classNames']>>().toEqualTypeOf<
      'root' | 'list' | 'item' | 'trigger'
    >();
    // 静态对象形态可赋值给 `UploadProps['classNames']`（后者还接受函数形态）。
    // ⚠️ 反方向（联合 → 对象）**不成立** —— 函数形态不满足对象类型，别写错方向。
    expectTypeOf<NonNullable<UploadSemanticType['classNames']>>().toMatchTypeOf<
      NonNullable<UploadProps['classNames']>
    >();
  });

  it('★ 泛型默认 `T = unknown`', () => {
    expectTypeOf<UploadProps>().toMatchTypeOf<UploadProps<unknown>>();
    expectTypeOf<UploadFile['response']>().toEqualTypeOf<unknown>();
  });

  it('★ `Upload` 是可安装的组件（`withInstall` 的产物）', () => {
    expectTypeOf(Upload).toHaveProperty('install');
  });
});

describe('Upload · 负例（永不调用的闭包内）', () => {
  it('非法的枚举 / 回调返回 / 语义化槽名必须被拒绝', () => {
    const _never = () => {
      // @ts-expect-error `type` 只接受 drag | select
      const badType: UploadProps = { type: 'click' };
      // @ts-expect-error `listType` 没有 'card'
      const badListType: UploadProps = { listType: 'card' };
      // @ts-expect-error `beforeUpload` 不能返回数字
      const badBefore: UploadProps = { beforeUpload: () => 1 };
      // @ts-expect-error `onRemove` 不能返回字符串
      const badRemove: UploadProps = { onRemove: () => 'yes' };
      // @ts-expect-error 语义化槽名拼错（没有 `listItem`）
      const badSlots: UploadProps = { classNames: { listItem: 'x' } };
      return [badType, badListType, badBefore, badRemove, badSlots];
    };
    void _never;
  });

  it('`uid` 是必填（`UploadFile` 不能缺 uid）', () => {
    const _never = () => {
      // @ts-expect-error 缺 `uid` / `name`
      const badFile: UploadFile = { status: 'done' };
      return badFile;
    };
    void _never;
  });
});
