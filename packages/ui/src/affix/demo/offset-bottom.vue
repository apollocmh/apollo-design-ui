<script setup lang="ts">
import { Affix, Button } from '../../index';
</script>

<template>
  <div style="min-height: 760px; padding-top: 420px">
  <Affix :offset-bottom="80">
    <Button>固定在底部 80px</Button>
  </Affix>
    <p style="margin-top: 24px">Scroll this preview to observe the fixed position.</p>
  </div>
</template>
