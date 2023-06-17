<template>
  <div class="test-page">route query: {{ queryData }}</div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router/composables'
const $route = useRoute()
const queryData = ref('')
onMounted(() => {
  const query = <string>$route.query.data
  if (query) {
    queryData.value = query
  }
})
</script>
