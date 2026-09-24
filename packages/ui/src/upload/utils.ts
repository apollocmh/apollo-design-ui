/**
 * antd `es/upload/utils.js` 行为等价物 —— 文件对象工具 + 图片预览。
 */

export interface UploadFileBase {
  uid: string;
  size?: number;
  name: string;
  fileName?: string;
  lastModified?: number;
  lastModifiedDate?: Date;
  url?: string;
  status?: 'error' | 'done' | 'uploading' | 'removed';
  percent?: number;
  thumbUrl?: string;
  crossOrigin?: string | 'anonymous' | 'use-credentials' | null;
  originFileObj?: File & { uid: string };
  response?: unknown;
  error?: unknown;
  linkProps?: unknown;
  type?: string;
  xhr?: unknown;
  preview?: string;
  [key: string]: unknown;
}

export function file2Obj(file: File & { uid: string }): UploadFileBase {
  return {
    ...file,
    lastModified: file.lastModified,
    lastModifiedDate: (file as File & { lastModifiedDate?: Date }).lastModifiedDate,
    name: file.name,
    size: file.size,
    type: file.type,
    uid: file.uid,
    percent: 0,
    originFileObj: file as File & { uid: string },
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
  file: T,
  fileList: T[],
): T | undefined {
  const matchKey = file.uid !== undefined ? 'uid' : 'name';
  return fileList.filter((item) => item[matchKey] === file[matchKey])[0];
}

export function removeFileItem<T extends { uid?: string; name?: string }>(
  file: T,
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

export function previewImage(file: File | Blob): Promise<string> {
  return new Promise((resolve) => {
    if (!file.type || !isImageFileType(file.type)) {
      resolve('');
      return;
    }
    if (file.type.startsWith('image/gif')) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result && typeof reader.result === 'string') {
          resolve(reader.result);
        }
      };
      reader.readAsDataURL(file);
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = MEASURE_SIZE;
    canvas.height = MEASURE_SIZE;
    canvas.style.cssText = `position: fixed; left: 0; top: 0; width: ${MEASURE_SIZE}px; height: ${MEASURE_SIZE}px; z-index: 9999; display: none;`;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      let drawWidth = MEASURE_SIZE;
      let drawHeight = MEASURE_SIZE;
      let offsetX = 0;
      let offsetY = 0;
      if (width > height) {
        drawHeight = height * (MEASURE_SIZE / width);
        offsetY = -(drawHeight - drawWidth) / 2;
      } else {
        drawWidth = width * (MEASURE_SIZE / height);
        offsetX = -(drawWidth - drawHeight) / 2;
      }
      ctx?.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      const dataURL = canvas.toDataURL();
      document.body.removeChild(canvas);
      window.URL.revokeObjectURL(img.src);
      resolve(dataURL);
    };
    img.crossOrigin = 'anonymous';
    if (file.type.startsWith('image/svg+xml')) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result && typeof reader.result === 'string') {
          img.src = reader.result;
        }
      };
      reader.readAsDataURL(file);
    } else {
      img.src = window.URL.createObjectURL(file);
    }
  });
}
