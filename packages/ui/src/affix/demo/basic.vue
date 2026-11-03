<script setup lang="ts">
import { Affix, Button } from '../../index';
</script>

<template>
  <div style="min-height: 760px; padding-top: 120px">
  <Affix :offset-top="80">
    <Button type="primary">固定在顶部 80px</Button>
  </Affix>
    <p style="margin-top: 24px">Scroll this preview to observe the fixed position.</p>
  </div>
</template>
