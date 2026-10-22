<script setup lang="ts">
/** 原生 HTML/CSS 组件示意；不加载 Demo、不挂载有副作用的组件。 */
import {
  CheckCircleFilled,
  HeartFilled,
  InboxOutlined,
  LoadingOutlined,
  PictureOutlined,
  SearchOutlined,
  SettingOutlined,
  SmileFilled,
  StarFilled,
  UserOutlined,
} from '@apollo-design/icons';
import { computed } from 'vue';

const props = defineProps<{ name: string }>();
const kinds: Record<string, string> = {
  button: 'button',
  typography: 'type',
  icon: 'icon',
  divider: 'divider',
  flex: 'flex',
  grid: 'grid',
  layout: 'layout',
  space: 'space',
  splitter: 'layout',
  anchor: 'anchor',
  'back-top': 'floating',
  breadcrumb: 'breadcrumb',
  dropdown: 'menu',
  menu: 'menu',
  pagination: 'pagination',
  steps: 'steps',
  tabs: 'tabs',
  'auto-complete': 'select',
  cascader: 'select',
  checkbox: 'checks',
  'color-picker': 'color',
  'date-picker': 'calendar',
  form: 'form',
  input: 'input',
  'input-number': 'number',
  mentions: 'input',
  radio: 'checks',
  rate: 'rate',
  segmented: 'tabs',
  select: 'select',
  slider: 'slider',
  switch: 'switch',
  'time-picker': 'time',
  transfer: 'transfer',
  'tree-select': 'tree',
  upload: 'upload',
  avatar: 'avatar',
  badge: 'avatar',
  'border-beam': 'border',
  calendar: 'calendar',
  card: 'card',
  carousel: 'image',
  collapse: 'list',
  descriptions: 'table',
  empty: 'empty',
  image: 'image',
  list: 'list',
  listy: 'list',
  masonry: 'masonry',
  popover: 'popover',
  'qr-code': 'qr',
  statistic: 'statistic',
  table: 'table',
  tag: 'tags',
  timeline: 'timeline',
  tooltip: 'popover',
  tree: 'tree',
  watermark: 'watermark',
  alert: 'notice',
  drawer: 'overlay',
  message: 'notice',
  modal: 'overlay',
  notification: 'notice',
  popconfirm: 'popover',
  progress: 'progress',
  result: 'result',
  skeleton: 'skeleton',
  spin: 'spin',
  tour: 'popover',
  affix: 'anchor',
  app: 'system',
  'config-provider': 'system',
  'float-button': 'floating',
};
const kind = computed(() => kinds[props.name] ?? 'system');
</script>

