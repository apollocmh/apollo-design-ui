<script setup lang="ts">
import { SpaceAddon, SpaceCompact } from '../../index';
import { BTN_PRIMARY } from './_standin';

/**
 * ⚠️ Space / Space.Compact / Space.Addon 的 Component Token **是空的**
 *    （antd 的 `ComponentToken` 就是空接口，`prepareComponentToken` 返回 `{}`）。
 *    所以 `theme.components.Space` **没有任何可覆盖的字段** —— 这不是我们没做，
 *    是上游本来就没有（见 `style/token.ts` 的文件头与 `README.md` §5.3）。
 *
 * 这个 demo 演示的是**等价的临时手段**：零运行时架构下，Addon 的规则消费的是
 * Alias 层变量（`color:var(--apollo-color-text)`），所以**就地重声明该变量**
 * 就能达到 antd 那边 `theme.components.Addon.colorText` 的效果。
 *
 * 变量声明在 Addon 自己身上，作用域与 antd 的「只影响 Addon」一致。
 */
const ADDON_COLOR_TEXT_BLUE = { '--apollo-color-text': 'blue' } as const;
</script>

<template>
  <SpaceCompact>
    <SpaceAddon :style="ADDON_COLOR_TEXT_BLUE">Addon</SpaceAddon>
    <button type="button" :style="BTN_PRIMARY">Button</button>
  </SpaceCompact>
</template>
