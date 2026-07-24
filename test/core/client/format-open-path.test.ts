import { describe, expect, it } from 'vitest';
import { formatOpenPath } from '../../../packages/core/src/client/format-open-path';

describe('formatOpenPath', () => {
  it('uses the default file location format', () => {
    expect(formatOpenPath('/src/app.ts', 12, 4, false)).toEqual([
      '/src/app.ts:12:4',
    ]);
  });

  it('applies a custom string format', () => {
    expect(
      formatOpenPath('/src/app.ts', '12', '4', '{file}#{line}:{column}'),
    ).toEqual(['/src/app.ts#12:4']);
  });

  it('applies every format in an array', () => {
    expect(
      formatOpenPath('/src/app.ts', 12, 4, [
        '--file={file}',
        '--position={line}:{column}',
      ]),
    ).toEqual(['--file=/src/app.ts', '--position=12:4']);
  });
});
