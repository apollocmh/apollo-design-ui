<script setup lang="ts">
// 对齐 antd 的 side demo
// ⚠️ PLATFORM 替换：antd 用 Menu（本仓未落地）⇒ 用等价的原生 ul/li 导航结构。
import { Layout } from '@apollo-design/ui';

const { Header, Content, Footer, Sider } = Layout;

const navItems = ['nav 1', 'nav 2', 'nav 3'];
</script>

<template>
  <Layout>
    <Header class="demo-layout-header">
      <div class="demo-layout-logo" />
      <ul class="demo-menu demo-menu-dark demo-menu-horizontal">
        <li v-for="item in navItems" :key="item" class="demo-menu-item">{{ item }}</li>
      </ul>
    </Header>
    <Layout>
      <Sider width="200" class="demo-layout-sider">
        <ul class="demo-menu demo-menu-dark demo-menu-inline">
          <li v-for="item in navItems" :key="item" class="demo-menu-item">{{ item }}</li>
        </ul>
      </Sider>
      <Content class="demo-layout-content">Content</Content>
    </Layout>
    <Footer class="demo-layout-footer">Ant Design ©2026 Created by Ant UED</Footer>
  </Layout>
</template>

<style scoped>
.demo-layout-header {
  display: flex;
  align-items: center;
}
.demo-layout-logo {
  width: 120px;
  height: 31px;
  margin-inline-end: 24px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
}
.demo-layout-content {
  padding: 24px;
  min-height: 280px;
}
.demo-layout-footer {
  text-align: center;
}
.demo-menu {
  display: flex;
  margin: 0;
  padding: 0;
  list-style: none;
}
.demo-menu-horizontal {
  flex: 1;
  min-width: 0;
  gap: 24px;
}
.demo-menu-inline {
  flex-direction: column;
  gap: 4px;
  padding: 8px;
}
.demo-menu-item {
  padding: 4px 12px;
  border-radius: 6px;
  cursor: pointer;
}
.demo-menu-dark .demo-menu-item {
  color: rgba(255, 255, 255, 0.65);
}
.demo-menu-dark .demo-menu-item:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}
</style>
