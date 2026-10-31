<script setup lang="ts">
import { type CSSProperties, ref, shallowRef } from 'vue';
import { Affix, type AffixRef } from '../../../affix';
import { Anchor, AnchorLink, type AnchorLinkInfo } from '../../index';

const target = ref<HTMLElement | null>(null);
const affix = ref<AffixRef | null>(null);
const style = shallowRef<CSSProperties>({ color: undefined, '--native-anchor': 'yes' });
const click = (event: MouseEvent, link: AnchorLinkInfo) => {
  if (link.href === '#cancelled') event.preventDefault();
};
const change = (link: string) => link.toUpperCase();
</script>

<template>
  <div ref="target">
    <Affix ref="affix" :target="() => target" :offset-top="0" @change="(fixed) => fixed.valueOf()">
      <button @click="affix?.updatePosition()">Update geometry</button>
    </Affix>
    <Anchor :get-container="() => target" :affix="false" :styles="{ itemTitle: style }" @click="click" @change="change">
      <AnchorLink href="#native-a" @click="click">
        <template #title><span>Native title</span></template>
        <AnchorLink href="#native-b" :title="0" />
      </AnchorLink>
    </Anchor>
    <!-- @vue-expect-error offsetTop is numeric -->
    <Affix offset-top="10px" />
    <!-- @vue-expect-error click receives an actual MouseEvent -->
    <Anchor @click="(event: string) => event.toUpperCase()" />
    <!-- @vue-expect-error href is required on the real Link constructor -->
    <AnchorLink title="Missing href" />
  </div>
</template>
