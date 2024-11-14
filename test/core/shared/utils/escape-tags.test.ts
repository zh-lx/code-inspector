import { isEscapeTags } from '@/core/src/shared/utils';
import { EscapeTags } from '@/core/src/shared/type';
import { expect, describe, it } from 'vitest';

describe('isEscapeTags', () => {
  it('string escape tags case-insensitively', () => {
    const escapeTags: EscapeTags = ['Script', 'STYLE', 'link'];
    
    expect(isEscapeTags(escapeTags, 'script')).toBe(true);
    expect(isEscapeTags(escapeTags, 'SCRIPT')).toBe(true);
    expect(isEscapeTags(escapeTags, 'style')).toBe(true);
    expect(isEscapeTags(escapeTags, 'STYLE')).toBe(true);
    expect(isEscapeTags(escapeTags, 'Link')).toBe(true);
    expect(isEscapeTags(escapeTags, 'LINK')).toBe(true);
    expect(isEscapeTags(escapeTags, 'div')).toBe(false);
    expect(isEscapeTags(escapeTags, 'span')).toBe(false);
  });

  it('RegExp escape tags', () => {
    const escapeTags: EscapeTags = [/^custom-.*/, /^x-.*/];
    
    expect(isEscapeTags(escapeTags, 'custom-element')).toBe(true);
    expect(isEscapeTags(escapeTags, 'x-component')).toBe(true);
    expect(isEscapeTags(escapeTags, 'CUSTOM-ELEMENT')).toBe(true);
    expect(isEscapeTags(escapeTags, 'X-COMPONENT')).toBe(true);
    expect(isEscapeTags(escapeTags, 'my-element')).toBe(false);
    expect(isEscapeTags(escapeTags, 'component')).toBe(false);
  });

  it('should work with mixed string and RegExp escape tags', () => {
    const escapeTags: EscapeTags = ['script', /^custom-.*/, 'style'];
    
    expect(isEscapeTags(escapeTags, 'script')).toBe(true);
    expect(isEscapeTags(escapeTags, 'SCRIPT')).toBe(true);
    expect(isEscapeTags(escapeTags, 'custom-element')).toBe(true);
    expect(isEscapeTags(escapeTags, 'CUSTOM-ELEMENT')).toBe(true);
    expect(isEscapeTags(escapeTags, 'style')).toBe(true);
    expect(isEscapeTags(escapeTags, 'STYLE')).toBe(true);
    expect(isEscapeTags(escapeTags, 'div')).toBe(false);
  });

  it('should handle empty escape tags array', () => {
    const escapeTags: EscapeTags = [];
    
    expect(isEscapeTags(escapeTags, 'script')).toBe(false);
    expect(isEscapeTags(escapeTags, 'custom-element')).toBe(false);
  });
});
