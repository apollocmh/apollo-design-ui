<script setup lang="ts">
import { Layout } from '@apollo-design/ui';
import { ref } from 'vue';

const { Header, Content, Footer, Sider } = Layout;
const withSider = ref(false);
</script>
<template>
  <div>
    <label><input v-model="withSider" type="checkbox" /> Include sidebar</label>
    <Layout class="demo-basic">
      <Header>Header</Header>
      <Layout v-if="withSider"><Sider width="25%">Sider</Sider><Content class="demo-basic-content">Content</Content></Layout>
      <Content v-else class="demo-basic-content">Content</Content>
      <Footer>Footer</Footer>
    </Layout>
  </div>
</template>
<style scoped>
.demo-basic { overflow: hidden; border-radius: var(--apollo-border-radius-lg); text-align: center; }
.demo-basic-content { min-height: 120px; padding: 24px; background: var(--apollo-color-primary-bg); }
</style>
