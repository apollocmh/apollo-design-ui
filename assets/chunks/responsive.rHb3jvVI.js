const n=`<script setup lang="ts">
// 对齐 antd 的 responsive demo（PLATFORM 替换：Menu → 等价原生 ul/li）
// ⚠️ antd 在 onBreakpoint / onCollapse 里 console.log —— 我们改成展示在 Footer，
//    「不产生副作用」是 demo 的硬约束。
import { Layout } from '@apollo-design/ui';
import { ref } from 'vue';

const { Header, Content, Footer, Sider } = Layout;

const navItems = ['nav 1', 'nav 2', 'nav 3', 'nav 4'];
const broken = ref(false);
const collapsed = ref(false);
const collapseType = ref('-');

// ⚠️ 模板内联箭头函数的参数会隐式 any（lint:types 报 TS7006）—— 提到 script 里
const onBreakpoint = (b: boolean) => {
  broken.value = b;
};
const onCollapse = (c: boolean, t: 'clickTrigger' | 'responsive') => {
  collapsed.value = c;
  collapseType.value = t;
};
<\/script>

<template>
  <Layout>
    <Sider
      breakpoint="lg"
      :collapsed-width="0"
      :on-breakpoint="onBreakpoint"
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
        <div class="demo-layout-card">
          <p>below breakpoint: {{ broken }}</p>
          <p>collapsed: {{ collapsed }}（来源：{{ collapseType }}）</p>
        </div>
      </Content>
      <Footer class="demo-layout-footer">Ant Design ©2026 Created by Ant UED</Footer>
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
  margin: 24px 16px 0;
}
.demo-layout-card {
  min-height: 360px;
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
`;export{n as default};
