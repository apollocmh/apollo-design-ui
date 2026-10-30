/**
 * rc `request.js` 行为等价物 —— 默认 XHR 上传请求器。
 *
 * 判据：FormData（数组值 `key[]` 逐项 append）；2xx 成功；响应体尝试
 * JSON.parse；`X-Requested-With` 默认带（headers 里显式 null 可关）；headers
 * null 值跳过；withCredentials；进度 percent = loaded/total*100；返回
 * `{ abort() }`。
 */

export interface UploadProgressEventLike extends Partial<ProgressEvent> {
  percent?: number;
}

export interface UploadRequestErrorLike extends Error {
  status?: number;
  method?: string;
  url?: string;
}

export interface UploadRequestOptionLike {
  onProgress?: (event: UploadProgressEventLike, file?: unknown) => void;
  onError?: (event: UploadRequestErrorLike | ProgressEvent, body?: unknown) => void;
  onSuccess?: (body: unknown, fileOrXhr?: XMLHttpRequest) => void;
  data?: Record<string, unknown>;
  filename?: string;
  file: File | Blob | string;
  withCredentials?: boolean;
  action: string;
  headers?: Record<string, string | null>;
  method: string;
}

export interface UploadRequestReturnLike {
  abort: () => void;
}

function getError(option: UploadRequestOptionLike, xhr: XMLHttpRequest): UploadRequestErrorLike {
  const msg = `cannot ${option.method} ${option.action} ${xhr.status}'`;
  const err: UploadRequestErrorLike = new Error(msg);
  err.status = xhr.status;
  err.method = option.method;
  err.url = option.action;
  return err;
}

function getBody(xhr: XMLHttpRequest): unknown {
  const text: unknown = xhr.responseText || xhr.response;
  if (!text) {
    return text;
  }
  try {
    return typeof text === 'string' ? JSON.parse(text) : text;
  } catch {
    return text;
  }
}

export default function upload(option: UploadRequestOptionLike): UploadRequestReturnLike {
  const xhr = new XMLHttpRequest();
  if (option.onProgress && xhr.upload) {
    xhr.upload.onprogress = function progress(e: ProgressEvent) {
      option.onProgress?.(
        e.total > 0 ? Object.assign(e, { percent: (e.loaded / e.total) * 100 }) : e,
      );
    };
  }

  const formData = new FormData();
  if (option.data) {
    Object.keys(option.data).forEach((key) => {
      const value = option.data?.[key];
      // support key-value array data
      if (Array.isArray(value)) {
        value.forEach((item) => {
          // { list: [ 11, 22 ] }
          // formData.append('list[]', 11);
          formData.append(`${key}[]`, item instanceof Blob ? item : String(item));
        });
        return;
      }
      formData.append(key, value instanceof Blob ? value : String(value));
    });
  }

  if (option.file instanceof Blob) {
    formData.append(
      option.filename ?? 'file',
      option.file,
      option.file instanceof File ? option.file.name : 'blob',
    );
  } else {
    formData.append(option.filename ?? 'file', option.file);
  }
  xhr.onerror = function error(e: ProgressEvent) {
    option.onError?.(e);
  };
  xhr.onload = function onload() {
    // allow success when 2xx status
    // see https://github.com/react-component/upload/issues/34
    if (xhr.status < 200 || xhr.status >= 300) {
      return option.onError?.(getError(option, xhr), getBody(xhr));
    }
    return option.onSuccess?.(getBody(xhr), xhr);
  };
  xhr.open(option.method, option.action, true);

  // Has to be after `.open()`. See https://github.com/enyo/dropzone/issues/179
  if (option.withCredentials && 'withCredentials' in xhr) {
    xhr.withCredentials = true;
  }
  const headers = option.headers ?? {};

  // when set headers['X-Requested-With'] = null , can close default XHR header
  // see https://github.com/react-component/upload/issues/33
  if (!Object.keys(headers).some((name) => name.toLowerCase() === 'x-requested-with')) {
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  }
  Object.keys(headers).forEach((h) => {
    const value = headers[h];
    if (value !== null && value !== undefined) {
      xhr.setRequestHeader(h, value);
    }
  });
  xhr.send(formData);
  return {
    abort() {
      xhr.abort();
    },
  };
}
