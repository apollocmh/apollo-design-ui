const n=`<script setup lang="ts">
// 对齐 antd 的 top-side demo（PLATFORM 替换：Menu → 等价原生 ul/li）
import { Layout } from '@apollo-design/ui';

const { Header, Content, Footer, Sider } = Layout;

const navItems = ['nav 1', 'nav 2', 'nav 3'];
<\/script>

<template>
  <Layout>
    <Header class="demo-layout-header">
      <div class="demo-layout-logo" />
      <ul class="demo-menu demo-menu-dark demo-menu-horizontal">
        <li v-for="item in navItems" :key="item" class="demo-menu-item">{{ item }}</li>
      </ul>
    </Header>
    <div class="demo-layout-breadcrumb">Home / List / App</div>
    <Layout>
      <Sider class="demo-layout-sider">
        <ul class="demo-menu demo-menu-light demo-menu-inline">
          <li v-for="item in navItems" :key="item" class="demo-menu-item">{{ item }}</li>
        </ul>
      </Sider>
      <Content class="demo-layout-content">
        <div class="demo-layout-card">Content</div>
      </Content>
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
.demo-layout-breadcrumb {
  padding: 16px 48px 0;
}
.demo-layout-sider {
  background: #fff;
}
.demo-layout-content {
  padding: 0 24px;
}
.demo-layout-card {
  min-height: 360px;
  padding: 24px;
  margin-block: 16px;
  background: #fff;
  border-radius: 8px;
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
.demo-menu-light .demo-menu-item {
  color: rgba(0, 0, 0, 0.88);
}
</style>
`;export{n as default};
