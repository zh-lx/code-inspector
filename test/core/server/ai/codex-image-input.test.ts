import fs from 'fs';
import { describe, expect, it } from 'vitest';
import { __TEST_ONLY__ } from '@/core/src/server/ai-provider-codex';

const PNG_DATA_URL = 'data:image/png;base64,aGVsbG8=';
const JPEG_DATA_URL = 'data:image/jpeg;base64,d29ybGQ=';

describe('codex image input helpers', () => {
  it('should strip inline image data urls from history text', () => {
    const text = `before ${PNG_DATA_URL} after`;
    const stripped = __TEST_ONLY__.stripInlineImageDataUrls(text);
    expect(stripped).toContain('[Inline image data omitted]');
    expect(stripped).not.toContain('data:image/png;base64');
  });

  it('should extract inline images and rewrite text placeholders', () => {
    const text = `A\n${PNG_DATA_URL}\nB\n${JPEG_DATA_URL}`;
    const extracted = __TEST_ONLY__.extractInlineImages(text);

    expect(extracted.images).toHaveLength(2);
    expect(extracted.images[0]).toEqual({
      mediaType: 'image/png',
      data: 'aGVsbG8=',
    });
    expect(extracted.images[1]).toEqual({
      mediaType: 'image/jpeg',
      data: 'd29ybGQ=',
    });
    expect(extracted.text).toContain('[Inline image 1 attached separately (image/png)]');
    expect(extracted.text).toContain('[Inline image 2 attached separately (image/jpeg)]');
  });

  it('should persist and cleanup temp image files', () => {
    const { imagePaths, failedCount } = __TEST_ONLY__.persistInlineImagesToTempFiles([
      { mediaType: 'image/png', data: 'aGVsbG8=' },
      { mediaType: 'image/jpeg', data: 'd29ybGQ=' },
    ]);

    expect(failedCount).toBe(0);
    expect(imagePaths).toHaveLength(2);
    expect(imagePaths.every((filePath) => fs.existsSync(filePath))).toBe(true);
    expect(fs.readFileSync(imagePaths[0], 'utf-8')).toBe('hello');
    expect(fs.readFileSync(imagePaths[1], 'utf-8')).toBe('world');

    __TEST_ONLY__.cleanupTempFiles(imagePaths);
    expect(imagePaths.every((filePath) => !fs.existsSync(filePath))).toBe(true);
  });

  it('should build sdk run input with local_image blocks', () => {
    const prompt = 'describe this screenshot';
    const asTextOnly = __TEST_ONLY__.buildCodexSdkRunInput(prompt, []);
    expect(asTextOnly).toBe(prompt);

    const asMultimodal = __TEST_ONLY__.buildCodexSdkRunInput(prompt, ['/tmp/a.png', '/tmp/b.jpg']);
    expect(asMultimodal).toEqual([
      { type: 'text', text: prompt },
      { type: 'local_image', path: '/tmp/a.png' },
      { type: 'local_image', path: '/tmp/b.jpg' },
    ]);
  });

  it('should build cli args with option separator when images are attached', () => {
    const args = __TEST_ONLY__.buildCodexExecArgs(
      {},
      '/tmp/out.txt',
      ['/tmp/a.png'],
      'hello prompt'
    );
    expect(args).toEqual([
      'exec',
      '--json',
      '-o',
      '/tmp/out.txt',
      '--image',
      '/tmp/a.png',
      '--',
      'hello prompt',
    ]);
  });

  it('should build resume cli args with option separator when images are attached', () => {
    const args = __TEST_ONLY__.buildCodexExecArgs(
      {},
      '/tmp/out.txt',
      ['/tmp/a.png'],
      'hello prompt',
      'session-1'
    );
    expect(args).toEqual([
      'exec',
      'resume',
      '--json',
      '-o',
      '/tmp/out.txt',
      '--image',
      '/tmp/a.png',
      '--',
      'session-1',
      'hello prompt',
    ]);
  });

  it('should build opencode run args with session and file attachments (prompt omitted for stdin)', () => {
    const args = __TEST_ONLY__.buildOpenCodeRunArgs(
      { model: 'openai/gpt-4.1', profile: 'reviewer' } as any,
      ['/tmp/a.png', '/tmp/b.jpg'],
      'hello prompt',
      'session-1',
    );
    // When images are present the prompt is sent via stdin, not as a positional arg
    expect(args).toEqual([
      'run',
      '--format',
      'json',
      '-m',
      'openai/gpt-4.1',
      '--agent',
      'reviewer',
      '--session',
      'session-1',
      '--file',
      '/tmp/a.png',
      '--file',
      '/tmp/b.jpg',
    ]);
  });

  it('should include prompt as positional arg when no images are attached', () => {
    const args = __TEST_ONLY__.buildOpenCodeRunArgs(
      { model: 'openai/gpt-4.1' } as any,
      [],
      'hello prompt',
    );
    expect(args).toEqual([
      'run',
      '--format',
      'json',
      '-m',
      'openai/gpt-4.1',
      'hello prompt',
    ]);
  });
});
