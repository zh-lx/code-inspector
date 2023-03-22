const path = require('path');
const fs = require('fs');
import { StartServer, getEnhanceContent } from './server';

const jsCodePath = path.resolve(__dirname, './client.umd.cjs');
const jsCode = fs.readFileSync(jsCodePath, 'utf-8');

export type HotKey = 'ctrlKey' | 'altKey' | 'metaKey' | 'shiftKey';

export const getInjectCode = (
  port: number,
  hotKeys: HotKey[] = ['shiftKey', 'altKey'],
  disableTriggerByKey: boolean = false,
  hideButton: boolean = false
) => {
  return `<code-inspector-component port=${port} hotKeys="${hotKeys.join(
    ','
  )}" ${disableTriggerByKey ? 'disableTriggerByKey=true' : ''} ${
    hideButton ? 'hideButton=true' : ''
  }></code-inspector-component>
  <script type="text/javascript">
  ${jsCode}
  </script>`;
};

export const startServer = StartServer;
export const enhanceVueCode = getEnhanceContent;