<template>
  <div class="component-preview" :class="[`preview-kind-${kind}`, `preview-for-${name}`]" aria-hidden="true" :data-preview="name">
    <div v-if="kind === 'button'" class="preview-buttons"><span>Primary</span><span>Default</span><span>Dashed</span></div>
    <div v-else-if="kind === 'type'" class="preview-type">Aa<i /><i /><i /></div>
    <div v-else-if="kind === 'icon'" class="preview-icons"><SmileFilled /><HeartFilled /><StarFilled /></div>
    <div v-else-if="kind === 'divider'" class="preview-lines"><i /><i /><hr /><i /><i /></div>
    <div v-else-if="['flex', 'space', 'grid', 'masonry', 'transfer'].includes(kind)" class="preview-blocks"><i v-for="n in (kind === 'grid' ? 12 : 6)" :key="n" /></div>
    <div v-else-if="['layout', 'overlay'].includes(kind)" class="preview-window"><header /><aside /><div class="preview-window-content"><i /><i /><i /></div><div v-if="kind === 'overlay'" class="preview-dialog"><i /><i /><span /></div></div>
    <div v-else-if="kind === 'breadcrumb'" class="preview-crumbs"><span>Home</span><b>/</b><span>Page</span><b>/</b><strong>App</strong></div>
    <div v-else-if="kind === 'pagination'" class="preview-pages"><span>‹</span><b>1</b><span>2</span><span>3</span><span>›</span></div>
    <div v-else-if="kind === 'steps'" class="preview-steps"><b>✓</b><i /><b>2</b><i /><b>3</b></div>
    <div v-else-if="kind === 'tabs'" class="preview-tabs"><header><b>Tab 1</b><span>Tab 2</span><span>Tab 3</span></header><i /><i /></div>
    <div v-else-if="['input', 'select', 'number', 'time'].includes(kind)" class="preview-field"><span>{{ kind === 'time' ? '12 : 30 : 00' : kind === 'number' ? '100' : kind === 'select' ? 'Select' : 'Input' }}</span><SearchOutlined v-if="kind === 'input'" /><b v-else>⌄</b><div v-if="kind === 'select'" class="preview-options"><i /><i /><i /></div></div>
    <div v-else-if="kind === 'checks'" class="preview-checks"><b>✓</b><i /><i /></div>
    <div v-else-if="kind === 'color'" class="preview-colors"><i v-for="n in 7" :key="n" /></div>
    <div v-else-if="kind === 'form'" class="preview-form"><label /><i /><label /><i /><span /></div>
    <div v-else-if="kind === 'calendar'" class="preview-calendar"><header>‹<b>2026 · 10</b>›</header><div><i v-for="n in 28" :key="n">{{ n }}</i></div></div>
    <div v-else-if="kind === 'rate'" class="preview-stars"><StarFilled v-for="n in 5" :key="n" /></div>
    <div v-else-if="['slider', 'progress'].includes(kind)" class="preview-track"><i /><b v-if="kind === 'slider'" /></div>
    <div v-else-if="kind === 'switch'" class="preview-switch"><i /></div>
    <div v-else-if="kind === 'upload'" class="preview-upload"><InboxOutlined /><i /><i /></div>
    <div v-else-if="kind === 'avatar'" class="preview-avatars"><UserOutlined /><span>A</span><span>B</span><b v-if="name === 'badge'">5</b></div>
    <div v-else-if="['card', 'skeleton'].includes(kind)" class="preview-card"><header><i /><i /></header><i /><i /><i /></div>
    <div v-else-if="kind === 'image'" class="preview-picture"><PictureOutlined /><span v-if="name === 'carousel'">● ● ●</span></div>
    <div v-else-if="kind === 'empty'" class="preview-empty"><InboxOutlined /><span>No data</span></div>
    <div v-else-if="kind === 'table'" class="preview-table"><i v-for="n in 16" :key="n" /></div>
    <div v-else-if="kind === 'tags'" class="preview-tags"><span>Tag</span><span>Tag</span><span>Tag</span></div>
    <div v-else-if="kind === 'statistic'" class="preview-statistic"><span>Total</span><strong>11,280</strong><small>↑ 12.8%</small></div>
    <div v-else-if="['tree', 'timeline', 'anchor', 'menu', 'list'].includes(kind)" class="preview-list"><div v-for="n in 4" :key="n"><b /><i /></div></div>
    <div v-else-if="kind === 'notice'" class="preview-notice"><CheckCircleFilled /><div><i /><i /></div></div>
    <div v-else-if="kind === 'popover'" class="preview-popover"><div><i /><i /></div><span>Hover</span></div>
    <div v-else-if="kind === 'result'" class="preview-result"><CheckCircleFilled /><i /><i /></div>
    <LoadingOutlined v-else-if="kind === 'spin'" class="preview-loading" />
    <div v-else-if="kind === 'floating'" class="preview-floating"><span>↑</span><span>＋</span><span>···</span></div>
    <div v-else-if="kind === 'qr'" class="preview-qr"><i v-for="n in 81" :key="n" :class="{ filled: n % 3 !== 0 && n % 7 !== 0 }" /></div>
    <div v-else-if="kind === 'watermark'" class="preview-watermark"><span v-for="n in 6" :key="n">Apollo</span></div>
    <div v-else-if="kind === 'border'" class="preview-border"><span>Apollo</span></div>
    <div v-else class="preview-system"><SettingOutlined /><span>Apollo Design</span></div>
  </div>
