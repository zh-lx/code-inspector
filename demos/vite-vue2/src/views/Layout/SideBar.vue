<template>
  <div class="side-bar">
    <el-menu
      :default-active="onRoutes"
      background-color="#545c64"
      text-color="#fff"
      router
      active-text-color="#ffd04b"
    >
      <template v-for="main in constantRoutes">
        <el-menu-item
          v-if="main.children.length === 1"
          :index="main.children[0].path"
          :key="main.path + 1"
        >
          <i :class="main.meta.icon"></i>
          <span slot="title">{{ main.meta.title }}</span>
        </el-menu-item>
        <el-submenu v-else :index="main.path" :key="main.path + 2">
          <template slot="title">
            <i :class="main.meta.icon"></i>
            <span>{{ main.meta.title }}</span>
          </template>
          <el-menu-item-group>
            <el-menu-item
              v-for="sub in main.children"
              :index="sub.path"
              :key="sub.path"
            >
              {{ sub.meta.title }}
            </el-menu-item>
          </el-menu-item-group>
        </el-submenu>
      </template>
    </el-menu>
  </div>
</template>
<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router/composables'
import { constantRoutes } from '/@/router'

const onRoutes = computed(() => {
  return useRoute().path
})
</script>
<style lang="scss">
.side-bar {
  .el-menu {
    height: 100%;
  }
}
</style>
