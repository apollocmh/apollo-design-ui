<script setup lang="ts">
// 密码可见性切换：action / visibilityToggle / icon 作用域插槽
import { EyeInvisibleOutlined, EyeOutlined } from '@apollo-design/icons';
import { InputPassword } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref('');
const controlledValue = ref('Apollo Design');
const visible = ref(false);

function onVisibleChange(next: boolean): void {
  visible.value = next;
}
</script>

<template>
  <div
    style="display: flex; flex-direction: column; gap: 12px; width: min(100%, 320px)"
  >
    <InputPassword v-model:value="value" placeholder="默认：点击图标切换" />
    <InputPassword placeholder="hover 触发切换" action="hover" />
    <InputPassword placeholder="隐藏切换按钮" :visibility-toggle="false" />
    <InputPassword
      v-model:value="controlledValue"
      placeholder="受控显隐"
      :visibility-toggle="{ visible, onVisibleChange }"
    />
    <InputPassword placeholder="自定义图标">
      <template #icon="{ visible: revealed }">
        <EyeOutlined v-if="revealed" />
        <EyeInvisibleOutlined v-else />
      </template>
    </InputPassword>
    <div style="font-size: 12px; color: var(--apollo-color-text-secondary)">受控状态：{{ visible ? '明文' : '密文' }}</div>
  </div>
</template>
