/// <reference types="vite/client" />
/// <reference types="vue/jsx" />

declare module '*.jsx' {
  import type { Component } from 'vue';
  const component: Component;
  export default component;
}
