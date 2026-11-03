<script setup lang="ts">
import { Button, Pagination } from '@apollo-design/ui';
import { ref } from 'vue';

const current = ref(1);
const pageSize = ref(10);
const customItems = ref(false);
const customSize = ref(false);
const showTotal = ref(true);
const empty = ref(false);
const disabled = ref(false);
const label = ref('Page');
const changes = ref(0);
const sizes = ref(0);
const rootClicks = ref(0);
const nativeEvent = ref('');
const blue = ref(false);
const onRootClick = (event: MouseEvent) => {
  rootClicks.value++;
  nativeEvent.value = event instanceof MouseEvent ? event.type : 'invalid';
};
</script>

<template>
  <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px">
    <Button @click="customItems = !customItems">Toggle page slots</Button>
    <Button @click="customSize = !customSize">Toggle size slot</Button>
    <Button @click="showTotal = !showTotal">Toggle total slot</Button>
    <Button @click="empty = !empty">Toggle empty pages</Button>
    <Button @click="disabled = !disabled">Toggle pagination disabled</Button>
    <Button @click="label = label === 'Page' ? 'Current' : 'Page'">Update page label</Button>
    <Button @click="blue = !blue">Update pagination attrs</Button>
  </div>
  <Pagination id="native-pagination" v-model:current="current" v-model:pageSize="pageSize"
    :total="85" show-size-changer :disabled="disabled"
    :style="blue ? 'color:blue' : 'color:red'" aria-label="Native pagination"
    @change="changes++" @show-size-change="sizes++" @click="onRootClick">
    <template v-if="customItems" #itemRender="{ page, type, element }">
      <span v-if="!empty" :data-page-type="type" :data-page="page">
        <b v-if="type === 'page'">{{ label }} {{ page }}</b>
        <component :is="element" v-else />
      </span>
    </template>
    <template v-if="showTotal" #total="{ total, range }">
      <output data-native-total>{{ range[0] }}-{{ range[1] }} / {{ total }}</output>
    </template>
    <template v-if="customSize" #sizeChanger="{ value, onSizeChange, disabled }">
      <Button data-native-size :disabled="disabled" @click="onSizeChange(value === 10 ? 20 : 10)">
        Size {{ value }}
      </Button>
    </template>
  </Pagination>
  <output id="pagination-state" style="display: block; overflow-wrap: anywhere; margin-top: 12px">{{ JSON.stringify({ current, pageSize, changes, sizes, rootClicks, nativeEvent }) }}</output>
</template>
