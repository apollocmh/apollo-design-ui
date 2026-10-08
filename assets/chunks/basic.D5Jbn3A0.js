const n=`<script setup lang="ts">
// 对齐 antd 的 basic demo。
//
// ⚠️ 上游的 \`Calendar\` 不传 \`value\` ⇒ 内部取 \`getNow()\`（默认「今天」）。
//    demo 是给人看的，保持这个行为；**视觉/契约用例**则必须显式传 \`value\`（否则会 flaky）。

import type { CalendarEmits } from '@apollo-design/ui';
import { Calendar } from '@apollo-design/ui';

const onPanelChange: CalendarEmits['panelChange'] = (value, mode) => {
  console.log(value.format('YYYY-MM-DD'), mode);
};
<\/script>

<template>
  <Calendar @panel-change="onPanelChange" />
</template>
`;export{n as default};
