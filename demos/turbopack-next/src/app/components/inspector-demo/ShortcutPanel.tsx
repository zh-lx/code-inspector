export function ShortcutPanel() {
  return (
    <div className="inspector-shortcuts" aria-label="默认组合键">
      <div className="inspector-shortcut">
        <span>Mac</span>
        <kbd>Option</kbd>+<kbd>Shift</kbd>
      </div>
      <div className="inspector-shortcut">
        <span>Windows</span>
        <kbd>Alt</kbd>+<kbd>Shift</kbd>
      </div>
    </div>
  );
}
