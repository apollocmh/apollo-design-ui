<script setup lang="ts">
import { Popover } from '../../index';

const invalidPopup = (_open: boolean) => {};
const invalidOpen = (_event: MouseEvent) => {};
</script>

<template>
  <!-- @vue-expect-error Popup clicks carry a MouseEvent. -->
  <Popover title="Title" @popup-click="invalidPopup"><button>Invalid click</button></Popover>
  <!-- @vue-expect-error Open proposals carry a boolean. -->
  <Popover title="Title" @open-change="invalidOpen"><button>Invalid open</button></Popover>
</template>
