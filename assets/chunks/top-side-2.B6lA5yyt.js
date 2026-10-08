const n=`<script setup lang="ts">
// 对齐 antd 的 top-side-2 demo（PLATFORM 替换：Menu → 等价原生 ul/li）
import { Layout } from '@apollo-design/ui';

const { Header, Content, Sider } = Layout;

const navItems = ['nav 1', 'nav 2', 'nav 3'];
const sideGroups = [
  { title: 'subnav 1', items: ['option1', 'option2', 'option3', 'option4'] },
  { title: 'subnav 2', items: ['option5', 'option6', 'option7', 'option8'] },
  { title: 'subnav 3', items: ['option9', 'option10', 'option11', 'option12'] },
];
<\/script>

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
        <ul class="demo-menu demo-menu-light demo-menu-inline">
          <li v-for="group in sideGroups" :key="group.title" class="demo-menu-sub">
            <div class="demo-menu-subtitle">{{ group.title }}</div>
            <ul>
              <li v-for="opt in group.items" :key="opt" class="demo-menu-item">{{ opt }}</li>
            </ul>
          </li>
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
  width: 120px;
  height: 31px;
  margin-inline-end: 24px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
}
.demo-layout-sider {
  background: #fff;
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
  background: #fff;
  border-radius: 8px;
}
.demo-menu {
  margin: 0;
  padding: 0;
  list-style: none;
}
.demo-menu-horizontal {
  display: flex;
  flex: 1;
  min-width: 0;
  gap: 24px;
}
.demo-menu-inline {
  padding: 8px;
}
.demo-menu-sub ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
.demo-menu-subtitle {
  padding: 4px 12px;
  color: rgba(0, 0, 0, 0.45);
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
