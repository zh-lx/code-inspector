import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Code Inspector',
  description: "Locate dom's source code in IDE",
  themeConfig: {
    logo: './logo.svg',
    // https://vitepress.dev/reference/default-theme-config
    // nav: [{ text: '首页', link: '/' }],
    search: {
      provider: 'local',
    },

    sidebar: [
      {
        text: '指南',
        items: [
          { text: '介绍', link: '/guide/introduction' },
          { text: '使用', link: '/guide/start' },
          { text: '指定 IDE', link: '/guide/ide' },
          { text: 'API', link: '/guide/api' },
        ],
      },
      {
        text: '更多',
        items: [
          { text: '常见问题', link: '/more/question' },
          { text: '交流与反馈', link: '/more/feedback' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/zh-lx/code-inspector' },
    ],
  },
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh',
    },
    fr: {
      label: 'English',
      lang: 'en',
      link: 'http://localhost:5173', // default /fr/ -- shows on navbar translations menu, can be external
    },
  },
});
