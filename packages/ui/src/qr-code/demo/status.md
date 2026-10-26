---
order: 2
title:
  zh-CN: 状态覆盖层
  en-US: Status
---

## zh-CN

status由调用者控制。过期时通过@refresh重新加载，每次加载均会再次到期并清理定时器。#status使用单对象作用域{ status, locale, refresh }，保留全部原生节点；存在的空槽抑制默认内容，active不消费状态槽。

## en-US

The caller controls status. Each @refresh restarts loading and expires again; timers are disposed on unmount. #status receives { status, locale, refresh } and keeps complete native content. An existing empty slot suppresses defaults; active does not consume the slot.
