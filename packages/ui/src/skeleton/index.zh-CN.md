---
category: 反馈
title: Skeleton
subtitle: 骨架屏
---

# Skeleton 骨架屏

按预期结构显示加载占位。`loading`由调用者控制；组件不发请求，也不自动完成加载。

## 代码演示

原八个示例保留，并新增可切换主题与原生变量的示例。查看加载开关、独立元素、完整内容和当前组件Token。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Skeleton } from '@apollo-design/ui';
const loading = ref(true);
const draft = ref('保留业务数据');
</script>
<template>
  <button type="button" @click="loading = !loading">切换加载</button>
  <Skeleton :loading="loading" avatar>
    <input v-model="draft" aria-label="业务输入" />
  </Skeleton>
</template>
```

## API

### Skeleton Props

| 属性 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| active | 微光动画，遵守减少动画与源motion:false | boolean | false |
| loading | 只有false显示真实内容；未传/undefined均显示骨架 | boolean | — |
| prefixCls | 当前类名前缀 | string | apollo-skeleton |
| avatar | 头像块及单元素配置 | boolean / SkeletonAvatarProps | false |
| title | 标题块配置 | boolean / SkeletonTitleProps | true |
| paragraph | 段落块配置 | boolean / SkeletonParagraphProps | true |
| round | 标题与段落使用胶囊圆角 | boolean | false |
| classNames | 六语义落点的类；函数读取当前`{ props }` | SkeletonSemanticValue&lt;SkeletonSemanticClassNames&gt; | — |
| styles | 六语义落点的样式；函数读取当前`{ props }` | SkeletonSemanticValue&lt;SkeletonSemanticStyles&gt; | — |

### 独立子组件 Props

具名`SkeletonAvatar/SkeletonButton/SkeletonInput/SkeletonImage/SkeletonNode`与静态`Skeleton.Avatar/Button/Input/Image/Node`指向同一组件。

| 属性 | 适用 | 说明 |
|---|---|---|
| prefixCls | 全部 | 当前前缀 |
| active | 全部 | 微光动画，默认false |
| classNames / styles | 全部 | 对象形式，root为外层div，content为内层占位/内容 |
| size | Avatar | small / medium / middle / large / 既有default别名 / 非负有限像素数；默认取Provider componentSize |
| shape | Avatar | circle（默认）/ square |
| size | Button / Input | small / medium / middle / large / 既有default别名；默认取Provider componentSize |
| shape | Button | circle / square / round / default；缺省不加形状类 |
| block | Button / Input | 撑满一行，默认false |
| internalClassName | Node | 已有内容类覆盖；空值使用默认node类，Image内部用它选择image类 |

`size="default"`仍保留既有废弃告警，使用medium。根className别名已移除；内层尺寸/样式使用`styles.content`。

### 块配置

avatar/title/paragraph配置中的`prefixCls/className/style`是数据字段，保留并与对应语义合并；语义样式最后覆盖配置style，类拼接。

| 字段 | 适用 | 说明 |
|---|---|---|
| size / shape | avatar | 尺寸与circle/square；默认large，存在title且无paragraph时为square，否则circle |
| width | title | 数字像素或CSS字符串；无头像且有段落时38%，两者都有时50%，否则不设 |
| rows | paragraph | 默认无头像且有title时3，否则2；非有限/负值为空，有限正小数截断 |
| width | paragraph | 数组逐行，单值只作用最后一行；无头像或无title时默认末行61% |

非有限数值长度忽略，0保留。avatar是单个占位元素，使用主`classNames.avatar/styles.avatar`，不接受独立双层组件的classNames/styles配置。

### 原生 attrs、Provider与优先级

六组件的id/data/ARIA/tabindex/原生事件均落真实根。Vue字符串、数组、对象class/style有效；原生样式最后覆盖，子组件content使用独立语义落点。主`loading=false`没有根，attrs不会复制到业务槽；需要持久宿主时自行包裹。

主组件读取当前`components.skeleton`的className/style/classNames/styles，配置替换、删除和恢复即时生效。五个子组件消费全局前缀、适用尺寸和源主题；主六槽配置不套入子组件两槽。最近Provider与实例隔离，RTL即时更新。任意自定义前缀仍需对应静态CSS。

### Slots / Emits / v-model

| 组件 / 槽 | 说明 |
|---|---|
| Skeleton default | loading=false时直接渲染完整真实内容，无包裹 |
| SkeletonNode default | 当前完整自定义内容，原生编辑器不会因周边样式/主题改变重挂 |
| SkeletonImage default | 有槽时优先，含有意空槽；无槽显示原内置SVG |

无业务emits或v-model，loading受控。原生监听收到DOM事件。主六语义落点为root/header/section/avatar/title/paragraph；子组件为root/content。

### Expose

仅主Skeleton公开`nativeElement: HTMLDivElement | null`。loading=false或卸载后为null。正文loading开关时会卸载，数据应保存在调用者响应状态中；不承诺卸载后的节点或焦点身份。

### 组件Token

全部形态读取当前`theme.components.Skeleton`，移除/恢复响应；现代渐变字段优先既有别名，再回退当前Alias。对应`--apollo-skeleton-*`变量可在根原生style覆盖。

| Token | 类型 | 默认来源 |
|---|---|---|
| gradientFromColor | string | colorFillContent |
| gradientToColor | string | colorFill |
| color（既有deprecated别名）| string | gradientFromColor |
| colorGradientEnd（既有deprecated别名）| string | gradientToColor |
| titleHeight | number / CSS长度string | controlHeight / 2 |
| blockRadius | number | borderRadiusSM |
| paragraphMarginTop | number | marginLG + marginXXS |
| paragraphLiHeight | number | controlHeight / 2 |

### 无障碍、SSR与样式

加载根为aria-busy=true，header/section装饰内容aria-hidden，空占位标题不进入可访问树；可通过原生attrs提供role/名称。Node/Image真实槽内容保持可访问，内置SVG为装饰图。active遵守prefers-reduced-motion与源motion:false，不自动加live播报。

SSR不依赖window；默认槽和当前主题在服务端可渲染，水合与生产浏览器验收状态以完整清单为准。样式入口：`@apollo-design/ui/skeleton/style.css`。破坏性变更和旧/新写法见仓库`docs/migrations/skeleton-contracts.md`；本轮实际命令、证据与未验边界见`docs/audit/2026-10-27-skeleton-contract-audit.md`。
