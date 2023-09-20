import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Code Inspector',
  base: '/en/',
  description: "Locate dom's source code in IDE",
  themeConfig: {
    logo: '/logo.svg',
    // https://vitepress.dev/reference/default-theme-config
    // nav: [{ text: '首页', link: '/' }],
    search: {
      provider: 'local',
    },
    outline: [2, 3],
    sidebar: [
      {
        text: 'Guidance',
        items: [
          { text: 'Introduction', link: '/guide/introduction' },
          { text: 'Use', link: '/guide/start' },
          { text: 'Specify IDE', link: '/guide/ide' },
          { text: 'API', link: '/guide/api' },
        ],
      },
      {
        text: 'More',
        items: [
          { text: 'Try it online', link: '/more/try' },
          { text: 'Changelog', link: '/more/changelog' },
          { text: 'Common Problems', link: '/more/question' },
          { text: 'Feedback', link: '/more/feedback' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/zh-lx/code-inspector' },
    ],
  },
  locales: {
    root: {
      label: 'English',
      lang: 'en',
    },
    en: {
      label: '简体中文',
      lang: 'zh',
      link: 'https://inspector.fe-dev.cn', // default /fr/ -- shows on navbar translations menu, can be external
    },
  },
});
