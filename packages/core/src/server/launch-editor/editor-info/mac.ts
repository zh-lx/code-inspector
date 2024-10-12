import { EDITOR_PROCESS_MAP } from '../type';

// 有顺序优先级
export const COMMON_EDITORS_OSX = {
  // cursor
  '/Cursor.app/Contents/MacOS/Cursor': '/Cursor.app/Contents/MacOS/Cursor',
  // vscode 系列
  '/Visual Studio Code.app/Contents/MacOS/Electron': '/Visual Studio Code.app/Contents/MacOS/Electron',
  '/Visual Studio Code - Insiders.app/Contents/MacOS/Electron': '/Visual Studio Code - Insiders.app/Contents/MacOS/Electron',
  '/VSCodium.app/Contents/MacOS/Electron': '/VSCodium.app/Contents/MacOS/Electron',
  // webstorm
  '/WebStorm.app/Contents/MacOS/webstorm':
    '/WebStorm.app/Contents/MacOS/webstorm',
  '/HBuilderX.app/Contents/MacOS/HBuilderX':
    '/HBuilderX.app/Contents/MacOS/HBuilderX',
  '/Atom.app/Contents/MacOS/Atom': 'atom',
  '/Atom Beta.app/Contents/MacOS/Atom Beta':
    '/Atom Beta.app/Contents/MacOS/Atom Beta',
  '/Brackets.app/Contents/MacOS/Brackets': 'brackets',
  '/Sublime Text.app/Contents/MacOS/Sublime Text':
    '/Sublime Text.app/Contents/SharedSupport/bin/subl',
  '/Sublime Text.app/Contents/MacOS/sublime_text':
    '/Sublime Text.app/Contents/SharedSupport/bin/subl',
  '/Sublime Text 2.app/Contents/MacOS/Sublime Text 2':
    '/Sublime Text 2.app/Contents/SharedSupport/bin/subl',
  '/Sublime Text Dev.app/Contents/MacOS/Sublime Text':
    '/Sublime Text Dev.app/Contents/SharedSupport/bin/subl',
  '/PhpStorm.app/Contents/MacOS/phpstorm':
    '/PhpStorm.app/Contents/MacOS/phpstorm',
  '/PyCharm.app/Contents/MacOS/pycharm': '/PyCharm.app/Contents/MacOS/pycharm',
  '/PyCharm CE.app/Contents/MacOS/pycharm':
    '/PyCharm CE.app/Contents/MacOS/pycharm',
  '/IntelliJ IDEA.app/Contents/MacOS/idea':
    '/IntelliJ IDEA.app/Contents/MacOS/idea',
  '/IntelliJ IDEA Ultimate.app/Contents/MacOS/idea':
    '/IntelliJ IDEA Ultimate.app/Contents/MacOS/idea',
  '/IntelliJ IDEA Community Edition.app/Contents/MacOS/idea':
    '/IntelliJ IDEA Community Edition.app/Contents/MacOS/idea',
  '/Zed.app/Contents/MacOS/zed': 'zed',
  '/GoLand.app/Contents/MacOS/goland': '/GoLand.app/Contents/MacOS/goland',
  '/AppCode.app/Contents/MacOS/appcode': '/AppCode.app/Contents/MacOS/appcode',
  '/CLion.app/Contents/MacOS/clion': '/CLion.app/Contents/MacOS/clion',
  '/RubyMine.app/Contents/MacOS/rubymine':
    '/RubyMine.app/Contents/MacOS/rubymine',
  '/MacVim.app/Contents/MacOS/MacVim': 'mvim',
  '/Rider.app/Contents/MacOS/rider': '/Rider.app/Contents/MacOS/rider',
};


export const EDITOR_PROCESS_MAP_OSX: EDITOR_PROCESS_MAP = {
  code: ['/Visual Studio Code.app/Contents/MacOS/Electron'],
  'code-insiders': ['/Visual Studio Code - Insiders.app/Contents/MacOS/Electron'],
  webstorm: ['/WebStorm.app/Contents/MacOS/webstorm'],
  cursor: ['/Cursor.app/Contents/MacOS/Cursor'],
  atom: ['/Atom.app/Contents/MacOS/Atom'],
  hbuilder: ['/HBuilderX.app/Contents/MacOS/HBuilderX'],
  phpstorm: ['/PhpStorm.app/Contents/MacOS/phpstorm'],
  pycharm: ['/PyCharm.app/Contents/MacOS/pycharm'],
  idea: ['/IntelliJ IDEA.app/Contents/MacOS/idea'],
  codium: ['/VSCodium.app/Contents/MacOS/Electron'],
  goland: ['/GoLand.app/Contents/MacOS/goland'],
  colin: ['/CLion.app/Contents/MacOS/clion'],
  appcode: ['/AppCode.app/Contents/MacOS/appcode'],
  'atom-beta': ['/Atom Beta.app/Contents/MacOS/Atom Beta'],
  brackets: ['/Brackets.app/Contents/MacOS/Brackets'],
  rider: ['/Rider.app/Contents/MacOS/rider'],
  rubymine: ['/RubyMine.app/Contents/MacOS/rubymine']
}