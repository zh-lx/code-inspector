<template lang="pug">
div(:ddd="222") {{ msg }}
  p() 12312
   a
    span 1999
  p(ok="123") ok123
</template>

<script>
export default {
  name: 'HelloWorld',
  data() {
    return {
      msg: 'hello, pug',
    };
  },
};
</script>

<style scoped></style>
