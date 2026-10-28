<script setup lang="ts">
import { Alert, Button } from '@apollo-design/ui';
import { ref } from 'vue';

const visible = ref(true);
</script>

<template>
  <div>
    <Alert v-if="visible" title="Alert Message Text" type="success" closable @after-close="visible = false" />
    <p>The after-close event runs after the owned alert finishes closing.</p>
    <Button v-if="!visible" @click="visible = true">Show alert again</Button>
  </div>
</template>
