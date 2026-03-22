export type ClientLang = 'en' | 'zh';
type TemplateValue = string | number;
declare const MESSAGES: {
  readonly 'feature.locate.label': {
    readonly en: 'Locate Code';
    readonly zh: '定位代码';
  };
  readonly 'feature.locate.description': {
    readonly en: 'Open the editor and locate code';
    readonly zh: '打开编辑器并定位到代码';
  };
  readonly 'feature.copy.label': {
    readonly en: 'Copy Path';
    readonly zh: '复制路径';
  };
  readonly 'feature.copy.description': {
    readonly en: 'Copy the code path to clipboard';
    readonly zh: '复制代码路径到剪贴板';
  };
  readonly 'feature.target.label': {
    readonly en: 'Open Target';
    readonly zh: '打开目标';
  };
  readonly 'feature.target.description': {
    readonly en: 'Open the target url';
    readonly zh: '打开目标链接';
  };
  readonly 'feature.ai.label': {
    readonly en: 'AI Assistant';
    readonly zh: 'AI 助手';
  };
  readonly 'feature.ai.description': {
    readonly en: 'Use AI for coding';
    readonly zh: '使用 AI 辅助编码';
  };
  readonly 'console.expandGuide': {
    readonly en: '[code-inspector-plugin] click to expand the guide';
    readonly zh: '[code-inspector-plugin] 点击展开使用说明';
  };
  readonly 'console.leftClick': {
    readonly en: 'left click';
    readonly zh: '左键点击';
  };
  readonly 'console.rightClick': {
    readonly en: 'right click';
    readonly zh: '右键点击';
  };
  readonly 'console.mouseWheel': {
    readonly en: 'mouse wheel';
    readonly zh: '滚轮';
  };
  readonly 'console.useActiveFeature': {
    readonly en: ' to use active feature';
    readonly zh: ' 触发当前功能';
  };
  readonly 'console.openNodeTree': {
    readonly en: ' to open node tree';
    readonly zh: ' 打开节点树';
  };
  readonly 'console.selectParentOrChild': {
    readonly en: ' to select parent node or child node';
    readonly zh: ' 选择父节点或子节点';
  };
  readonly 'console.changeActiveFeature': {
    readonly en: ' to change active feature';
    readonly zh: ' 切换当前功能';
  };
  readonly 'console.use': {
    readonly en: ' to use ';
    readonly zh: ' 使用 ';
  };
  readonly 'notification.copySuccess': {
    readonly en: '✓ Copied to clipboard';
    readonly zh: '✓ 已复制到剪贴板';
  };
  readonly 'notification.copyFailed': {
    readonly en: '✗ Copy failed';
    readonly zh: '✗ 复制失败';
  };
  readonly 'notification.imageTooLarge': {
    readonly en: 'Image too large ({size}). Max 5MB.';
    readonly zh: '图片过大（{size}），最大支持 5MB。';
  };
  readonly 'notification.readPastedImageFailed': {
    readonly en: 'Failed to read pasted image';
    readonly zh: '读取粘贴图片失败';
  };
  readonly 'notification.sendMessageFailed': {
    readonly en: 'Failed to send message';
    readonly zh: '发送消息失败';
  };
  readonly 'settings.modeSettings': {
    readonly en: 'Mode Settings';
    readonly zh: '模式设置';
  };
  readonly 'tree.clickNodeToLocate': {
    readonly en: 'Click node to locate';
    readonly zh: '点击节点进行定位';
  };
  readonly 'chat.title': {
    readonly en: 'AI Assistant';
    readonly zh: 'AI 助手';
  };
  readonly 'chat.switchProvider': {
    readonly en: 'Switch AI provider';
    readonly zh: '切换 AI 提供方';
  };
  readonly 'chat.switchModel': {
    readonly en: 'Switch model';
    readonly zh: '切换模型';
  };
  readonly 'chat.global': {
    readonly en: 'Global';
    readonly zh: '全局';
  };
  readonly 'chat.history': {
    readonly en: 'History';
    readonly zh: '历史记录';
  };
  readonly 'chat.switchToLightTheme': {
    readonly en: 'Switch to light theme';
    readonly zh: '切换到浅色主题';
  };
  readonly 'chat.switchToDarkTheme': {
    readonly en: 'Switch to dark theme';
    readonly zh: '切换到深色主题';
  };
  readonly 'chat.clear': {
    readonly en: 'Clear';
    readonly zh: '清空';
  };
  readonly 'chat.close': {
    readonly en: 'Close';
    readonly zh: '关闭';
  };
  readonly 'chat.newConversation': {
    readonly en: 'New conversation';
    readonly zh: '新建对话';
  };
  readonly 'chat.backToChat': {
    readonly en: 'Back to chat';
    readonly zh: '返回对话';
  };
  readonly 'chat.loading': {
    readonly en: 'Loading...';
    readonly zh: '加载中...';
  };
  readonly 'chat.noHistoryYet': {
    readonly en: 'No history yet';
    readonly zh: '暂无历史记录';
  };
  readonly 'chat.untitled': {
    readonly en: 'Untitled';
    readonly zh: '未命名';
  };
  readonly 'chat.delete': {
    readonly en: 'Delete';
    readonly zh: '删除';
  };
  readonly 'chat.processExitedWithCode': {
    readonly en: 'Process exited with code {code}';
    readonly zh: '进程已退出，退出码 {code}';
  };
  readonly 'chat.askAnything': {
    readonly en: 'Ask me anything about this code...';
    readonly zh: '可以问我任何与这段代码相关的问题...';
  };
  readonly 'chat.running': {
    readonly en: 'Running';
    readonly zh: '运行中';
  };
  readonly 'chat.done': {
    readonly en: 'Done';
    readonly zh: '完成';
  };
  readonly 'chat.interrupt': {
    readonly en: 'Interrupt';
    readonly zh: '中断';
  };
  readonly 'chat.revertAll': {
    readonly en: 'Revert All';
    readonly zh: '全部回退';
  };
  readonly 'chat.revertingAll': {
    readonly en: 'Reverting...';
    readonly zh: '回退中...';
  };
  readonly 'chat.removeImage': {
    readonly en: 'Remove image';
    readonly zh: '移除图片';
  };
  readonly 'chat.inputPlaceholder': {
    readonly en: 'Enter your message... (supports paste image)';
    readonly zh: '输入消息...（支持粘贴图片）';
  };
  readonly 'chat.send': {
    readonly en: 'Send (Enter)';
    readonly zh: '发送（Enter）';
  };
  readonly 'chat.closeTerminalTitle': {
    readonly en: 'Choose how to close the terminal';
    readonly zh: '选择如何关闭终端';
  };
  readonly 'chat.closeTaskTitle': {
    readonly en: 'Task is still running';
    readonly zh: '任务仍在运行';
  };
  readonly 'chat.closeTerminalDesc': {
    readonly en: 'You can keep the terminal running in the background, or kill the terminal now.';
    readonly zh: '你可以让终端继续在后台运行，或立即终止终端。';
  };
  readonly 'chat.closeTaskDesc': {
    readonly en: 'Closing this dialog will keep the task running in the background.';
    readonly zh: '关闭此对话框后，任务会继续在后台运行。';
  };
  readonly 'chat.killTerminal': {
    readonly en: 'Kill Terminal';
    readonly zh: '终止终端';
  };
  readonly 'chat.terminate': {
    readonly en: 'Terminate';
    readonly zh: '终止';
  };
  readonly 'chat.keepInBackground': {
    readonly en: 'Keep In Background';
    readonly zh: '保留后台运行';
  };
  readonly 'chat.confirm': {
    readonly en: 'Confirm';
    readonly zh: '确认';
  };
  readonly 'chat.cancel': {
    readonly en: 'Cancel';
    readonly zh: '取消';
  };
  readonly 'chat.switchTerminalTitle': {
    readonly en: 'Switch terminal provider or model';
    readonly zh: '切换终端提供方或模型';
  };
  readonly 'chat.switchTerminalDesc': {
    readonly en: 'Keep the current terminal running, or kill it and switch to the new selection.';
    readonly zh: '保留当前终端继续运行，或终止终端并切换到新的选择。';
  };
  readonly 'chat.killAndSwitch': {
    readonly en: 'Kill and switch';
    readonly zh: '终止并切换';
  };
  readonly 'chat.keepCurrentTerminal': {
    readonly en: 'Keep current terminal';
    readonly zh: '保留当前终端';
  };
  readonly 'chat.context': {
    readonly en: 'Context';
    readonly zh: '上下文';
  };
  readonly 'chat.justNow': {
    readonly en: 'Just now';
    readonly zh: '刚刚';
  };
  readonly 'chat.minutesAgo': {
    readonly en: '{count}m ago';
    readonly zh: '{count} 分钟前';
  };
  readonly 'chat.hoursAgo': {
    readonly en: '{count}h ago';
    readonly zh: '{count} 小时前';
  };
  readonly 'chat.messages': {
    readonly en: '{count} msgs';
    readonly zh: '{count} 条消息';
  };
  readonly 'chat.resumeAfterRefresh': {
    readonly en: 'The previous task was interrupted by a page refresh. Please continue from where you left off.';
    readonly zh: '上一次任务因页面刷新被中断，请从中断处继续。';
  };
  readonly 'tool.read': {
    readonly en: 'Read';
    readonly zh: '读取';
  };
  readonly 'tool.write': {
    readonly en: 'Write';
    readonly zh: '写入';
  };
  readonly 'tool.edit': {
    readonly en: 'Edit';
    readonly zh: '编辑';
  };
  readonly 'tool.glob': {
    readonly en: 'Glob';
    readonly zh: '匹配';
  };
  readonly 'tool.grep': {
    readonly en: 'Grep';
    readonly zh: '搜索';
  };
  readonly 'tool.bash': {
    readonly en: 'Bash';
    readonly zh: '命令';
  };
  readonly 'tool.webFetch': {
    readonly en: 'WebFetch';
    readonly zh: '抓取';
  };
  readonly 'tool.webSearch': {
    readonly en: 'WebSearch';
    readonly zh: '搜索';
  };
  readonly 'tool.edited': {
    readonly en: 'Edited';
    readonly zh: '已编辑';
  };
  readonly 'tool.search': {
    readonly en: 'Search';
    readonly zh: '搜索';
  };
  readonly 'tool.update': {
    readonly en: 'Update';
    readonly zh: '更新';
  };
  readonly 'tool.list': {
    readonly en: 'List';
    readonly zh: '列出';
  };
  readonly 'tool.fetch': {
    readonly en: 'Fetch';
    readonly zh: '抓取';
  };
  readonly 'tool.reverting': {
    readonly en: 'Reverting...';
    readonly zh: '回退中...';
  };
  readonly 'tool.reverted': {
    readonly en: '✓ Reverted';
    readonly zh: '✓ 已回退';
  };
  readonly 'tool.revert': {
    readonly en: 'Revert';
    readonly zh: '回退';
  };
  readonly 'tool.wroteLines': {
    readonly en: 'Wrote {count} lines';
    readonly zh: '写入了 {count} 行';
  };
  readonly 'tool.lines': {
    readonly en: '{count} lines';
    readonly zh: '{count} 行';
  };
  readonly 'tool.collapsedLines': {
    readonly en: '...{count} lines';
    readonly zh: '...{count} 行';
  };
  readonly 'tool.terminalExitMessage': {
    readonly en: '[Terminal] Process exited with code {code}';
    readonly zh: '[终端] 进程已退出，退出码 {code}';
  };
  readonly 'misc.pastedImage': {
    readonly en: 'pasted-image';
    readonly zh: '粘贴图片';
  };
};
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
export declare function normalizeClientLang(lang?: string | null): ClientLang;
export declare function getClientText<K extends ClientTextKey>(
  lang: string | null | undefined,
  key: K,
  vars?: ClientTextVars<K>,
): string;
export declare function formatHistoryDateText(
  timestamp: number,
  lang: string | null | undefined,
): string;
export declare function formatFileCountText(
  count: number,
  lang: string | null | undefined,
): string;
export {};
