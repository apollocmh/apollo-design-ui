import { ConfigProvider, DropdownButton } from '@apollo-design/ui';
import { defineComponent, h, nextTick, onMounted, ref } from 'vue';
import { DownOutlined } from '../../../packages/icons/dist/index.mjs';
import DateConfirm from '../../../packages/ui/src/date-picker/demo/need-confirm.vue';
import DropdownDemo from '../../../packages/ui/src/dropdown/demo/dropdown-button.vue';
import FloatDemo from '../../../packages/ui/src/float-button/demo/content.vue';
import SearchDemo from '../../../packages/ui/src/input/demo/search-input-loading.vue';
import ModalAsync from '../../../packages/ui/src/modal/demo/async.vue';
import ModalDemo from '../../../packages/ui/src/modal/demo/basic.vue';
import PopconfirmDemo from '../../../packages/ui/src/popconfirm/demo/async.vue';
import QrDemo from '../../../packages/ui/src/qr-code/demo/status.vue';
import TableDemo from '../../../packages/ui/src/table/demo/filter.vue';
import TourDemo from '../../../packages/ui/src/tour/demo/basic.vue';
import TransferDemo from '../../../packages/ui/src/transfer/demo/basic.vue';
import UploadDemo from '../../../packages/ui/src/upload/demo/default-file-list.vue';

const ArrowDemo = defineComponent({
  setup: () => () =>
    h(
      DropdownButton,
      { menu: { items: [{ key: 'one', label: 'First action' }] }, trigger: ['click'], split: true },
      { default: () => 'Action', icon: () => h(DownOutlined) },
    ),
});
const demos = {
  date: DateConfirm,
  dropdown: DropdownDemo,
  arrow: ArrowDemo,
  float: FloatDemo,
  search: SearchDemo,
  modal: ModalDemo,
  async: ModalAsync,
  popconfirm: PopconfirmDemo,
  qr: QrDemo,
  table: TableDemo,
  tour: TourDemo,
  transfer: TransferDemo,
  upload: UploadDemo,
};
export default defineComponent({
  setup() {
    const name = ref('date');
    onMounted(() => {
      window.buttonConsumers = {
        show: async (value) => {
          if (!demos[value]) throw Error(`Unknown consumer ${value}`);
          name.value = value;
          await nextTick();
        },
      };
    });
    return () =>
      h(
        ConfigProvider,
        {
          theme: { components: { Button: { fontWeight: 600 } } },
          components: {
            button: { className: 'consumer-button', classNames: { content: 'consumer-content' } },
          },
        },
        () =>
          h(
            'main',
            {
              'data-consumer': name.value,
              style: {
                padding: '24px',
                minHeight: '600px',
                background: 'var(--apollo-color-bg-container)',
                color: 'var(--apollo-color-text)',
                fontFamily: 'var(--apollo-font-family)',
              },
            },
            [h('h1', `Button consumer ${name.value}`), h(demos[name.value], { key: name.value })],
          ),
      );
  },
});
