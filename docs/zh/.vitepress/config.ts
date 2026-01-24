import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Code Inspector',
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
        text: '指南',
        items: [
          { text: '介绍', link: '/guide/introduction' },
          { text: '使用', link: '/guide/start' },
          { text: '功能大全', link: '/guide/feature' },
          { text: 'IDE', link: '/guide/ide' },
        ],
      },
      {
        text: 'API',
        items: [
          { text: '基础配置', link: '/api/basic' },
          { text: '进阶配置', link: '/api/advance' },
        ],
      },
      {
        text: '更多',
        items: [
          { text: '更新日志', link: '/more/changelog' },
          { text: '常见问题', link: '/more/question' },
          { text: '交流与反馈', link: '/more/feedback' },
          { text: '赞助本项目', link: '/more/sponsor' },
        ],
      },
    ],
    nav: [
      {
        text: '在线体验',
        items: [
          {
            text: 'Vue Demo',
            link: 'https://stackblitz.com/edit/vitejs-vite-4pseos?file=vite.config.ts',
            target: '_blank',
          },
          {
            text: 'React Demo',
            link: 'https://stackblitz.com/edit/vitejs-vite-svtwrr?file=vite.config.ts',
            target: '_blank',
          },
          {
            text: 'Preact Demo',
            link: 'https://stackblitz.com/edit/vitejs-vite-iyawbf?file=vite.config.ts',
            target: '_blank',
          },
          {
            text: 'Solid Demo',
            link: 'https://stackblitz.com/edit/solidjs-templates-6u76jn?file=vite.config.ts',
            target: '_blank',
          },
          {
            text: 'Qwik Demo',
            link: 'https://stackblitz.com/edit/vitejs-vite-antzds?file=vite.config.ts',
            target: '_blank',
          },
          {
            text: 'Svelte Demo',
            link: 'https://stackblitz.com/edit/vitejs-vite-zoncqr?file=vite.config.ts',
            target: '_blank',
          },
          {
            text: 'Astro Demo',
            link: 'https://stackblitz.com/edit/withastro-astro-f5xq1t?file=astro.config.mjs',
            target: '_blank',
          },
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
      link: 'https://inspector.fe-dev.cn/en', // default /fr/ -- shows on navbar translations menu, can be external
    },
  },
});
