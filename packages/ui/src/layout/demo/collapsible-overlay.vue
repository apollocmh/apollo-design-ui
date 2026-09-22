<script setup lang="ts">
// 对齐 antd 的 collapsible-overlay demo（PLATFORM 替换：Menu → 等价原生 ul/li）
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@apollo-design/icons';
import { Layout } from '@apollo-design/ui';
import { h, ref } from 'vue';

const { Header, Content, Footer, Sider } = Layout;

const collapsed = ref(false);
const navItems = ['nav 1', 'nav 2', 'nav 3', 'nav 4'];

// ⚠️ 同上：模板内联箭头函数参数会隐式 any
const onCollapse = (c: boolean) => {
  collapsed.value = c;
};
</script>

<template>
  <Layout class="demo-layout-overlay">
    <Sider
      collapsible
      :collapsed="collapsed"
      collapsed-width="0"
      class="demo-layout-overlay-sider"
      :trigger="collapsed ? h(MenuUnfoldOutlined) : h(MenuFoldOutlined)"
      :on-collapse="onCollapse"
    >
      <div class="demo-layout-logo-vertical" />
      <ul class="demo-menu demo-menu-dark demo-menu-inline">
        <li v-for="item in navItems" :key="item" class="demo-menu-item">{{ item }}</li>
      </ul>
    </Sider>
    <Layout>
      <Header class="demo-layout-header" />
      <Content class="demo-layout-content">
        <div class="demo-layout-card">Content</div>
      </Content>
      <Footer class="demo-layout-footer">Ant Design ©2026 Created by Ant UED</Footer>
    </Layout>
  </Layout>
</template>

<style scoped>
.demo-layout-overlay {
  position: relative;
  min-height: 360px;
}
.demo-layout-overlay-sider {
  position: absolute;
  top: 0;
  bottom: 0;
  inset-inline-start: 0;
  z-index: 10;
}
.demo-layout-logo-vertical {
  height: 32px;
  margin: 16px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
}
.demo-layout-header {
  padding: 0;
  background: #fff;
}
.demo-layout-content {
  margin: 24px 16px 0;
}
.demo-layout-card {
  min-height: 280px;
  padding: 24px;
  background: #fff;
  border-radius: 8px;
}
.demo-layout-footer {
  text-align: center;
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
  white-space: nowrap;
}
</style>
