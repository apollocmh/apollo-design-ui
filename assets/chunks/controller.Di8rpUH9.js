const e=`<script setup lang="ts">
// 对齐 antd 的 controller demo
import { Button, Checkbox } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const checked = ref(true);
const disabled = ref(false);

const toggleChecked = () => {
  checked.value = !checked.value;
};
const toggleDisable = () => {
  disabled.value = !disabled.value;
};

const onChange = (e: { target: { checked: boolean } }) => {
  checked.value = e.target.checked;
};

const label = computed(
  () => \`\${checked.value ? 'Checked' : 'Unchecked'}-\${disabled.value ? 'Disabled' : 'Enabled'}\`,
);
<\/script>

<template>
  <div>
    <p style="margin-bottom: 20px">
      <Checkbox :checked="checked" :disabled="disabled" @change="onChange">{{ label }}</Checkbox>
    </p>
    <p>
      <Button type="primary" size="small" @click="toggleChecked">
        {{ !checked ? 'Check' : 'Uncheck' }}
      </Button>
      <Button style="margin: 0 10px" type="primary" size="small" @click="toggleDisable">
        {{ !disabled ? 'Disable' : 'Enable' }}
      </Button>
    </p>
  </div>
</template>
`;export{e as default};
