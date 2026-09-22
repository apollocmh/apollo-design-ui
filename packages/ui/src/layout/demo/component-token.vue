<script setup lang="ts">
// 对齐 antd 的 component-token demo
// ⚠️ PLATFORM 替换：antd 用 `ConfigProvider theme.components.Layout` 改 Component
//    Token；本仓的 Component Token 是 CSS 变量（`--apollo-layout-*`），直接在
//    根元素 style 里覆写即可（同样作用于整棵子树，与 antd 的嵌套覆盖同结构）。
import { Layout } from '@apollo-design/ui';

const { Header, Content, Sider } = Layout;

const navItems = ['nav 1', 'nav 2', 'nav 3'];
const tokenOverride = {
  '--apollo-layout-body-bg': '#fff',
  '--apollo-layout-header-bg': '#1677ff',
  '--apollo-layout-header-height': '64px',
  '--apollo-layout-header-padding': '0 24px',
  '--apollo-layout-header-color': '#fff',
  '--apollo-layout-sider-bg': '#800080',
};
</script>

<template>
  <Layout :style="tokenOverride">
    <Header class="demo-layout-header">
      <div class="demo-layout-logo" />
      <div class="demo-layout-title">Apollo Design</div>
    </Header>
    <Layout>
      <Sider width="200">
        <ul class="demo-menu demo-menu-dark demo-menu-inline">
          <li v-for="item in navItems" :key="item" class="demo-menu-item">{{ item }}</li>
        </ul>
      </Sider>
      <Content class="demo-layout-content">
        <div class="demo-layout-breadcrumb">Home / List / App</div>
        <div class="demo-layout-card">Content</div>
      </Content>
    </Layout>
  </Layout>
</template>

<style scoped>
.demo-layout-header {
  display: flex;
  align-items: center;
}
.demo-layout-logo {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 6px;
}
.demo-layout-title {
  margin-inline-start: 24px;
  font-size: 24px;
}
.demo-layout-content {
  padding: 0 24px;
}
.demo-layout-breadcrumb {
  margin-block: 16px;
}
.demo-layout-card {
  min-height: 360px;
  padding: 24px;
  background: #f5f5f5;
  border-radius: 8px;
}
.demo-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 8px;
  list-style: none;
}
.demo-menu-item {
  padding: 4px 12px;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.65);
  cursor: pointer;
}
</style>
