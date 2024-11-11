import { getMappingFilePath } from '../../../packages/core/src/shared/utils';
import { expect, describe, it } from 'vitest';

const file = '/Users/zlx/code-inspector/node_modules/three-pkg/a/b/c';
const correntPath = '/Users/zlx/code-inspector/packages/three-pkg/a/b/c';

describe('mappings', () => {
  it('record: short find no slash, replacement no slash', () => {
    const mappings = {
      'three-pkg': '/Users/zlx/code-inspector/packages/three-pkg',
    }
    const target = getMappingFilePath(file, mappings)
    expect(target).to.be.equal(correntPath);
  });

  it('record: short find slash, replacement slash', () => {
    const mappings = {
      'three-pkg/': '/Users/zlx/code-inspector/packages/three-pkg/',
    }
    const target = getMappingFilePath(file, mappings)
    expect(target).to.be.equal(correntPath);
  });

  it('record: full find', () => {
    const mappings = {
      '/Users/zlx/code-inspector/node_modules/three-pkg': '/Users/zlx/code-inspector/packages/three-pkg/',
    }
    const target = getMappingFilePath(file, mappings)
    expect(target).to.be.equal(correntPath);
  });

  it('record: no match', () => {
    const mappings = {
      'four-pkg': '/Users/zlx/code-inspector/packages/four-pkg',
    }
    const target = getMappingFilePath(file, mappings)
    expect(target).to.be.equal(file);
  });

  it('array: short find', () => {
    const mappings = [
      {
        find: 'four-pkg',
        replacement: '/Users/zlx/code-inspector/packages/four-pkg',
      },
      {
        find: 'three-pkg',
        replacement: '/Users/zlx/code-inspector/packages/three-pkg',
      }
    ]
    const target = getMappingFilePath(file, mappings)
    expect(target).to.be.equal(correntPath);
  });

  it('array: regexp', () => {
    const mappings = [
      {
        find: 'four-pkg',
        replacement: '/Users/zlx/code-inspector/packages/four-pkg',
      },
      {
        find: /three\-pkg/,
        replacement: '/Users/zlx/code-inspector/packages/three-pkg',
      }
    ]
    const target = getMappingFilePath(file, mappings)
    expect(target).to.be.equal(correntPath);
  });

  it('array: no match', () => {
    const mappings = [
      {
        find: 'four-pkg',
        replacement: '/Users/zlx/code-inspector/packages/four-pkg',
      },
      {
        find: /five\-pkg/,
        replacement: '/Users/zlx/code-inspector/packages/three-pkg',
      }
    ]
    const target = getMappingFilePath(file, mappings)
    expect(target).to.be.equal(file);
  });

  it('empty mappings', () => {
    const mappings = undefined;
    const target = getMappingFilePath(file, mappings)
    expect(target).to.be.equal(file);
  });
});
