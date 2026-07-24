const FILE_PLACEHOLDER = '{file}';
const LINE_PLACEHOLDER = '{line}';
const COLUMN_PLACEHOLDER = '{column}';

function applyFormat(
  format: string,
  file: string,
  line: string | number,
  column: string | number,
) {
  return format
    .replace(FILE_PLACEHOLDER, file)
    .replace(LINE_PLACEHOLDER, line.toString())
    .replace(COLUMN_PLACEHOLDER, column.toString());
}

/** Browser-safe equivalent of launch-ide's formatOpenPath helper. */
export function formatOpenPath(
  file: string,
  line: string | number,
  column: string | number,
  format: string | string[] | boolean,
): string[] {
  if (typeof format === 'string') {
    return [applyFormat(format, file, line, column)];
  }

  if (Array.isArray(format)) {
    return format.map((item) => applyFormat(item, file, line, column));
  }

  return [`${file}:${line}:${column}`];
}
