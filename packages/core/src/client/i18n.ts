export type ClientLang = 'en' | 'zh';

type TemplateValue = string | number;
type MessageMap = Record<string, { en: string; zh: string }>;

function defineMessages<T extends MessageMap>(messages: T): T {
  return messages;
}

const MESSAGES = defineMessages({
  'feature.locate.label': { en: 'Locate Code', zh: '定位代码' },
  'feature.locate.description': {
    en: 'Open the editor and locate code',
    zh: '打开编辑器并定位到代码',
  },
  'feature.copy.label': { en: 'Copy Path', zh: '复制路径' },
  'feature.copy.description': {
    en: 'Copy the code path to clipboard',
    zh: '复制代码路径到剪贴板',
  },
  'feature.target.label': { en: 'Open Target', zh: '打开目标' },
  'feature.target.description': {
    en: 'Open the target url',
    zh: '打开目标链接',
  },
  'feature.ai.label': { en: 'AI Assistant', zh: 'AI 助手' },
  'feature.ai.description': {
    en: 'Use AI for coding',
    zh: '使用 AI 辅助编码',
  },
  'console.expandGuide': {
    en: '[code-inspector-plugin] click to expand the guide',
    zh: '[code-inspector-plugin] 点击展开使用说明',
  },
  'console.leftClick': { en: 'left click', zh: '左键点击' },
  'console.rightClick': { en: 'right click', zh: '右键点击' },
  'console.mouseWheel': { en: 'mouse wheel', zh: '滚轮' },
  'console.useActiveFeature': {
    en: ' to use active feature',
    zh: ' 触发当前功能',
  },
  'console.openNodeTree': {
    en: ' to open node tree',
    zh: ' 打开节点树',
  },
  'console.selectParentOrChild': {
    en: ' to select parent node or child node',
    zh: ' 选择父节点或子节点',
  },
  'console.changeActiveFeature': {
    en: ' to change active feature',
    zh: ' 切换当前功能',
  },
  'console.use': { en: ' to use ', zh: ' 使用 ' },
  'notification.copySuccess': {
    en: '✓ Copied to clipboard',
    zh: '✓ 已复制到剪贴板',
  },
  'notification.copyFailed': {
    en: '✗ Copy failed',
    zh: '✗ 复制失败',
  },
  'notification.imageTooLarge': {
    en: 'Image too large ({size}). Max 5MB.',
    zh: '图片过大（{size}），最大支持 5MB。',
  },
  'notification.readPastedImageFailed': {
    en: 'Failed to read pasted image',
    zh: '读取粘贴图片失败',
  },
  'notification.sendMessageFailed': {
    en: 'Failed to send message',
    zh: '发送消息失败',
  },
  'settings.modeSettings': { en: 'Mode Settings', zh: '模式设置' },
  'tree.clickNodeToLocate': {
    en: 'Click node to locate',
    zh: '点击节点进行定位',
  },
  'chat.title': { en: 'AI Assistant', zh: 'AI 助手' },
  'chat.switchProvider': {
    en: 'Switch AI provider',
    zh: '切换 AI 提供方',
  },
  'chat.switchModel': { en: 'Switch model', zh: '切换模型' },
  'chat.global': { en: 'Global', zh: '全局' },
  'chat.history': { en: 'History', zh: '历史记录' },
  'chat.switchToLightTheme': {
    en: 'Switch to light theme',
    zh: '切换到浅色主题',
  },
  'chat.switchToDarkTheme': {
    en: 'Switch to dark theme',
    zh: '切换到深色主题',
  },
  'chat.clear': { en: 'Clear', zh: '清空' },
  'chat.close': { en: 'Close', zh: '关闭' },
  'chat.newConversation': {
    en: 'New conversation',
    zh: '新建对话',
  },
  'chat.backToChat': { en: 'Back to chat', zh: '返回对话' },
  'chat.loading': { en: 'Loading...', zh: '加载中...' },
  'chat.noHistoryYet': { en: 'No history yet', zh: '暂无历史记录' },
  'chat.untitled': { en: 'Untitled', zh: '未命名' },
  'chat.delete': { en: 'Delete', zh: '删除' },
  'chat.processExitedWithCode': {
    en: 'Process exited with code {code}',
    zh: '进程已退出，退出码 {code}',
  },
  'chat.askAnything': {
    en: 'Ask me anything about this code...',
    zh: '可以问我任何与这段代码相关的问题...',
  },
  'chat.running': { en: 'Running', zh: '运行中' },
  'chat.done': { en: 'Done', zh: '完成' },
  'chat.interrupt': { en: 'Interrupt', zh: '中断' },
  'chat.revertAll': { en: 'Revert All', zh: '全部回退' },
  'chat.revertingAll': { en: 'Reverting...', zh: '回退中...' },
  'chat.removeImage': { en: 'Remove image', zh: '移除图片' },
  'chat.inputPlaceholder': {
    en: 'Enter your message... (supports paste image)',
    zh: '输入消息...（支持粘贴图片）',
  },
  'chat.send': { en: 'Send (Enter)', zh: '发送（Enter）' },
  'chat.closeTerminalTitle': {
    en: 'Choose how to close the terminal',
    zh: '选择如何关闭终端',
  },
  'chat.closeTaskTitle': {
    en: 'Task is still running',
    zh: '任务仍在运行',
  },
  'chat.closeTerminalDesc': {
    en: 'You can keep the terminal running in the background, or kill the terminal now.',
    zh: '你可以让终端继续在后台运行，或立即终止终端。',
  },
  'chat.closeTaskDesc': {
    en: 'Closing this dialog will keep the task running in the background.',
    zh: '关闭此对话框后，任务会继续在后台运行。',
  },
  'chat.killTerminal': { en: 'Kill Terminal', zh: '终止终端' },
  'chat.terminate': { en: 'Terminate', zh: '终止' },
  'chat.keepInBackground': {
    en: 'Keep In Background',
    zh: '保留后台运行',
  },
  'chat.confirm': { en: 'Confirm', zh: '确认' },
  'chat.cancel': { en: 'Cancel', zh: '取消' },
  'chat.switchTerminalTitle': {
    en: 'Switch terminal provider or model',
    zh: '切换终端提供方或模型',
  },
  'chat.switchTerminalDesc': {
    en: 'Keep the current terminal running, or kill it and switch to the new selection.',
    zh: '保留当前终端继续运行，或终止终端并切换到新的选择。',
  },
  'chat.killAndSwitch': {
    en: 'Kill and switch',
    zh: '终止并切换',
  },
  'chat.keepCurrentTerminal': {
    en: 'Keep current terminal',
    zh: '保留当前终端',
  },
  'chat.context': { en: 'Context', zh: '上下文' },
  'chat.justNow': { en: 'Just now', zh: '刚刚' },
  'chat.minutesAgo': { en: '{count}m ago', zh: '{count} 分钟前' },
  'chat.hoursAgo': { en: '{count}h ago', zh: '{count} 小时前' },
  'chat.messages': { en: '{count} msgs', zh: '{count} 条消息' },
  'chat.resumeAfterRefresh': {
    en: 'The previous task was interrupted by a page refresh. Please continue from where you left off.',
    zh: '上一次任务因页面刷新被中断，请从中断处继续。',
  },
  'tool.read': { en: 'Read', zh: '读取' },
  'tool.write': { en: 'Write', zh: '写入' },
  'tool.edit': { en: 'Edit', zh: '编辑' },
  'tool.glob': { en: 'Glob', zh: '匹配' },
  'tool.grep': { en: 'Grep', zh: '搜索' },
  'tool.bash': { en: 'Bash', zh: '命令' },
  'tool.webFetch': { en: 'WebFetch', zh: '抓取' },
  'tool.webSearch': { en: 'WebSearch', zh: '搜索' },
  'tool.edited': { en: 'Edited', zh: '已编辑' },
  'tool.search': { en: 'Search', zh: '搜索' },
  'tool.update': { en: 'Update', zh: '更新' },
  'tool.list': { en: 'List', zh: '列出' },
  'tool.fetch': { en: 'Fetch', zh: '抓取' },
  'tool.reverting': { en: 'Reverting...', zh: '回退中...' },
  'tool.reverted': { en: '✓ Reverted', zh: '✓ 已回退' },
  'tool.revert': { en: 'Revert', zh: '回退' },
  'tool.wroteLines': {
    en: 'Wrote {count} lines',
    zh: '写入了 {count} 行',
  },
  'tool.lines': { en: '{count} lines', zh: '{count} 行' },
  'tool.collapsedLines': { en: '...{count} lines', zh: '...{count} 行' },
  'tool.terminalExitMessage': {
    en: '[Terminal] Process exited with code {code}',
    zh: '[终端] 进程已退出，退出码 {code}',
  },
  'misc.pastedImage': { en: 'pasted-image', zh: '粘贴图片' },
} as const);

