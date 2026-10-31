<script setup lang="ts">
import { ref } from 'vue';
import { Modal } from '../../index';

const ModalView = Modal;
const open = ref(false);
const content = ref('First content');
const modal = ref<InstanceType<typeof ModalView> | null>(null);
const panel = ref<HTMLElement | null>(null);
const events = ref<string[]>([]);
const onOk = (event: Event) => {
  event.preventDefault();
  events.value.push('ok');
};
</script>

<template>
  <button id="native-open" type="button" @click="open = true">Open modal</button>
  <button id="native-update" type="button" @click="content = 'Updated content'">Update body</button>
  <ModalView ref="modal" v-model:open="open" :width="{ xs: '300px', md: '600px' }" title="Native modal" id="native-modal" aria-describedby="native-description" :panel-ref="element => panel = element" @ok="event => onOk(event)" @cancel="event => events.push(event.type)" @after-open-change="next => events.push(String(next))" @after-close="events.push('closed')">
    <p id="native-description">{{ content }}</p>
    <input id="native-input" aria-label="Modal input" />
    <button id="update-inside" type="button" @click="content = 'Updated content'">Update</button>
    <template #footer="{ OkBtn, CancelBtn }">
      <component :is="CancelBtn" />
      <component :is="OkBtn" />
    </template>
    <template #modalRender="{ ModalPanel }">
      <section id="native-shell"><component :is="ModalPanel" /></section>
    </template>
  </ModalView>
  <output id="native-events">{{ events.join(',') }}</output>
  <output id="native-panel-ref">{{ panel?.id }}</output>
  <!-- @vue-expect-error open is a boolean model. -->
  <ModalView v-if="false" open="invalid" />
</template>
