<script setup lang="ts">
import { h } from 'vue';
import {
  Popconfirm,
  type PopconfirmProps,
  PopconfirmPurePanel,
  Popover,
  type PopoverProps,
  PopoverPurePanel,
  Tooltip,
  type TooltipProps,
  TooltipPurePanel,
} from '../../../index';

const tooltip: TooltipProps = { title: 0 };
const popover: PopoverProps = {
  title: h('b', 'Title'),
  content: ['Body', 0],
  autoAdjustOverflow: { adjustX: 1, shiftY: true },
};
const popconfirm: PopconfirmProps = { title: 0, description: h('i', 'Details') };
const oldRenderer = () => 'Old content';
</script>

<template>
  <Tooltip v-bind="tooltip"><button>Tooltip</button><template #title><strong>Native title</strong></template></Tooltip>
  <TooltipPurePanel :title="tooltip.title"><template #title><b>Panel title</b></template></TooltipPurePanel>
  <Popover v-bind="popover"><button>Popover</button><template #title><b>Title</b></template><template #content><input aria-label="Note" /></template></Popover>
  <PopoverPurePanel :title="popover.title" :content="popover.content"><template #title /><template #content><b>Content</b></template></PopoverPurePanel>
  <Popconfirm v-bind="popconfirm"><button>Confirm</button><template #icon><b>!</b></template><template #title><b>Title</b></template><template #description><i>Details</i></template><template #okText><b>Proceed</b></template><template #cancelText>Back</template></Popconfirm>
  <PopconfirmPurePanel :title="popconfirm.title" :description="popconfirm.description"><template #icon /><template #title /><template #description><b>Description</b></template><template #okText>Proceed</template><template #cancelText>Back</template></PopconfirmPurePanel>
  <!-- @vue-expect-error Rendering functions are replaced by #title. -->
  <Tooltip :title="oldRenderer" />
  <!-- @vue-expect-error Rendering functions are replaced by #content. -->
  <PopoverPurePanel :content="oldRenderer" />
  <!-- @vue-expect-error Rendering functions are replaced by #description. -->
  <Popconfirm :description="oldRenderer" />
  <Tooltip>
    <!-- @vue-expect-error Public slots are explicitly declared. -->
    <template #unknownContent>Unsupported</template>
  </Tooltip>
</template>
