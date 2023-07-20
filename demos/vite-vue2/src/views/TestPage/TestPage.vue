<template>
  <div>
    <div class="test-page">route query: {{ queryData }}</div>
    <VueJsxComponent></VueJsxComponent>
    <JsxComponent></JsxComponent>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router/composables";
import VueJsxComponent from "./vue-jsx.vue";
import JsxComponent from "./jsx-component.jsx";
const $route = useRoute();
const queryData = ref("");
onMounted(() => {
  const query = <string>$route.query.data;
  if (query) {
    queryData.value = query;
  }
});
</script>
