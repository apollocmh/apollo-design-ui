import { createApp, h, ref, shallowRef } from 'vue';
import { Portal } from '../../../packages/portal/dist/index.mjs';

const frame = document.createElement('iframe');
frame.title = 'Portal owner document';
frame.srcdoc =
  '<!doctype html><html lang="en"><head><title>Portal frame</title></head><body style="min-height:3000px"><p>Frame scroll surface</p></body></html>';
document.body.append(frame);
await new Promise((resolve) => frame.addEventListener('load', resolve, { once: true }));
const frameDocument = frame.contentDocument;
const naturalFrameWidth = frameDocument.body.getBoundingClientRect().width;
const openHost = document.createElement('section');
const closedHost = document.createElement('section');
const openRoot = openHost.attachShadow({ mode: 'open' });
const closedRoot = closedHost.attachShadow({ mode: 'closed' });
document.body.append(openHost, closedHost);
const nestedHost = document.createElement('section');
const nestedRoot = nestedHost.attachShadow({ mode: 'closed' });
closedRoot.append(nestedHost);
document.body.style.minHeight = '3000px';
const adopted = document.createElement('section');
document.body.append(adopted);
const target = shallowRef(frameDocument.body);
const firstOpen = ref(true);
const secondOpen = ref(false);
const mainOpen = ref(false);
const prevent = ref(false);
const events = ref([]);
const version = ref(0);
const app = createApp({
  setup() {
    const button = (name, action) => h('button', { type: 'button', onClick: action }, name);
    const layer = (id, opened, container) =>
      h(
        Portal,
        {
          open: opened.value,
          autoLock: true,
          getContainer: container,
          onEsc: ({ top }) => {
            events.value.push(`${id}:${top}:${version.value}`);
            if (top) opened.value = false;
          },
        },
        {
          default: () =>
            h('input', {
              'aria-label': `${id} editor`,
              'data-layer': id,
              onKeydown: (event) => {
                if (prevent.value && event.key === 'Escape') event.preventDefault();
              },
            }),
        },
      );
    return () =>
      h('section', [
        button('Frame target', () => {
          target.value = frameDocument.body;
        }),
        button('Main target', () => {
          target.value = document.body;
        }),
        button('Inline target', () => {
          target.value = false;
        }),
        button('Open shadow target', () => {
          target.value = openRoot;
        }),
        button('Closed shadow target', () => {
          target.value = closedRoot;
        }),
        button('Nested shadow target', () => {
          target.value = nestedRoot;
        }),
        button('Adopt nested host into frame', () => {
          frameDocument.body.append(nestedHost);
        }),
        button('Adopted target', () => {
          target.value = adopted;
        }),
        button('Adopt container into frame', () => {
          frameDocument.body.append(adopted);
        }),
        button('Adopt source into frame', () => {
          frameDocument.body.append(document.querySelector('#app'));
        }),
        button('Open first', () => {
          firstOpen.value = true;
        }),
        button('Open second', () => {
          secondOpen.value = true;
        }),
        button('Open main', () => {
          mainOpen.value = true;
        }),
        button('Toggle cancellation', () => {
          prevent.value = !prevent.value;
        }),
        button('Update callback', () => {
          version.value++;
        }),
        button('Unmount', () => app.unmount()),
        h('output', { 'aria-label': 'Escape log' }, events.value.join(',')),
        layer('first', firstOpen, () => target.value),
        layer('second', secondOpen, () => frameDocument.body),
        layer('main', mainOpen, () => document.body),
      ]);
  },
});
app.mount('#app');
// A closed root is deliberately retained only by this fixture, so the browser
// can inspect real controls without changing its closed encapsulation mode.
window.portalOwnerProbe = { closedRoot, openRoot, app, naturalFrameWidth };
