<script setup lang="ts">
import { h, ref, shallowRef } from 'vue';
import message from '../../../message';
import type { ConfigOptions } from '../../../message/interface';
import notification from '../../index';
import type { NotificationConfig } from '../../interface';

const props = withDefaults(defineProps<{ scope?: string }>(), { scope: 'notices' });
const messageConfig = shallowRef<ConfigOptions>({ duration: 0 });
const notificationConfig = shallowRef<NotificationConfig>({
  duration: 0,
  placement: props.scope === 'left' ? 'topLeft' : 'topRight',
  stack: { threshold: 2 },
});
const [messages, MessageHolder] = message.useMessage(() => messageConfig.value);
const [notifications, NotificationHolder] = notification.useNotification(
  () => notificationConfig.value,
);
const MessagePanel = message._InternalPanelDoNotUseOrYouWillBeFired;
const NotificationPanel = notification._InternalPanelDoNotUseOrYouWillBeFired;
const panel = ref<InstanceType<typeof NotificationPanel> | null>(null);
const closed = ref(0);
const description = (text: string) =>
  h('section', [
    h('p', text),
    h('input', { 'aria-label': `${props.scope} draft`, defaultValue: 'seed' }),
  ]);
const open = () => {
  messages.success({ key: 'message', content: 'Current message' });
  notifications.info({
    key: 'notification',
    title: 'Current notification',
    description: description('First content'),
    actions: 0,
    onClose: () => closed.value++,
  });
};
const update = () =>
  notifications.info({
    key: 'notification',
    title: 'Updated notification',
    description: description('Updated content'),
    actions: 0,
    onClose: () => closed.value++,
  });
const stack = () => {
  for (let index = 0; index < 4; index++)
    notifications.success({ key: `stack-${index}`, title: `Stack ${index}`, duration: 0 });
};
const clear = () => {
  messages.destroy();
  notifications.destroy();
};
defineExpose({ messages, notifications });
</script>
<template>
  <section :data-scope="scope">
    <button :id="`${scope}-open`" type="button" @click="open">Open notices</button>
    <button :id="`${scope}-update`" type="button" @click="update">Update key</button>
    <button :id="`${scope}-stack`" type="button" @click="stack">Stack notices</button>
    <button :id="`${scope}-clear`" type="button" @click="clear">Clear notices</button>
    <MessageHolder />
    <NotificationHolder />
    <MessagePanel content="Pure message" :id="`${scope}-pure-message`" class="native-pure-message" @click="event => event.preventDefault()"><template #icon>0</template></MessagePanel>
    <NotificationPanel ref="panel" title="Pure notification" :id="`${scope}-pure-notification`" @close="closed++" @click="event => event.preventDefault()"><template #description>0</template><template #actions>0</template></NotificationPanel>
    <output :id="`${scope}-closed`">{{ closed }}</output>
  </section>
  <!-- @vue-expect-error Rich titles use the native #title slot. -->
  <NotificationPanel v-if="false" :title="h('strong', 'Invalid prop')" />
</template>
