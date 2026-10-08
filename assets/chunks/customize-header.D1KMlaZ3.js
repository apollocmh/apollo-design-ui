const n=`<script setup lang="ts">
// 对齐 antd 的 customize-header demo：整块 header 换成「标题 + 模式切换 + 年/月下拉」。
//
// ⚠️ **三处 demo 级替换**（都不是能力缺口）：
//   1. 上游用 \`Typography.Title\` + \`Flex\` —— 本仓两者都有；标题在 demo 里只是装饰
//      ⇒ 用原生 \`<h4>\` + 本仓 \`Flex\`。
//   2. 上游的 \`Radio.Group\` / \`Select\` 是 antd 的；本仓用**同名组件**（API 同形）。
//   3. \`headerRender\` 是**函数 prop**（返回 VNode）⇒ 本仓用 \`h()\` 写（\`.vue\` 模板里
//      没有「渲染一个 VNode 变量」的语法，见 \`empty/components/NodeRenderer.ts\`）。

import type { CalendarHeaderRenderConfig } from '@apollo-design/ui';
import { Calendar, Flex, RadioButton, RadioGroup, Select } from '@apollo-design/ui';
import dayjs from 'dayjs';
import localeData from 'dayjs/plugin/localeData';
import { h } from 'vue';

dayjs.extend(localeData);

const onPanelChange = (value: dayjs.Dayjs, mode: string) => {
  console.log(value.format('YYYY-MM-DD'), mode);
};

const headerRender = ({ value, type, onChange, onTypeChange }: CalendarHeaderRenderConfig) => {
  const year = value.year();
  const month = value.month();

  const yearOptions = Array.from({ length: 20 }, (_, i) => {
    const label = year - 10 + i;
    return { label, value: label };
  });

  // ⚠️ \`monthsShort()\` 来自 \`dayjs/plugin/localeData\`
  const monthOptions = value
    .localeData()
    .monthsShort()
    .map((label, index) => ({ label, value: index }));

  return h('div', { style: { padding: '8px' } }, [
    h('h4', { style: { margin: '0 0 8px' } }, 'Custom header'),
    h(Flex, { gap: 8 }, () => [
      h(
        RadioGroup,
        {
          size: 'small',
          value: type,
          onChange: (e: { target: { value: string } }) => onTypeChange(e.target.value as never),
        },
        () => [
          h(RadioButton, { value: 'month' }, () => 'Month'),
          h(RadioButton, { value: 'year' }, () => 'Year'),
        ],
      ),
      h(Select, {
        size: 'small',
        value: year,
        options: yearOptions,
        // ⚠️ \`Select\` 的 \`onChange\` 签名是 \`(value: SelectValue, option) => void\` ——
        //    \`SelectValue\` 很宽（含 \`undefined\`）⇒ 形参写 \`unknown\` 再收窄，
        //    否则「形参逆变」会报 TS2769（与 \`CalendarHeader.ts\` 同坑）
        onChange: (newYear: unknown) => onChange(value.clone().year(newYear as number)),
      }),
      h(Select, {
        size: 'small',
        value: month,
        options: monthOptions,
        onChange: (newMonth: unknown) => onChange(value.clone().month(newMonth as number)),
      }),
    ]),
  ]);
};

/** \`lineWidth: 1\` / \`lineType: 'solid'\` / \`colorBorderSecondary: '#f0f0f0'\` / \`borderRadiusLG: 8\`。 */
const wrapperStyle = {
  width: '300px',
  border: '1px solid #f0f0f0',
  borderRadius: '8px',
};
<\/script>

<template>
  <div :style="wrapperStyle">
    <Calendar :fullscreen="false" :header-render="headerRender" @panel-change="onPanelChange" />
  </div>
</template>
`;export{n as default};
