<script setup lang="ts">
import {
  Avatar,
  type AvatarConfig,
  AvatarGroup,
  type AvatarGroupRef,
  type AvatarRef,
  ConfigProvider,
} from '@apollo-design/ui';
import { ref } from 'vue';

const instance = ref<AvatarRef | null>(null),
  group = ref<AvatarGroupRef | null>(null);
const image = ref(true),
  icon = ref(true),
  clicks = ref(0),
  errors = ref(0);
const config: AvatarConfig = { className: 'public-avatar', style: { marginInline: '3px' } };
const onClick = (event: MouseEvent) => {
  event.preventDefault();
  clicks.value++;
};
const onError = (event: Event) => {
  errors.value += event.type === 'error' ? 1 : 0;
};
const noFallback = (event: Event): boolean => event.type !== 'error';
const Group = Avatar.Group;
</script>
<template>
  <ConfigProvider :components="{avatar:config}">
    <Avatar ref="instance" src="data:image/png,invalid" :before-fallback="noFallback" @click.once="onClick" @error="onError" :style="[{paddingInline:'2px'}]">
      <template v-if="image" #image><svg width="24" height="24" aria-hidden="true"/><strong>Image tail</strong>0</template>
      <template v-if="icon" #icon><svg width="20" height="20" aria-hidden="true"/><span>Icon tail</span>0</template>
      Default
    </Avatar>
    <AvatarGroup ref="group" :size="{xs:24,md:48}" :max="{count:1,popover:{trigger:'click',classNames:()=>({root:'business-popup'})}}"><Avatar>A</Avatar><Avatar>B</Avatar></AvatarGroup>
    <Group :size="0"><Avatar>Zero</Avatar></Group>
    <button type="button" @click="image=!image;icon=!icon">Change content</button>
    <output>{{clicks}}/{{errors}} {{instance?.nativeElement?.tagName}} {{group?.nativeElement?.tagName}}</output>
  </ConfigProvider>
</template>
