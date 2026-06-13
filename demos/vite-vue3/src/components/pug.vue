<template lang="pug">
.page-container#ok(class="page") page container
div(:ddd="222") {{ msg }}
  p() 12312
  a(style="color: blue")
    span 1999
  p(ok="123") ok123

case friends
  when 0
    p 您没有朋友
  when 1
    p 您有一个朋友
  default
    p 您有 {{ friends}} 个朋友
- for (var x = 0; x < 3; x++)
  li item
- var user = { description: 'foo bar baz' }
#user
  if user.description
    h2.green 描述
  else if user.authorised
    h2.blue 授权
  else
    p.description 用户没有描述
ul
  each val in [1, 2, 3, 4, 5]
    li= val
- var n = 0;
ul
  while n < 4
    li= n++
</template>

<script setup lang="ts">
import { ref } from 'vue';
const msg = ref('hello, pug');
const friends = ref(2);
const user = ref({
  description: '用户描述',
  authorised: true,
});
</script>

<style scoped>
ul {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
  padding-left: 0;
}

li {
  list-style: none;
  margin: 0;
  padding: 8px 12px;
  border: 1px solid #dbe4ff;
  border-radius: 8px;
  background: #f5f7ff;
  color: #1f2d3d;
  transition: all 0.2s ease;
}

li:hover {
  border-color: #b8c9ff;
  background: #e9efff;
  transform: translateY(-2px);
}
</style>
