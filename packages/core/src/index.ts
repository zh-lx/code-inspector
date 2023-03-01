const path = require('path');
const fs = require('fs');
import { StartServer, getEnhanceContent } from './server';

const jsCodePath = path.resolve(__dirname, './client.umd.cjs');
const jsCode = fs.readFileSync(jsCodePath, 'utf-8');

type HotKey = 'ctrlKey' | 'altKey' | 'metaKey' | 'shiftKey';

export const getInjectCode = (
  port: number,
  hotKeys: HotKey[] = ['shiftKey', 'altKey']
) => {
  return `<vue-inspector-component port=${port} hotKeys="${hotKeys.join(
    ','
  )}"></vue-inspector-component>
  <script type="text/javascript">
  ${jsCode}
  </script>`;
};

export const startServer = StartServer;
export const enhanceVueCode = getEnhanceContent;