</template>

<style scoped>
.component-preview {
  --u: var(--site-preview-unit);
  height: var(--site-preview-height);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(var(--u) * 3.5);
  color: var(--site-brand);
  font-size: var(--apollo-font-size-sm);
  overflow: hidden;
  pointer-events: none;
}
.component-preview i {
  display: block;
  background: var(--site-preview-muted);
  border-radius: var(--apollo-border-radius-sm);
}
.preview-buttons {
  display: grid;
  gap: var(--u);
}
.preview-buttons span {
  display: grid;
  place-items: center;
  width: calc(var(--u) * 10);
  height: calc(var(--u) * 3.5);
  border: var(--apollo-line-width) solid var(--site-border-strong);
  color: var(--site-text-secondary);
  border-radius: var(--apollo-border-radius);
}
.preview-buttons span:first-child {
  background: var(--site-brand);
  color: var(--apollo-color-text-light-solid);
  border-color: var(--site-brand);
}
.preview-buttons span:last-child {
  border-style: dashed;
}
.preview-type {
  font-size: calc(var(--u) * 6);
  width: 100%;
  background: var(--site-bg-soft);
  padding: var(--u);
  position: relative;
}
.preview-type i {
  position: absolute;
  left: 55%;
  right: var(--u);
  height: var(--u);
  top: 30%;
}
.preview-type i:nth-child(2) {
  top: 48%;
}
.preview-type i:nth-child(3) {
  top: 66%;
  right: 20%;
}
.preview-icons {
  display: flex;
  align-items: center;
  gap: calc(var(--u) * 1.5);
  font-size: calc(var(--u) * 3.5);
}
.preview-icons > :nth-child(2) {
  color: var(--site-preview-stroke);
}
.preview-icons > :last-child {
  color: var(--site-preview-muted);
}
.preview-lines {
  width: 100%;
}
.preview-lines i {
  height: calc(var(--u) * 0.7);
  margin-block: var(--u);
}
.preview-lines i:last-child {
  width: 65%;
}
.preview-lines hr {
  border: 0;
  border-top: var(--apollo-line-width) solid var(--site-border-strong);
  margin-block: calc(var(--u) * 2);
}
.preview-blocks {
  width: 100%;
  display: grid;
  gap: var(--u);
  grid-template-columns: repeat(3, 1fr);
}
.preview-blocks i {
  height: calc(var(--u) * 4);
  background: var(--site-preview-stroke);
}
.preview-kind-grid .preview-blocks {
  grid-template-columns: repeat(4, 1fr);
}
.preview-kind-grid i {
  height: calc(var(--u) * 3);
}
.preview-kind-masonry i:nth-child(2n) {
  height: calc(var(--u) * 6);
}
.preview-kind-space .preview-blocks {
  gap: calc(var(--u) * 1.5);
}
.preview-kind-transfer .preview-blocks {
  grid-template-columns: repeat(2, 1fr);
  border: var(--apollo-line-width) solid var(--site-border);
  padding: var(--u);
}
.preview-window {
  width: 100%;
  height: calc(var(--u) * 13);
  border: var(--apollo-line-width) solid var(--site-border-strong);
  position: relative;
  border-radius: var(--apollo-border-radius-sm);
  overflow: hidden;
}
.preview-window > header {
  height: 18%;
  background: var(--site-preview-fill);
  border-bottom: var(--apollo-line-width) solid var(--site-border);
}
.preview-window > aside {
  position: absolute;
  inset: 18% auto 0 0;
  width: 22%;
  background: var(--site-preview-stroke);
}
.preview-window > .preview-window-content {
  margin: var(--u) var(--u) var(--u) 28%;
}
.preview-window .preview-window-content i {
  height: calc(var(--u) * 0.7);
  margin-bottom: var(--u);
}
.preview-window .preview-window-content i:last-child {
  height: calc(var(--u) * 4);
}
.preview-dialog {
  position: absolute;
  inset: 26% 12% 15%;
  background: var(--site-bg);
  box-shadow: var(--apollo-box-shadow-tertiary);
  border: var(--apollo-line-width) solid var(--site-border);
  padding: var(--u);
}
.preview-dialog i {
  height: calc(var(--u) * 0.7);
  margin-bottom: var(--u);
}
.preview-dialog span {
  display: block;
  margin-left: auto;
  width: 25%;
  height: var(--u);
  background: var(--site-brand);
}
.preview-for-drawer .preview-dialog {
  inset: 18% 0 0 50%;
}
.preview-crumbs,
.preview-pages,
.preview-steps,
.preview-checks,
.preview-tags {
  display: flex;
  align-items: center;
  gap: var(--u);
}
.preview-crumbs {
  color: var(--site-text-tertiary);
}
.preview-crumbs strong {
  color: var(--site-text);
}
.preview-crumbs b {
  font-weight: 400;
  opacity: 0.4;
}
.preview-pages > * {
  width: calc(var(--u) * 3);
  height: calc(var(--u) * 3);
  display: grid;
  place-items: center;
  border: var(--apollo-line-width) solid var(--site-border);
  border-radius: var(--apollo-border-radius-sm);
  color: var(--site-text-secondary);
}
.preview-pages b {
  color: var(--site-brand);
  border-color: var(--site-brand);
}
.preview-steps b {
  display: grid;
  place-items: center;
  width: calc(var(--u) * 3);
  height: calc(var(--u) * 3);
  background: var(--site-preview-fill);
  border-radius: 50%;
}
.preview-steps i {
  width: calc(var(--u) * 2);
  height: var(--apollo-line-width);
}
.preview-tabs {
  width: 100%;
}
.preview-tabs header {
  display: flex;
  gap: var(--u);
  border-bottom: var(--apollo-line-width) solid var(--site-border);
  color: var(--site-text-tertiary);
  font-size: calc(var(--u) * 1.25);
  margin-bottom: calc(var(--u) * 2);
}
.preview-tabs b {
  color: var(--site-brand);
  border-bottom: var(--apollo-line-width-bold) solid;
  padding-bottom: var(--u);
}
.preview-tabs > i {
  height: calc(var(--u) * 0.7);
  margin-top: var(--u);
}
.preview-field {
  width: 100%;
  border: var(--apollo-line-width) solid var(--site-preview-stroke);
  border-radius: var(--apollo-border-radius);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--u) calc(var(--u) * 1.5);
  position: relative;
  color: var(--site-text-tertiary);
  background: var(--site-bg);
}
.preview-options {
  position: absolute;
  top: calc(100% + var(--u));
  inset-inline: 0;
  padding: var(--u);
  background: var(--site-bg);
  box-shadow: var(--apollo-box-shadow-tertiary);
  border: var(--apollo-line-width) solid var(--site-border);
}
.preview-options i {
  height: calc(var(--u) * 0.7);
  margin: var(--u);
}
.preview-options i:first-child {
  background: var(--site-preview-fill);
}
.preview-checks > * {
  width: calc(var(--u) * 2.5);
  height: calc(var(--u) * 2.5);
  border: var(--apollo-line-width) solid var(--site-border-strong);
  background: var(--site-bg);
}
.preview-checks b {
  color: var(--apollo-color-text-light-solid);
  background: var(--site-brand);
  display: grid;
  place-items: center;
}
.preview-for-radio .preview-checks > * {
  border-radius: 50%;
}
.preview-colors {
  display: flex;
  width: 100%;
  height: calc(var(--u) * 8);
  border-radius: var(--apollo-border-radius);
  overflow: hidden;
  background: linear-gradient(135deg, var(--site-preview-fill), var(--site-brand));
}
.preview-colors i {
  width: 15%;
  opacity: 0.2;
  border-radius: 0;
}
.preview-colors i:nth-child(2n) {
  background: var(--site-bg);
}
.preview-form {
  width: 100%;
  display: grid;
  grid-template-columns: 22% 1fr;
  align-items: center;
  gap: calc(var(--u) * 1.5) var(--u);
}
.preview-form label {
  background: var(--site-preview-muted);
  height: calc(var(--u) * 0.7);
}
.preview-form i {
  border: var(--apollo-line-width) solid var(--site-border-strong);
  background: var(--site-bg);
  height: calc(var(--u) * 3);
}
.preview-form span {
  grid-column: 2;
  background: var(--site-brand);
  width: 45%;
  height: calc(var(--u) * 2.5);
  border-radius: var(--apollo-border-radius-sm);
}
.preview-calendar {
  width: 100%;
  border: var(--apollo-line-width) solid var(--site-border);
  padding: var(--u);
  border-radius: var(--apollo-border-radius);
}
.preview-calendar header {
  display: flex;
  justify-content: space-between;
  font-size: calc(var(--u) * 1.1);
  color: var(--site-text-secondary);
  margin-bottom: var(--u);
}
.preview-calendar > div {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: calc(var(--u) * 0.3);
}
.preview-calendar i {
  background: transparent;
  font-size: var(--u);
  color: var(--site-text-tertiary);
  font-style: normal;
  text-align: center;
}
.preview-calendar i:nth-child(17) {
  color: var(--apollo-color-text-light-solid);
  background: var(--site-brand);
}
.preview-stars {
  display: flex;
  font-size: calc(var(--u) * 2.75);
  gap: calc(var(--u) * 0.5);
}
.preview-stars > :last-child {
  color: var(--site-preview-muted);
}
.preview-track {
  width: 100%;
  height: var(--u);
  background: var(--site-bg-soft);
  border-radius: var(--u);
  position: relative;
}
.preview-track i {
  width: 65%;
  height: 100%;
  background: var(--site-brand);
  border-radius: inherit;
}
.preview-track b {
  position: absolute;
  left: 60%;
  top: calc(var(--u) * -0.4);
  width: calc(var(--u) * 1.8);
  height: calc(var(--u) * 1.8);
  border: var(--apollo-line-width-bold) solid var(--site-brand);
  background: var(--site-bg);
  border-radius: 50%;
}
.preview-switch {
  width: calc(var(--u) * 6);
  padding: calc(var(--u) * 0.4);
  border-radius: calc(var(--u) * 4);
  background: var(--site-brand);
}
.preview-switch i {
  width: calc(var(--u) * 2.2);
  height: calc(var(--u) * 2.2);
  margin-left: auto;
  border-radius: 50%;
  background: var(--site-bg);
}
.preview-upload {
  width: 100%;
  padding: calc(var(--u) * 1.5);
  border: var(--apollo-line-width) dashed var(--site-border-strong);
  border-radius: var(--apollo-border-radius);
  text-align: center;
}
.preview-upload > :first-child {
  font-size: calc(var(--u) * 4);
}
.preview-upload i {
  margin: var(--u) auto;
  width: 70%;
  height: calc(var(--u) * 0.6);
}
.preview-upload i:last-child {
  width: 45%;
}
.preview-avatars {
  display: flex;
  gap: var(--u);
  align-items: center;
  position: relative;
}
.preview-avatars > span,
.preview-avatars > .apollo-icon {
  width: calc(var(--u) * 4);
  height: calc(var(--u) * 4);
  background: var(--site-preview-fill);
  border-radius: 50%;
  display: grid;
  place-items: center;
}
.preview-avatars > :first-child {
  font-size: calc(var(--u) * 2.5);
}
.preview-avatars > b {
  position: absolute;
  right: calc(var(--u) * -0.5);
  top: calc(var(--u) * -0.75);
  color: var(--apollo-color-text-light-solid);
  background: var(--apollo-color-error);
  border-radius: var(--u);
  padding-inline: calc(var(--u) * 0.5);
}
.preview-card {
  width: 100%;
  border: var(--apollo-line-width) solid var(--site-border);
  border-radius: var(--apollo-border-radius);
  padding: calc(var(--u) * 1.5);
}
.preview-card header {
  display: flex;
  justify-content: space-between;
  padding-bottom: var(--u);
  margin-bottom: var(--u);
  border-bottom: var(--apollo-line-width) solid var(--site-border);
}
.preview-card header i {
  width: 35%;
  height: var(--u);
}
.preview-card > i {
  height: calc(var(--u) * 0.6);
  margin: var(--u) 0;
}
.preview-card > i:last-child {
  width: 60%;
}
.preview-kind-skeleton .preview-card {
  border: 0;
}
.preview-picture {
  width: 100%;
  height: calc(var(--u) * 12);
  display: grid;
  place-items: center;
  background: var(--site-preview-fill);
  font-size: calc(var(--u) * 6);
  color: var(--site-preview-stroke);
  border-radius: var(--apollo-border-radius);
  position: relative;
}
.preview-picture > span {
  position: absolute;
  bottom: var(--u);
  font-size: var(--u);
  color: var(--site-brand);
}
.preview-empty {
  display: grid;
  gap: var(--u);
  justify-items: center;
  color: var(--site-text-tertiary);
}
.preview-empty > :first-child {
  font-size: calc(var(--u) * 6);
  color: var(--site-border-strong);
}
.preview-table {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-top: var(--apollo-line-width) solid var(--site-border);
  border-left: var(--apollo-line-width) solid var(--site-border);
}
.preview-table i {
  height: calc(var(--u) * 2.5);
  border-radius: 0;
  border-bottom: var(--apollo-line-width) solid var(--site-border);
  border-right: var(--apollo-line-width) solid var(--site-border);
  background: transparent;
}
.preview-table i:nth-child(-n + 4) {
  background: var(--site-bg-soft);
}
.preview-table i:nth-child(n + 5)::after {
  content: "";
  display: block;
  height: calc(var(--u) * 0.5);
  margin: var(--u);
  background: var(--site-preview-muted);
}
.preview-tags span {
  border: var(--apollo-line-width) solid var(--site-preview-stroke);
  border-radius: var(--apollo-border-radius-sm);
  padding: calc(var(--u) * 0.25) var(--u);
  background: var(--site-preview-fill);
}
.preview-tags span:nth-child(2) {
  color: var(--site-text-tertiary);
  border-color: var(--site-border);
  background: var(--site-bg-soft);
}
.preview-statistic {
  display: grid;
  gap: calc(var(--u) * 0.5);
}
.preview-statistic > span {
  color: var(--site-text-tertiary);
}
.preview-statistic strong {
  font-size: calc(var(--u) * 3.5);
  font-weight: 500;
  color: var(--site-text);
}
.preview-list {
  width: 85%;
}
.preview-list > div {
  display: flex;
  align-items: center;
  gap: var(--u);
  padding-block: var(--u);
}
.preview-list b {
  width: var(--u);
  height: var(--u);
  border: var(--apollo-line-width) solid var(--site-preview-stroke);
  border-radius: 50%;
}
.preview-list i {
  height: calc(var(--u) * 0.6);
  width: 70%;
}
.preview-list > :first-child i {
  background: var(--site-preview-stroke);
}
.preview-kind-tree .preview-list > :nth-child(2),
.preview-kind-tree .preview-list > :nth-child(3) {
  margin-left: calc(var(--u) * 2);
}
.preview-kind-menu .preview-list > :first-child {
  background: var(--site-preview-fill);
  border-radius: var(--apollo-border-radius-sm);
  padding-inline: var(--u);
}
.preview-kind-timeline .preview-list b {
  position: relative;
}
.preview-kind-timeline .preview-list b::after {
  content: "";
  position: absolute;
  width: var(--apollo-line-width);
  height: calc(var(--u) * 2);
  background: var(--site-border);
  top: var(--u);
  left: 50%;
}
.preview-notice {
  display: flex;
  gap: var(--u);
  align-items: center;
  padding: calc(var(--u) * 1.5);
  width: 100%;
  border: var(--apollo-line-width) solid var(--site-preview-stroke);
  background: var(--site-preview-fill);
  border-radius: var(--apollo-border-radius);
}
.preview-notice > div {
  flex: 1;
}
.preview-notice i {
  height: calc(var(--u) * 0.6);
  margin-block: calc(var(--u) * 0.5);
}
.preview-notice i:first-child {
  width: 70%;
  background: var(--site-preview-stroke);
}
.preview-popover {
  display: grid;
  justify-items: center;
  gap: calc(var(--u) * 1.5);
  width: 100%;
}
.preview-popover > div {
  width: 75%;
  padding: calc(var(--u) * 1.5);
  border: var(--apollo-line-width) solid var(--site-border);
  box-shadow: var(--apollo-box-shadow-tertiary);
  border-radius: var(--apollo-border-radius);
  position: relative;
}
.preview-popover > div::after {
  content: "";
  position: absolute;
  width: var(--u);
  height: var(--u);
  background: var(--site-bg);
  border-right: var(--apollo-line-width) solid var(--site-border);
  border-bottom: var(--apollo-line-width) solid var(--site-border);
  bottom: calc(var(--u) * -0.6);
  left: 45%;
  transform: rotate(45deg);
}
.preview-popover i {
  height: calc(var(--u) * 0.6);
  margin: calc(var(--u) * 0.5);
}
.preview-popover > span {
  color: var(--site-text-tertiary);
}
.preview-result {
  display: grid;
  justify-items: center;
  width: 80%;
  gap: var(--u);
}
.preview-result > :first-child {
  font-size: calc(var(--u) * 5);
}
.preview-result i {
  width: 80%;
  height: calc(var(--u) * 0.6);
}
.preview-loading {
  font-size: calc(var(--u) * 4);
}
.preview-floating {
  display: flex;
  align-items: center;
  gap: calc(var(--u) * 1.5);
}
.preview-floating span {
  width: calc(var(--u) * 4);
  height: calc(var(--u) * 4);
  display: grid;
  place-items: center;
  border: var(--apollo-line-width) solid var(--site-border);
  border-radius: 50%;
  color: var(--site-text-secondary);
}
.preview-floating span:nth-child(2) {
  color: var(--apollo-color-text-light-solid);
  background: var(--site-brand);
  border-color: var(--site-brand);
}
.preview-qr {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: var(--apollo-line-width);
  width: calc(var(--u) * 11);
  height: calc(var(--u) * 11);
  padding: var(--u);
  border: var(--apollo-line-width) solid var(--site-border);
}
.preview-qr i {
  border-radius: 0;
  background: transparent;
}
.preview-qr .filled {
  background: var(--site-text);
}
.preview-watermark {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: calc(var(--u) * 2);
  transform: rotate(-24deg);
  color: var(--site-border-strong);
}
.preview-border {
  display: grid;
  place-items: center;
  width: 100%;
  height: calc(var(--u) * 12);
  border: var(--apollo-line-width-bold) solid var(--site-preview-stroke);
  border-top-color: var(--site-brand);
  border-radius: var(--apollo-border-radius-lg);
  background: var(--site-bg-soft);
}
.preview-system {
  display: grid;
  justify-items: center;
  gap: var(--u);
  color: var(--site-text-tertiary);
}
.preview-system > :first-child {
  font-size: calc(var(--u) * 5);
  color: var(--site-preview-stroke);
}
</style>
