import { defineComponent, onMounted, ref } from 'vue';

export default defineComponent({
  setup(props, { emit }) {
    onMounted(() => {
      // ...
    });
    return () => (
      <div>
        this is jsx root element
        <p>detail jsx element 1</p>
        <a>detail jsx element 2</a>
      </div>
    );
  },
});
