<script setup lang="ts">
import { defineComponent, h, ref, useTemplateRef } from 'vue';
import App, { useApp } from '../../index';
import type { AppComponentType } from '../../interface';

const component = ref<AppComponentType>('div');
const AppContainer = App;
const limited = ref(true);
const label = ref('Current page');
const app = useTemplateRef<InstanceType<typeof App>>('app');
const Consumer = defineComponent({
  setup() {
    const { message, notification, modal } = useApp();
    return () =>
      h('div', [
        h(
          'button',
          {
            id: 'open-message',
            onClick: () => message.info({ key: 'current', content: 'App message', duration: 0 }),
          },
          'Message',
        ),
        h(
          'button',
          {
            id: 'open-notification',
            onClick: () =>
              notification.open({
                key: 'draft',
                title: 'App notification',
                duration: 0,
                description: h('input', {
                  id: 'notice-draft',
                  defaultValue: 'seed',
                  'aria-label': 'Draft',
                }),
              }),
          },
          'Notification',
        ),
        h(
          'button',
          {
            id: 'open-modal',
            onClick: () =>
              modal.confirm({
                title: 'App confirm',
                content: h('input', {
                  id: 'modal-draft',
                  defaultValue: 'seed',
                  'aria-label': 'Modal draft',
                }),
              }),
          },
          'Modal',
        ),
      ]);
  },
});
defineExpose({
  setComponent(value: AppComponentType) {
    component.value = value;
  },
  patch() {
    limited.value = !limited.value;
    label.value = 'Updated page';
  },
  currentProps() {
    return app.value?.$props;
  },
});
</script>

<template>
  <AppContainer
    ref="app"
    :component="component"
    :message="{ maxCount: limited ? 1 : 2 }"
    :notification="{ placement: limited ? 'topLeft' : 'bottomLeft' }"
  >
    <span id="page-label">{{ label }}</span>
    <Consumer />
    {{ 0 }}
  </AppContainer>
  <!-- @vue-expect-error App validates the actual hook duration. -->
  <AppContainer v-if="false" :message="{ duration: 'long' }" />
  <!-- @vue-expect-error component supports documented native hosts or false. -->
  <AppContainer v-if="false" :component="true" />
</template>
