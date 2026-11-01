<script setup lang="ts">
import { Avatar, Button, Descriptions, Divider, Drawer } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);
const personal = [
  { key: 'name', label: '姓名', children: '林晓' },
  { key: 'email', label: '邮箱', children: 'lin@example.com' },
  { key: 'city', label: '城市', children: '杭州' },
];
const work = [
  { key: 'role', label: '职位', children: '产品设计师' },
  { key: 'team', label: '部门', children: '设计团队' },
  { key: 'joined', label: '加入时间', children: '2024-03-01' },
];
</script>

<template>
  <Button @click="open = true">查看用户资料</Button>
  <Drawer title="用户资料" size="min(100%, 520px)" :open="open" @close="open = false">
    <div class="profile-heading">
      <Avatar :size="64">林</Avatar>
      <div>
        <h3>林晓</h3>
        <p>产品设计师 · 设计团队</p>
      </div>
    </div>
    <Descriptions title="基本信息" :column="1" :items="personal" />
    <Divider />
    <Descriptions title="工作信息" :column="1" :items="work" />
    <template #footer>
      <div class="profile-footer">
        <Button class="profile-close" @click="open = false">关闭资料</Button>
      </div>
    </template>
  </Drawer>
</template>

<style scoped>
.profile-heading {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}
.profile-heading h3 {
  margin: 0 0 4px;
}
.profile-heading p {
  margin: 0;
}
.profile-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
