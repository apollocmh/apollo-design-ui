---
order: 2
title:
  zh-CN: 自动调整字符大小
  en-US: Autoset Font Size
---

对于字符型的头像，当字符串较长时，字体大小可以根据头像宽度自动调整。也可使用 `gap` 来设置字符距离左右两侧边界单位像素。

```vue
<script setup lang="ts">
// 对齐 antd 的 dynamic demo。
import { Avatar, Button } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const UserList = ['U', 'Lucy', 'Tom', 'Edward'];
const ColorList = ['#f56a00', '#7265e6', '#ffbf00', '#00a2ae'];
const GapList = [4, 3, 2, 1];
</script>
```
