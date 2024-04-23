<template lang="pug">
div(:ddd="222") {{ msg }}
  p() 12312
   a
    span 1999
  p(ok="123") ok123
</template>

<script setup lang="ts">
import { ref } from 'vue';
const msg = ref('hello, pug');
</script>

<style scoped></style>
