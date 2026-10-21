---
order: 6
title:
  zh-CN: 自定义上传
  en-US: Custom Request
---

用 `customRequest` 接管上传：示例每 200ms 上报一次 `onProgress`，到 100% 后调用 `onSuccess`。真实项目可在此接入自己的请求库、鉴权或分片逻辑。
