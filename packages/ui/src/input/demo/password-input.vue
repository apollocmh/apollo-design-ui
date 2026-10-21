<script setup lang="ts">
// 密码可见性切换：action / visibilityToggle / iconRender
import { EyeInvisibleOutlined, EyeOutlined } from '@apollo-design/icons';
import { InputPassword } from '@apollo-design/ui';
import { h, ref, type VNodeChild } from 'vue';

const value = ref('');
const controlledValue = ref('Apollo Design');
const visible = ref(false);

function onVisibleChange(next: boolean): void {
  visible.value = next;
}

function renderIcon(isVisible: boolean): VNodeChild {
  return isVisible ? h(EyeOutlined) : h(EyeInvisibleOutlined);
}
</script>

<template>
  <div
    style="display: flex; flex-direction: column; gap: 12px; width: 320px; font-family: sans-serif"
  >
    <InputPassword v-model:value="value" placeholder="默认：点击图标切换" />
    <InputPassword placeholder="hover 触发切换" action="hover" />
    <InputPassword placeholder="隐藏切换按钮" :visibility-toggle="false" />
    <InputPassword
      v-model:value="controlledValue"
      placeholder="受控显隐"
      :visibility-toggle="{ visible, onVisibleChange }"
    />
    <InputPassword placeholder="自定义图标" :icon-render="renderIcon" />
    <div style="font-size: 12px; color: #999">受控状态：{{ visible ? '明文' : '密文' }}</div>
  </div>
</template>
