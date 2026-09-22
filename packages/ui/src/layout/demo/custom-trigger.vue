<script setup lang="ts">
// 对齐 antd 的 custom-trigger demo
// - `trigger={null}` 关掉内置触发器，改用 Header 里的 Button 控制（antd 同结构）
// - PLATFORM 替换：Menu → 等价原生 ul/li
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@apollo-design/icons';
import { Button, Layout } from '@apollo-design/ui';
import { h, ref } from 'vue';

const { Header, Sider, Content } = Layout;

const collapsed = ref(false);
const navItems = ['nav 1', 'nav 2', 'nav 3'];
</script>

<template>
  <Layout>
    <Sider :trigger="null" collapsible :collapsed="collapsed">
      <div class="demo-layout-logo-vertical" />
      <ul class="demo-menu demo-menu-dark demo-menu-inline">
        <li v-for="item in navItems" :key="item" class="demo-menu-item">{{ item }}</li>
      </ul>
    </Sider>
    <Layout>
      <Header class="demo-layout-header">
        <Button
          type="text"
          :icon="collapsed ? h(MenuUnfoldOutlined) : h(MenuFoldOutlined)"
          :style="{ fontSize: '16px', width: 64, height: 64 }"
          @click="collapsed = !collapsed"
        />
      </Header>
      <Content class="demo-layout-content">
        <div class="demo-layout-card">Content</div>
      </Content>
    </Layout>
  </Layout>
</template>

<style scoped>
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
  margin: 24px 16px;
  padding: 24px;
  min-height: 360px;
  background: #fff;
  border-radius: 8px;
}
.demo-layout-card {
  min-height: 280px;
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
