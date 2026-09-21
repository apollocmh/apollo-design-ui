/**
 * React 侧（antd 6.6.4）的 Flex 视觉用例。
 *
 * 与 `render/cases/vue/flex.js` **逐条对应**：同名、同 props 语义、同色块。
 * ⚠️ 所有 `style` 值都写成**字符串**（React 的 dangerousStyleValue 会给裸数字补
 *    px、Vue 不会 —— 用字符串把这条平台差异从用例里排除掉）。
 */

import { Flex } from 'antd';

const box = (bg, width = '25%', height = '54px') => (
  <div style={{ width, height, backgroundColor: bg }} />
);

const boxes = (n, bg1 = '#1677ff', bg2 = '#1677ffbf', width = '25%', height = '54px') =>
  Array.from({ length: n }, (_, i) => box(i % 2 ? bg2 : bg1, width, height));

export default {
  basic: () => (
    <>
      <Flex gap="medium" vertical>
        {boxes(4)}
      </Flex>
      <Flex gap="medium">{boxes(4)}</Flex>
    </>
  ),

  vertical: () => (
    <>
      <Flex vertical>{boxes(3)}</Flex>
      <Flex orientation="vertical">{boxes(3)}</Flex>
      <Flex orientation="horizontal" vertical>
        {boxes(3)}
      </Flex>
    </>
  ),

  gap: () => (
    <>
      <Flex gap="small">{boxes(3, '#1677ff', '#1677ffbf', '80px')}</Flex>
      <Flex gap="medium">{boxes(3, '#1677ff', '#1677ffbf', '80px')}</Flex>
      <Flex gap="large">{boxes(3, '#1677ff', '#1677ffbf', '80px')}</Flex>
      <Flex gap="16px">{boxes(3, '#1677ff', '#1677ffbf', '80px')}</Flex>
    </>
  ),

  wrap: () => (
    <Flex wrap gap="small">
      {boxes(12, '#1677ff', '#1677ffbf', '120px')}
    </Flex>
  ),

  'justify-align': () => (
    <>
      <div style={{ width: '100%', height: '120px', border: '1px solid #40a9ff' }}>
        <Flex justify="space-between" align="center" style={{ height: '100%' }}>
          {boxes(3, '#1677ff', '#1677ffbf', '60px')}
        </Flex>
      </div>
      <div style={{ width: '100%', height: '120px', border: '1px solid #40a9ff' }}>
        <Flex justify="center" align="flex-end" style={{ height: '100%' }}>
          {boxes(3, '#1677ff', '#1677ffbf', '60px')}
        </Flex>
      </div>
      <Flex vertical justify="space-around" align="center" style={{ height: '160px' }}>
        {boxes(3, '#1677ff', '#1677ffbf', '40px')}
      </Flex>
    </>
  ),
};
