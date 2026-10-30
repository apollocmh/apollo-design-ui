import { getGlobalEscStack, useOverlay } from '@apollo-design/overlay';
import { createApp, defineComponent, h, ref, Teleport, watch } from 'vue';

const trackedTypes = new Set([
  'keydown',
  'compositionend',
  'pointerdown',
  'mousedown',
  'contextmenu',
]);
function track(win) {
  const listeners = new Map();
  let baseline = new Map();
  const add = win.addEventListener;
  const remove = win.removeEventListener;
  win.addEventListener = (type, listener, options) => {
    if (trackedTypes.has(type)) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(listener);
    }
    add.call(win, type, listener, options);
  };
  win.removeEventListener = (type, listener, options) => {
    listeners.get(type)?.delete(listener);
    remove.call(win, type, listener, options);
  };
  const count = () =>
    [...listeners].reduce(
      (sum, [type, entries]) =>
        sum + [...entries].filter((listener) => !baseline.get(type)?.has(listener)).length,
      0,
    );
  count.markBaseline = () => {
    baseline = new Map([...listeners].map(([type, entries]) => [type, new Set(entries)]));
  };
  return count;
}

const frame = document.getElementById('frame');
await new Promise((resolve) => {
  frame.addEventListener('load', resolve, { once: true });
  frame.srcdoc = '<!doctype html><html lang="en"><body><h1>Popup document</h1></body></html>';
});
const doc = frame.contentDocument;
const parentListeners = track(window);
const frameListeners = track(frame.contentWindow);
const active = new Set();

function rig(id, options = {}, popupHost = document.body) {
  let api;
  const app = createApp(
    defineComponent({
      setup() {
        api = useOverlay({ action: 'click', ...options });
        watch(
          api.popupRef,
          (popup) => {
            if (!popup || popup.ownerDocument === document) return;
            const editor = popup.ownerDocument.createElement('input');
            editor.setAttribute('aria-label', 'Frame editor');
            popup.append(editor);
          },
          { flush: 'post' },
        );
        return () =>
          h('section', [
            h('button', { id: `${id}-trigger`, ref: api.targetRef, ...api.targetProps.value }, id),
            api.open.value
              ? h(Teleport, { to: popupHost }, [
                  h('div', { ref: api.popupRef, ...api.popupProps.value }),
                ])
              : null,
          ]);
      },
    }),
  );
  app.mount(document.getElementById(id));
  const result = {
    api,
    unmount() {
      if (active.delete(result)) app.unmount();
    },
  };
  active.add(result);
  return result;
}

const first = rig('first');
const second = rig('second');
let cross;
let controlled;
const requests = [];
window.apolloOverlay = {
  markListenerBaseline() {
    parentListeners.markBaseline();
    frameListeners.markBaseline();
  },
  openPrimary() {
    first.api.setOpen(true);
    second.api.setOpen(true);
  },
  unmountSecond() {
    second.unmount();
  },
  mountCross(isControlled = false) {
    cross?.unmount();
    controlled = ref(isControlled ? true : undefined);
    requests.length = 0;
    cross = rig(
      'cross',
      { open: controlled, onOpenChange: (next) => requests.push(next) },
      doc.body,
    );
  },
  acceptClose() {
    controlled.value = false;
  },
  read() {
    return {
      first: first.api.open.value,
      second: second.api.open.value,
      cross: cross?.api.open.value,
      stack: getGlobalEscStack().size,
      requests: [...requests],
      parentListeners: parentListeners(),
      frameListeners: frameListeners(),
    };
  },
  dispose() {
    for (const instance of [...active]) instance.unmount();
  },
};
