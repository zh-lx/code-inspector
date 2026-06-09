<script lang="tsx">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'app',
  setup(props, ctx) {
    return () => (
      <div>
        <p class="inspector-badge">code-inspector-plugin demo</p>
        <div class="inspector-hero">
          <h1 id="inspector-title">按住组合键体验源码定位</h1>
          <p>
            在页面上按住默认组合键并移动鼠标，DOM 元素会显示定位遮罩；
            点击任意元素即可打开 IDE 并定位到对应源码。
          </p>
        </div>
      </div>
    );
  },
});
</script>
