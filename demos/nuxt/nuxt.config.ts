import { codeInspectorPlugin } from 'code-inspector-plugin'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  vite: {
    plugins: [
      codeInspectorPlugin({
         bundler: 'vite'
      })
    ],
  }
})
