<script lang="tsx">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'app',
  setup(props, ctx) {
    return () => (
      <div>
        <p>
          同时按住 <span style={{ color: 'red' }}>Alt + Shift 键</span>{' '}
        </p>
        <a>即可进入代码定位模式</a>
      </div>
    );
  },
});
</script>
