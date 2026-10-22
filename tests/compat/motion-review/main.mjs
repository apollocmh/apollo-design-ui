// 测试 Oracle：同一浏览器、相同 API 场景；不覆盖任何动效样式。

import { Menu, message, notification } from '@apollo-design/ui';
import {
  Menu as ReactMenu,
  message as reactMessage,
  notification as reactNotification,
} from 'antd';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { createApp, h, ref } from 'vue';
import '@apollo-design/theme/tokens.css';
import '@apollo-design/ui/style.css';

const items = [
  {
    key: 'outer',
    label: 'Outer',
    children: [
      { key: 'one', label: 'One' },
      { key: 'inner', label: 'Inner', children: [{ key: 'two', label: 'Two' }] },
    ],
  },
];
const initial = { mode: 'inline', inlineCollapsed: false, openKeys: [] };
const side = new URLSearchParams(location.search).get('side');

function api(notices, messages, setMenu) {
  window.review = {
    notice: (key, placement = 'topRight') =>
      notices.open({
        key,
        title: key,
        description: 'A notification with measured height.',
        duration: 0,
        placement,
      }),
    message: (key) => messages.open({ key, content: key, duration: 0 }),
    clear: () => {
      notices.destroy();
      messages.destroy();
    },
    menu: setMenu,
  };
}

if (side === 'react') {
  function Host() {
    const [notices, noticeHolder] = reactNotification.useNotification({ stack: false });
    const [messages, messageHolder] = reactMessage.useMessage();
    const [menu, setMenu] = React.useState(initial);
    api(notices, messages, (patch) => setMenu((previous) => ({ ...previous, ...patch })));
    return React.createElement(
      React.Fragment,
      null,
      noticeHolder,
      messageHolder,
      React.createElement(ReactMenu, {
        items,
        ...menu,
        style: { width: 280 },
        onOpenChange: (openKeys) => setMenu((previous) => ({ ...previous, openKeys })),
      }),
    );
  }
  createRoot(document.querySelector('#app')).render(React.createElement(Host));
} else {
  createApp({
    setup() {
      const [notices, noticeHolder] = notification.useNotification({ stack: false });
      const [messages, messageHolder] = message.useMessage();
      const menu = ref(initial);
      api(notices, messages, (patch) => {
        menu.value = { ...menu.value, ...patch };
      });
      return () => [
        noticeHolder(),
        messageHolder(),
        h(Menu, {
          items,
          ...menu.value,
          style: { width: '280px' },
          'onUpdate:openKeys': (openKeys) => {
            menu.value = { ...menu.value, openKeys };
          },
        }),
      ];
    },
  }).mount('#app');
}
