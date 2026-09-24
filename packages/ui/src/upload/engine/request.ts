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
  file: unknown;
  withCredentials?: boolean;
  action: string;
  headers?: Record<string, string>;
  method: string;
}

export interface UploadRequestReturnLike {
  abort: () => void;
}

function getError(option: UploadRequestOptionLike, xhr: XMLHttpRequest): UploadRequestErrorLike {
  const msg = `cannot ${option.method} ${option.action} ${xhr.status}'`;
  const err = new Error(msg) as UploadRequestErrorLike;
  err.status = xhr.status;
  err.method = option.method;
  err.url = option.action;
  return err;
}

function getBody(xhr: XMLHttpRequest): unknown {
  const text = xhr.responseText || xhr.response;
  if (!text) {
    return text;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export default function upload(option: UploadRequestOptionLike): UploadRequestReturnLike {
  const xhr = new XMLHttpRequest();
  if (option.onProgress && xhr.upload) {
    xhr.upload.onprogress = function progress(e: ProgressEvent) {
      const event = e as UploadProgressEventLike;
      if (e.total > 0) {
        event.percent = (e.loaded / e.total) * 100;
      }
      option.onProgress?.(event);
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
          formData.append(`${key}[]`, item as string | Blob);
        });
        return;
      }
      formData.append(key, value as string | Blob);
    });
  }

  if (option.file instanceof Blob) {
    formData.append(option.filename ?? 'file', option.file, (option.file as File).name);
  } else {
    formData.append(option.filename ?? 'file', option.file as string | Blob);
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
  if ((headers as Record<string, string | null>)['X-Requested-With'] !== null) {
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  }
  Object.keys(headers).forEach((h) => {
    if ((headers as Record<string, string | null>)[h] !== null) {
      xhr.setRequestHeader(h, headers[h] as string);
    }
  });
  xhr.send(formData);
  return {
    abort() {
      xhr.abort();
    },
  };
}
