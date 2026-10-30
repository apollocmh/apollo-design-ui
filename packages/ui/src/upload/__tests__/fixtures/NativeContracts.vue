<script setup lang="ts">
import { ref } from 'vue';
import ConfigProvider from '../../../config-provider';
import {
  type RcFile,
  Upload,
  type UploadConfig,
  UploadDragger,
  type UploadFile,
  type UploadRef,
} from '../../index';

defineOptions({ components: { Upload, UploadDragger, ConfigProvider } });

const upload = ref<InstanceType<typeof Upload> | null>(null);
const dragger = ref<InstanceType<typeof UploadDragger> | null>(null);
const files = ref<UploadFile[]>([]);
const config: UploadConfig = { progress: { showInfo: true }, accept: '.txt' };
const components: NonNullable<InstanceType<typeof ConfigProvider>['$props']['components']> = {
  upload: config,
};
function transformFile(file: RcFile) {
  return new File([file], file.name);
}
function inspect() {
  const instance: UploadRef | null = upload.value;
  const dragInstance: UploadRef | null = dragger.value;
  const native: HTMLElement | null = instance?.nativeElement ?? null;
  instance?.upload?.abort();
  dragInstance?.upload?.getInputRef()?.focus();
  // @ts-expect-error The exposed native root is a real HTMLElement.
  native?.$el;
}
</script>
<template>
  <ConfigProvider :components="components">
  <Upload ref="upload" v-model:file-list="files" :before-upload="transformFile" @change="info => info.file.name" @drop="event => event.dataTransfer">
    <button type="button" @click="inspect">Upload</button>
    <template #iconRender="{ file, listType }">{{ file.name }} {{ listType }}</template>
    <template #itemRender="{ file, fileList, actions }"><button type="button" @click="actions.remove">{{ file.name }} {{ fileList.length }}</button></template>
    <template #extra="{ file }">{{ file.uid }}</template>
  </Upload>
  <UploadDragger ref="dragger" v-model:file-list="files" :height="160" :custom-request="(options, { defaultRequest }) => { if (options.action) return defaultRequest(options); }">
    <template #default>Drop a file</template>
    <template #removeIcon="{ file }">{{ file.name }}</template>
  </UploadDragger>
  </ConfigProvider>
</template>
