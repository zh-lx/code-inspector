<template>
  <img alt="Vue logo" src="./assets/logo.png" />
  <input type="text" />
  <div>{{ count }}</div>
  <HelloWorld msg="Welcome to Your Vue.js App" />
  <PugComponent />
  <SrcTemp />
</template>

<script setup>
import HelloWorld from './components/HelloWorld.vue';
import PugComponent from './components/pug.vue';
import SrcTemp from './components/src-temp.vue';
import { ref } from 'vue';

const count = ref({}?.ol?.kkk);
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
