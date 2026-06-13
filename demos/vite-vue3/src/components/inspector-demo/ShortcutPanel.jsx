import { defineComponent, onMounted } from 'vue';

export default defineComponent({
  setup(props, { emit }) {
    onMounted(() => {
      // ...
    });
    return () => (
      <div class="inspector-shortcuts" aria-label="默认组合键">
        <div class="inspector-shortcut">
          <span>Mac</span>
          <kbd>Option</kbd>+<kbd>Shift</kbd>
        </div>
        <div class="inspector-shortcut">
          <span>Windows</span>
          <kbd>Alt</kbd>+<kbd>Shift</kbd>
        </div>
      </div>
    );
  },
});
