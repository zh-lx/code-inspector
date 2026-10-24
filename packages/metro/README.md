# Code Inspector for Expo web with Metro

`@code-inspector/metro` adds click-to-source inspection to development builds of Expo web apps. It leaves iOS, Android, server-side, and production bundles unchanged.

```js
// metro.config.js (ES module)
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withCodeInspectorMetro } from '@code-inspector/metro';

const require = createRequire(import.meta.url);
const projectRoot = dirname(fileURLToPath(import.meta.url));
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(projectRoot);

export default withCodeInspectorMetro(config, {
  projectRoot,
  injectTo: join(projectRoot, 'app/_layout.tsx'),
});
```

Pass the final Metro config to `withCodeInspectorMetro` so other wrappers retain their transformer settings. `injectTo` must name a source module loaded once by the browser app, such as the Expo Router root layout. The adapter extends Expo's configured Babel transformer, instruments project JSX, and maps React Native Web host components to `dataSet.inspPath` so their DOM elements carry `data-insp-path`.

The inspector runs only when Metro requests a development web bundle. Its editor-opening server starts on the web bundle request, including when Metro serves a cached transform. Hold Option + Shift (macOS) or Alt + Shift (Windows) and click an element to open its source.

If the editor cannot be detected, pass `editor` in the Metro options (for example, `editor: 'code-insiders'`) or set `CODE_EDITOR` before starting Expo.