export type ClientTextKey = keyof typeof MESSAGES;

type ExtractTemplateVars<S extends string> =
  S extends `${string}{${infer Name}}${infer Rest}`
    ? Name | ExtractTemplateVars<Rest>
    : never;

type MessageTemplateVars<K extends ClientTextKey> = ExtractTemplateVars<
  (typeof MESSAGES)[K]['en'] | (typeof MESSAGES)[K]['zh']
>;

type TemplateVars<K extends ClientTextKey> = [MessageTemplateVars<K>] extends [
  never,
]
  ? Record<string, never>
  : Record<MessageTemplateVars<K>, TemplateValue>;

export type ClientTextVars<K extends ClientTextKey> = TemplateVars<K>;

export function normalizeClientLang(lang?: string | null): ClientLang {
  return lang === 'zh' ? 'zh' : 'en';
}

export function getClientText<K extends ClientTextKey>(
  lang: string | null | undefined,
  key: K,
  vars?: ClientTextVars<K>,
): string {
  const normalizedLang = normalizeClientLang(lang);
  const template = MESSAGES[key][normalizedLang];
  if (!vars) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    return String(vars[name as keyof typeof vars] ?? '');
  });
}

export function formatHistoryDateText(
  timestamp: number,
  lang: string | null | undefined,
): string {
  const normalizedLang = normalizeClientLang(lang);
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - timestamp;
  if (diff < 60000) return getClientText(normalizedLang, 'chat.justNow');
  if (diff < 3600000) {
    return getClientText(normalizedLang, 'chat.minutesAgo', {
      count: Math.floor(diff / 60000),
    });
  }
  if (diff < 86400000) {
    return getClientText(normalizedLang, 'chat.hoursAgo', {
      count: Math.floor(diff / 3600000),
    });
  }
  if (date.getFullYear() === now.getFullYear()) {
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

export function formatFileCountText(
  count: number,
  lang: string | null | undefined,
): string {
  const normalizedLang = normalizeClientLang(lang);
  if (normalizedLang === 'zh') {
    return `${count} 个文件`;
  }
  return `${count} file${count > 1 ? 's' : ''}`;
}
