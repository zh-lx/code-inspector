// https://vitepress.dev/guide/custom-theme
import { h } from 'vue';
import Theme from 'vitepress/theme';
// import HomeHeroAfter from '../components/home-hero-after.vue';
import './style.scss';

export default {
  ...Theme,
  Layout: () => {
    return h(Theme.Layout, null, {
      // 'home-features-after': () => h(HomeHeroAfter),
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
    });
  },
  enhanceApp({ app, router, siteData }) {
    // ...
  },
};
