<template>
  <div class="home-page">
    <DemoJsx></DemoJsx>
    <VueJsx></VueJsx>
    <div class="test-text">isOk: {{ store.isOk }} - testNum: {{ testNum }}</div>
    <el-button type="primary" @click="changeStore">changeStore</el-button>
    <el-table v-loading="tableLoading" :data="tableData" style="width: 100%">
      <el-table-column prop="date" label="日期" width="180"> </el-table-column>
      <el-table-column prop="name" label="姓名" width="180"> </el-table-column>
      <el-table-column prop="address" label="地址"> </el-table-column>
    </el-table>
    <el-button type="primary" size="default" @click="push"> inject </el-button>
    <el-button @click="toTestPage">to testPage</el-button>
  </div>
</template>
<script setup lang="ts">
import useCounterStore from "/@/store/modules/app";
import { storeToRefs } from "pinia";
import { GetDataApi } from "/@/apis/data.api";
import { inject, onMounted, ref } from "vue";
import Message from "element-ui/lib/message";
import "element-ui/lib/theme-chalk/message.css";
import { useRouter } from "vue-router/composables";
import DemoJsx from "./demo.jsx";
import VueJsx from "./vue-jsx.vue";
const $router = useRouter();

const injectEvent: any = inject("test");
const push = () => injectEvent("子传值");

const store = useCounterStore();
const { testNum } = storeToRefs(store);
const textColor = ref("#ff0000");
const changeStore = () => {
  Message.success("更改成功");
  store.setIsOk(!store.isOk);
  testNum.value++;
};
let tableData = ref([]);
const tableLoading = ref(false);
const getTableData = () => {
  tableLoading.value = true;
  GetDataApi().then((res) => {
    tableData.value = res.data;
    tableLoading.value = false;
  });
};

const toTestPage = () => {
  $router.push({
    name: "TestPage",
    query: {
      data: "aaa",
    },
  });
};

onMounted(() => {
  getTableData();
});
</script>
<style lang="scss" scoped>
.home-page {
  .test-text {
    color: v-bind(textColor);
  }
}
</style>
