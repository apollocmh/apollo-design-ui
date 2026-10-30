/**
 * antd `es/upload/utils.js` 行为等价物 —— 文件对象工具 + 图片预览。
 */

import type { InternalUploadFile, RcFile, UploadFile } from './interface';

export type UploadFileBase = UploadFile;

export function file2Obj(file: RcFile): InternalUploadFile {
  return {
    ...file,
    lastModified: file.lastModified,
    lastModifiedDate: file.lastModifiedDate,
    name: file.name,
    size: file.size,
    type: file.type,
    uid: file.uid,
    percent: 0,
    originFileObj: file,
  };
}

/** Upload fileList. Replace file if exist or just push into it. */
export function updateFileList<T extends { uid: string }>(file: T, fileList: T[]): T[] {
  const nextFileList = [...fileList];
  const fileIndex = nextFileList.findIndex(({ uid }) => uid === file.uid);
  if (fileIndex === -1) {
    nextFileList.push(file);
  } else {
    nextFileList[fileIndex] = file;
  }
  return nextFileList;
}

export function getFileItem<T extends { uid?: string; name?: string }>(
  file: { uid?: string; name?: string },
  fileList: T[],
): T | undefined {
  const matchKey = file.uid !== undefined ? 'uid' : 'name';
  return fileList.filter((item) => item[matchKey] === file[matchKey])[0];
}

export function removeFileItem<T extends { uid?: string; name?: string }>(
  file: { uid?: string; name?: string },
  fileList: T[],
): T[] | null {
  const matchKey = file.uid !== undefined ? 'uid' : 'name';
  const removed = fileList.filter((item) => item[matchKey] !== file[matchKey]);
  if (removed.length === fileList.length) {
    return null;
  }
  return removed;
}

// ==================== Default Image Preview ====================
const extname = (url = ''): string => {
  const temp = url.split('/');
  const filename = temp[temp.length - 1] ?? '';
  const filenameWithoutSuffix = filename.split(/#|\?/)[0] ?? '';
  return (/\.[^./\\]*$/.exec(filenameWithoutSuffix) || [''])[0];
};
const isImageFileType = (type: string): boolean => type.indexOf('image/') === 0;
const imageExtensions = [
  '.avif',
  '.bmp',
  '.dpg',
  '.gif',
  '.heic',
  '.heif',
  '.ico',
  '.jfif',
  '.jpg',
  '.jpeg',
  '.png',
  '.svg',
  '.tif',
  '.tiff',
  '.webp',
];

export const isImageUrl = (file: {
  type?: string;
  thumbUrl?: string;
  url?: string;
  name?: string;
}): boolean => {
  if (file.type && !file.thumbUrl) {
    return isImageFileType(file.type);
  }
  const url = file.thumbUrl || file.url || '';
  const extension = extname(url || file.name || '');
  if (/^data:image\//.test(url) || imageExtensions.includes(extension?.toLowerCase() || '')) {
    return true;
  }
  if (/^data:/.test(url)) {
    // other file types of base64
    return false;
  }
  if (extension) {
    // other file types which have extension
    return false;
  }
  return true;
};

const MEASURE_SIZE = 200;

export function previewImage(file: File | Blob, signal?: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type || !isImageFileType(file.type) || signal?.aborted) {
      resolve('');
      return;
    }
    let reader: FileReader | undefined;
    let image: HTMLImageElement | undefined;
    let objectUrl: string | undefined;
    const cleanup = (): void => {
      signal?.removeEventListener('abort', cancel);
      if (reader) {
        reader.onload = null;
        reader.onerror = null;
        reader.onabort = null;
        if (reader.readyState === FileReader.LOADING) reader.abort();
      }
      if (image) {
        image.onload = null;
        image.onerror = null;
        image.removeAttribute('src');
      }
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    const finish = (url: string): void => {
      cleanup();
      resolve(url);
    };
    const fail = (error: unknown): void => {
      cleanup();
      reject(error);
    };
    const cancel = (): void => finish('');
    signal?.addEventListener('abort', cancel, { once: true });
    if (file.type.startsWith('image/gif')) {
      reader = new FileReader();
      reader.onload = () =>
        typeof reader?.result === 'string'
          ? finish(reader.result)
          : fail(new Error('Unable to read image preview'));
      reader.onerror = () => fail(reader?.error ?? new Error('Unable to read image preview'));
      reader.onabort = cancel;
      reader.readAsDataURL(file);
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = MEASURE_SIZE;
    canvas.height = MEASURE_SIZE;
    const context = canvas.getContext('2d');
    if (!context) {
      fail(new Error('Unable to create image preview canvas'));
      return;
    }
    const img = new Image();
    image = img;
    img.onload = () => {
      try {
        const { width, height } = img;
        if (width === 0 || height === 0) {
          fail(new Error('Image preview has no dimensions'));
          return;
        }
        const ratio = MEASURE_SIZE / Math.max(width, height);
        const drawWidth = width * ratio;
        const drawHeight = height * ratio;
        context.drawImage(
          img,
          (MEASURE_SIZE - drawWidth) / 2,
          (MEASURE_SIZE - drawHeight) / 2,
          drawWidth,
          drawHeight,
        );
        finish(canvas.toDataURL());
      } catch (error) {
        fail(error);
      }
    };
    img.onerror = () => fail(new Error('Unable to load image preview'));
    img.crossOrigin = 'anonymous';
    if (file.type.startsWith('image/svg+xml')) {
      reader = new FileReader();
      reader.onload = () => {
        if (typeof reader?.result === 'string') img.src = reader.result;
        else fail(new Error('Unable to read image preview'));
      };
      reader.onerror = () => fail(reader?.error ?? new Error('Unable to read image preview'));
      reader.onabort = cancel;
      reader.readAsDataURL(file);
    } else {
      objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;
    }
  });
}
