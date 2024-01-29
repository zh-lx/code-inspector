import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { CodeInspectorPlugin } from 'code-inspector-plugin';
import path from 'path';

export default defineConfig({
	plugins: [CodeInspectorPlugin({
		bundler: 'vite',
	}), sveltekit()]
});
