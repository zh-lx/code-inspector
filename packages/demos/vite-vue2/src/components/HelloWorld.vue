<template>
  <div>
    <h1>{{ msg }}</h1>
  </div>
</template>
<script setup lang="ts">
defineProps({
  msg: {
    type: String,
  },
})
</script>
<style scoped>
.read-the-docs {
  color: #888;
}
</style>
