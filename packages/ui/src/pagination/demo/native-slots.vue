<script setup lang="ts">
import { Pagination } from '@apollo-design/ui';
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
    <button @click="customItems = !customItems">Toggle page slots</button>
    <button @click="customSize = !customSize">Toggle size slot</button>
    <button @click="showTotal = !showTotal">Toggle total slot</button>
    <button @click="empty = !empty">Toggle empty pages</button>
    <button @click="disabled = !disabled">Toggle pagination disabled</button>
    <button @click="label = label === 'Page' ? 'Current' : 'Page'">Update page label</button>
    <button @click="blue = !blue">Update pagination attrs</button>
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
      <button data-native-size :disabled="disabled" @click="onSizeChange(value === 10 ? 20 : 10)">
        Size {{ value }}
      </button>
    </template>
  </Pagination>
  <output id="pagination-state">{{ JSON.stringify({ current, pageSize, changes, sizes, rootClicks, nativeEvent }) }}</output>
</template>
