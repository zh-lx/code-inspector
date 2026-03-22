export type ClientLang = 'en' | 'zh';

type TemplateVars = Record<string, string | number>;

const MESSAGES: Record<ClientLang, Record<string, string>> = {
  en: {
    'feature.locate.label': 'Locate Code',
    'feature.locate.description': 'Open the editor and locate code',
    'feature.copy.label': 'Copy Path',
    'feature.copy.description': 'Copy the code path to clipboard',
    'feature.target.label': 'Open Target',
    'feature.target.description': 'Open the target url',
    'feature.ai.label': 'AI Assistant',
    'feature.ai.description': 'Use AI for coding',
    'console.expandGuide': '[code-inspector-plugin] click to expand the guide',
    'console.leftClick': 'left click',
    'console.rightClick': 'right click',
    'console.mouseWheel': 'mouse wheel',
    'console.useActiveFeature': ' to use active feature',
    'console.openNodeTree': ' to open node tree',
    'console.selectParentOrChild': ' to select parent node or child node',
    'console.changeActiveFeature': ' to change active feature',
    'console.use': ' to use ',
    'notification.copySuccess': '✓ Copied to clipboard',
    'notification.copyFailed': '✗ Copy failed',
    'notification.imageTooLarge': 'Image too large ({size}). Max 5MB.',
    'notification.readPastedImageFailed': 'Failed to read pasted image',
    'notification.sendMessageFailed': 'Failed to send message',
    'settings.modeSettings': 'Mode Settings',
    'tree.clickNodeToLocate': 'Click node to locate',
    'chat.title': 'AI Assistant',
    'chat.switchProvider': 'Switch AI provider',
    'chat.switchModel': 'Switch model',
    'chat.global': 'Global',
    'chat.history': 'History',
    'chat.switchToLightTheme': 'Switch to light theme',
    'chat.switchToDarkTheme': 'Switch to dark theme',
    'chat.clear': 'Clear',
    'chat.close': 'Close',
    'chat.newConversation': 'New conversation',
    'chat.backToChat': 'Back to chat',
    'chat.loading': 'Loading...',
    'chat.noHistoryYet': 'No history yet',
    'chat.untitled': 'Untitled',
    'chat.delete': 'Delete',
    'chat.processExitedWithCode': 'Process exited with code {code}',
    'chat.askAnything': 'Ask me anything about this code...',
    'chat.running': 'Running',
    'chat.done': 'Done',
    'chat.interrupt': 'Interrupt',
    'chat.revertAll': 'Revert All',
    'chat.revertingAll': 'Reverting...',
    'chat.removeImage': 'Remove image',
    'chat.inputPlaceholder': 'Enter your message... (supports paste image)',
    'chat.send': 'Send (Enter)',
    'chat.closeTerminalTitle': 'Choose how to close the terminal',
    'chat.closeTaskTitle': 'Task is still running',
    'chat.closeTerminalDesc': 'You can keep the terminal running in the background, or kill the terminal now.',
    'chat.closeTaskDesc': 'Closing this dialog will keep the task running in the background.',
    'chat.killTerminal': 'Kill Terminal',
    'chat.terminate': 'Terminate',
    'chat.keepInBackground': 'Keep In Background',
    'chat.confirm': 'Confirm',
    'chat.cancel': 'Cancel',
    'chat.switchTerminalTitle': 'Switch terminal provider or model',
    'chat.switchTerminalDesc': 'Keep the current terminal running, or kill it and switch to the new selection.',
    'chat.killAndSwitch': 'Kill and switch',
    'chat.keepCurrentTerminal': 'Keep current terminal',
    'chat.context': 'Context',
    'chat.justNow': 'Just now',
    'chat.minutesAgo': '{count}m ago',
    'chat.hoursAgo': '{count}h ago',
    'chat.messages': '{count} msgs',
    'chat.resumeAfterRefresh': 'The previous task was interrupted by a page refresh. Please continue from where you left off.',
    'tool.read': 'Read',
    'tool.write': 'Write',
    'tool.edit': 'Edit',
    'tool.glob': 'Glob',
    'tool.grep': 'Grep',
    'tool.bash': 'Bash',
    'tool.webFetch': 'WebFetch',
    'tool.webSearch': 'WebSearch',
    'tool.edited': 'Edited',
    'tool.search': 'Search',
    'tool.update': 'Update',
    'tool.list': 'List',
    'tool.fetch': 'Fetch',
    'tool.reverting': 'Reverting...',
    'tool.reverted': '✓ Reverted',
    'tool.revert': 'Revert',
    'tool.wroteLines': 'Wrote {count} lines',
    'tool.lines': '{count} lines',
    'tool.collapsedLines': '...{count} lines',
    'tool.terminalExitMessage': '[Terminal] Process exited with code {code}',
    'misc.pastedImage': 'pasted-image',
  },
  zh: {
    'feature.locate.label': '定位代码',
    'feature.locate.description': '打开编辑器并定位到代码',
    'feature.copy.label': '复制路径',
    'feature.copy.description': '复制代码路径到剪贴板',
    'feature.target.label': '打开目标',
    'feature.target.description': '打开目标链接',
    'feature.ai.label': 'AI 助手',
    'feature.ai.description': '使用 AI 辅助编码',
    'console.expandGuide': '[code-inspector-plugin] 点击展开使用说明',
    'console.leftClick': '左键点击',
    'console.rightClick': '右键点击',
    'console.mouseWheel': '滚轮',
    'console.useActiveFeature': ' 触发当前功能',
    'console.openNodeTree': ' 打开节点树',
    'console.selectParentOrChild': ' 选择父节点或子节点',
    'console.changeActiveFeature': ' 切换当前功能',
    'console.use': ' 使用 ',
    'notification.copySuccess': '✓ 已复制到剪贴板',
    'notification.copyFailed': '✗ 复制失败',
    'notification.imageTooLarge': '图片过大（{size}），最大支持 5MB。',
    'notification.readPastedImageFailed': '读取粘贴图片失败',
    'notification.sendMessageFailed': '发送消息失败',
    'settings.modeSettings': '模式设置',
    'tree.clickNodeToLocate': '点击节点进行定位',
    'chat.title': 'AI 助手',
    'chat.switchProvider': '切换 AI 提供方',
    'chat.switchModel': '切换模型',
    'chat.global': '全局',
    'chat.history': '历史记录',
    'chat.switchToLightTheme': '切换到浅色主题',
    'chat.switchToDarkTheme': '切换到深色主题',
    'chat.clear': '清空',
    'chat.close': '关闭',
    'chat.newConversation': '新建对话',
    'chat.backToChat': '返回对话',
    'chat.loading': '加载中...',
    'chat.noHistoryYet': '暂无历史记录',
    'chat.untitled': '未命名',
    'chat.delete': '删除',
    'chat.processExitedWithCode': '进程已退出，退出码 {code}',
    'chat.askAnything': '可以问我任何与这段代码相关的问题...',
    'chat.running': '运行中',
    'chat.done': '完成',
    'chat.interrupt': '中断',
    'chat.revertAll': '全部回退',
    'chat.revertingAll': '回退中...',
    'chat.removeImage': '移除图片',
    'chat.inputPlaceholder': '输入消息...（支持粘贴图片）',
    'chat.send': '发送（Enter）',
    'chat.closeTerminalTitle': '选择如何关闭终端',
    'chat.closeTaskTitle': '任务仍在运行',
    'chat.closeTerminalDesc': '你可以让终端继续在后台运行，或立即杀掉终端。',
    'chat.closeTaskDesc': '关闭此对话框后，任务会继续在后台运行。',
    'chat.killTerminal': '杀掉终端',
    'chat.terminate': '终止',
    'chat.keepInBackground': '保留后台运行',
    'chat.confirm': '确认',
    'chat.cancel': '取消',
    'chat.switchTerminalTitle': '切换终端提供方或模型',
    'chat.switchTerminalDesc': '保留当前终端继续运行，或杀掉终端并切换到新的选择。',
    'chat.killAndSwitch': '杀掉并切换',
    'chat.keepCurrentTerminal': '保留当前终端',
    'chat.context': '上下文',
    'chat.justNow': '刚刚',
    'chat.minutesAgo': '{count} 分钟前',
    'chat.hoursAgo': '{count} 小时前',
    'chat.messages': '{count} 条消息',
    'chat.resumeAfterRefresh': '上一次任务因页面刷新被中断，请从中断处继续。',
    'tool.read': '读取',
    'tool.write': '写入',
    'tool.edit': '编辑',
    'tool.glob': '匹配',
    'tool.grep': '搜索',
    'tool.bash': '命令',
    'tool.webFetch': '抓取',
    'tool.webSearch': '搜索',
    'tool.edited': '已编辑',
    'tool.search': '搜索',
    'tool.update': '更新',
    'tool.list': '列出',
    'tool.fetch': '抓取',
    'tool.reverting': '回退中...',
    'tool.reverted': '✓ 已回退',
    'tool.revert': '回退',
    'tool.wroteLines': '写入了 {count} 行',
    'tool.lines': '{count} 行',
    'tool.collapsedLines': '...{count} 行',
    'tool.terminalExitMessage': '[终端] 进程已退出，退出码 {code}',
    'misc.pastedImage': '粘贴图片',
  },
};

export function normalizeClientLang(lang?: string | null): ClientLang {
  return lang === 'zh' ? 'zh' : 'en';
}

export function getClientText(
  lang: string | null | undefined,
  key: string,
  vars?: TemplateVars,
): string {
  const normalizedLang = normalizeClientLang(lang);
  const template =
    MESSAGES[normalizedLang][key] ||
    MESSAGES.en[key] ||
    key;
  if (!vars) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    return String(vars[name] ?? '');
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
