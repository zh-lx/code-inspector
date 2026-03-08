import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserChalkChain, browserChalk } from '@/core/src/shared/browser-chalk';

describe('browser-chalk', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should build text/styles with colors and line breaks', () => {
    const result = new BrowserChalkChain()
      .blue('A')
      .line()
      .green('B')
      .build();

    expect(result.text).toBe('%cA\n%cB');
    expect(result.styles).toEqual([
      'color: #006aff; word-break: break-word;',
      'color: #00B42A; word-break: break-word;',
    ]);
  });

  it('should support merge, text, styled, bold and style append', () => {
    const left = new BrowserChalkChain().text('left');
    const right = new BrowserChalkChain().styled('right', 'color:red;').bold();
    left.merge(right).style(' text-decoration: underline;');

    const built = left.build();
    expect(built.text).toBe('%cleft%cright');
    expect(built.styles[0]).toBe('');
    expect(built.styles[1]).toContain('color:red;');
    expect(built.styles[1]).toContain('font-weight: bold;');
    expect(built.styles[1]).toContain('text-decoration: underline;');
  });

  it('should support bold with direct argument', () => {
    const built = new BrowserChalkChain().bold('X').build();
    expect(built.text).toBe('%cX');
    expect(built.styles).toEqual(['font-weight: bold;']);
  });

  it('should support log/warn/error output', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const chain = new BrowserChalkChain().yellow('Y');
    chain.log();
    chain.warn();
    chain.error();

    expect(logSpy).toHaveBeenCalledWith('%cY', 'color: #FF7D00; word-break: break-word;');
    expect(warnSpy).toHaveBeenCalledWith('%cY', 'color: #FF7D00; word-break: break-word;');
    expect(errorSpy).toHaveBeenCalledWith('%cY', 'color: #FF7D00; word-break: break-word;');
  });

  it('should support groupCollapsed and group wrappers', () => {
    const collapsedSpy = vi.spyOn(console, 'groupCollapsed').mockImplementation(() => {});
    const groupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
    const endSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
    const fn = vi.fn();

    const chain = new BrowserChalkChain().red('R');
    chain.groupCollapsed(fn);
    chain.group(fn);

    expect(collapsedSpy).toHaveBeenCalledWith('%cR', 'color: #F53F3F; word-break: break-word;');
    expect(groupSpy).toHaveBeenCalledWith('%cR', 'color: #F53F3F; word-break: break-word;');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(endSpy).toHaveBeenCalledTimes(2);
  });

  it('should create chains via browserChalk factory', () => {
    const built = browserChalk.blue('A').gray('B').build();
    expect(built.text).toBe('%cA%cB');
    expect(built.styles).toHaveLength(2);

    const built2 = browserChalk.bold('X').build();
    expect(built2.styles[0]).toContain('font-weight: bold;');
  });
});
