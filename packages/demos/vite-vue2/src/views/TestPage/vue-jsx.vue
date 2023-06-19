<script lang="jsx">
export default {
  data() {
    return {
      message: "Hello, Vue with JSX!",
    };
  },
  render() {
    return (
      <div class={"vue-jsx"}>
        this is vue-jsx
        <p>vue jsx child 1</p>
        <a>vue jsx child 2</a>
      </div>
    );
  },
};
</script>

<style lang="css" scoped>
.vue-jsx {
  padding: 20px;
  border: 1px solid #333;
  margin: 20px 0;
}
</style>
