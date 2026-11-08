# @apollo-design/locale

Apollo Design 的组件语言数据与 Vue 语言上下文，包含 73 个语言包及对应的类型定义。应用通常把语言数据传给 UI 的 `ConfigProvider`。

## 安装

```bash
npm install @apollo-design/locale @apollo-design/ui @apollo-design/theme vue
```

## 切换语言

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { ConfigProvider, Pagination } from '@apollo-design/ui';
import { en_US, zh_CN } from '@apollo-design/locale';

const chinese = ref(true);
</script>

<template>
  <ConfigProvider :locale="chinese ? zh_CN : en_US">
    <Pagination :total="100" show-size-changer />
  </ConfigProvider>
</template>
```

样式按 UI 包的说明引入。语言包从包根具名导入，如 `zh_CN`、`en_US`、`ja_JP`；不提供 `@apollo-design/locale/zh_CN` 子路径。

## 自定义组件与静态服务

- `Locale` 及组件分片类型用于描述语言数据。
- `useLocale(name, defaultLocale?)` 在 Vue `setup()` 中读取当前组件分片，返回两个计算引用：分片与语言码。脚本中使用 `.value`。
- Provider 替换和字段更新会传播到消费者；组件树之间保持各自的语言上下文。
- `LocaleProvider` 是保留的旧入口，新应用使用 UI 的 `ConfigProvider`。
- `useConfirmLocale`、`changeConfirmLocale`、`getConfirmLocale` 服务于命令式确认弹窗；模块级静态服务不自动具备调用方组件树的身份。

日期格式与 Day.js 语言资源由应用按日期组件指南配置；组件文案和日期库格式不是同一项设置。

## 数据维护

基础语言数据来自 Ant Design 的 MIT 许可语言资源，Apollo 扩展由 `registry/source/locale-apollo-overrides.json` 合入生成。保留来源和许可信息，修改源数据后通过生成脚本更新；不直接编辑生成目录。语言字段与可选性以当前导出类型为准。

## 文档与维护

[公开导出](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/locale/src/index.ts) · [项目规范](https://github.com/apollocmh/apollo-design-ui/blob/master/AGENTS.md) · [测试要求](https://github.com/apollocmh/apollo-design-ui/blob/master/TESTING.md)
