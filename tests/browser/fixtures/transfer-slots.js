import '@apollo-design/theme/tokens.css';
import '@apollo-design/ui/style.css';
import { createApp, h } from 'vue';
import CustomItem from '../../../packages/ui/src/transfer/demo/custom-item.vue';
import TableTransfer from '../../../packages/ui/src/transfer/demo/table-transfer.vue';
import TreeTransfer from '../../../packages/ui/src/transfer/demo/tree-transfer.vue';

const name = new URLSearchParams(location.search).get('demo') ?? 'custom';
const Demo = { custom: CustomItem, table: TableTransfer, tree: TreeTransfer }[name];
createApp({ render: () => h('main', { style: 'padding: 32px' }, [h(Demo)]) }).mount('#app');
