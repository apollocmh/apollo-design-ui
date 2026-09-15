# 组件文档模板

> 复制到 `packages/ui/src/<component>/index.zh-CN.md` 与 `index.en-US.md`。
>
> **规则 R19**：文档必须重新撰写，禁止复制 antd 文档正文（`AGENTS.md` H2）。
> 允许对齐的是：API 表结构、Prop 名、类型、默认值。
> **规则 R20**：API 表从类型定义自动生成，避免手写漂移。

---

## 中文版模板（`index.zh-CN.md`）

```markdown
---
category: Components
group: 通用
title: Button
subtitle: 按钮
description: 按钮用于开始一个即时操作。
cover: https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*...
---

## 何时使用

（**自写**，不复制 antd 文案。用 2-4 句说明这个组件解决什么问题、什么场景该用、什么场景不该用。）

标记一个（或封装一组）操作命令，响应用户点击行为，触发相应的业务逻辑。

## 代码演示

<!-- 引用 demo/ 下的示例。每个 demo 必须可运行，且被 demoTest 覆盖。 -->

<code src="./demo/basic.vue">基础用法</code>
<code src="./demo/loading.vue">加载中</code>
<code src="./demo/icon.vue">图标按钮</code>
<code src="./demo/disabled.vue">禁用状态</code>
<code src="./demo/block.vue">块级按钮</code>
<code src="./demo/button-group.vue">按钮组合</code>
<code src="./demo/theme.vue">主题定制</code>

## API

### Props

<!-- 由 scripts/gen-api-table.mjs 从 interface.ts 自动生成 -->

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| block | 将按钮宽度调整为其父宽度的宽度 | boolean | false | |
| danger | 设置危险按钮 | boolean | false | |
| disabled | 按钮失效状态 | boolean | false | |
| ghost | 幽灵属性，使按钮背景透明 | boolean | false | |
| htmlType | 设置 `button` 原生的 `type` 值 | `submit` \| `reset` \| `button` | `button` | |
| icon | 设置按钮图标 | `VNode` | - | |
| iconPosition | 设置图标位置 | `start` \| `end` | `start` | |
| loading | 设置按钮载入状态 | boolean \| `{ delay?: number }` | false | |
| shape | 设置按钮形状 | `default` \| `circle` \| `round` | `default` | |
| size | 设置按钮大小 | `large` \| `middle` \| `small` | `middle` | |
| type | 设置按钮类型 | `primary` \| `dashed` \| `link` \| `text` \| `default` | `default` | |

### Events

| 事件 | 说明 | 参数 |
| --- | --- | --- |
| click | 点击按钮时的回调 | `(event: MouseEvent) => void` |

### Slots

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| default | 按钮内容 | - |
| icon | 按钮图标（与 `icon` prop 等价，插槽优先） | - |

### Methods

通过 `ref` 获取组件实例后可调用的方法。

| 方法 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| blur() | 移除焦点 | - | void |
| focus() | 获取焦点 | - | void |
| nativeElement | 原生 DOM 节点 | - | `HTMLButtonElement` |

### Design Token

<!-- 由 scripts/gen-token-table.mjs 从 registry/tokens.json 自动生成 -->

| Token | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| fontWeight | 文字字重 | `number` | `400` |
| ... | | | |

## 主题定制

```vue
<a-config-provider :theme="{ components: { Button: { fontWeight: 600 } } }">
  <a-button type="primary">Button</a-button>
</a-config-provider>
```

## FAQ

### 为什么 `size` 的默认值不是 `medium` 而是 `middle`？

为保持与 Ant Design 的 API 完全兼容，我们保留 `middle` 命名，未做「修正」。

### 与 Ant Design 有什么差异？

（列出该组件在 `COMPATIBILITY.md` §9 中登记的差异项，若无则写「无」）

## 设计指引

（可选。尺寸、间距、用色的建议。）
```

---

## 英文版模板（`index.en-US.md`）

结构完全一致，`group` 与 `subtitle` 对应英文，正文用英文撰写。

---

## 文档自检清单

- [ ] `何时使用` 是自写的，不是 antd 文案的翻译
- [ ] 每个 demo 都在 `demo/` 下有对应的 `.vue` 文件
- [ ] 每个 demo 都被 `demoTest` 覆盖（能渲染且无 warning）
- [ ] API 表包含 Props / Events / Slots / Methods 四节
- [ ] `children` 不出现在 Props 表中（已移到 Slots）
- [ ] Design Token 表来自 `registry/tokens.json`（自动生成，非手写）
- [ ] 与 antd 的差异已在本组件文档中说明
- [ ] 中英文两份都完成
- [ ] API 表与 `interface.ts` 一致（由脚本校验）
