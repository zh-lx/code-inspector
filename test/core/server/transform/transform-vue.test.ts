import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import { transformVue } from '@/core/src/server/transform/transform-vue';
import { PathName } from '@/core/src/shared/constant';

// Only mock server module, not fs
vi.mock('@/core/src/server/server', () => ({
  ProjectRootPath: '/mock/project',
}));

describe('transformVue', () => {
  const filePath = 'test/file.vue';
  // Note: don't include 'template' in escapeTags for testing template content
  const defaultEscapeTags = ['script', 'style'];

  describe('basic template transformation', () => {
    it('should add data-insp-path attribute to template elements', () => {
      const content = '<template><div>Hello</div></template>';
      const result = transformVue(content, filePath, defaultEscapeTags);

      expect(result).toContain(`${PathName}="${filePath}:1:11:div"`);
    });

    it('should add data-insp-path to nested elements', () => {
      const content = '<template><div><span>Hello</span></div></template>';
      const result = transformVue(content, filePath, defaultEscapeTags);

      expect(result).toContain(':div"');
      expect(result).toContain(':span"');
    });

    it('should handle self-closing elements', () => {
      const content = '<template><input type="text" /></template>';
      const result = transformVue(content, filePath, defaultEscapeTags);

      expect(result).toContain(`${PathName}="${filePath}:1:11:input"`);
    });

    it('should add space after path attribute when element has existing props', () => {
      const content = '<template><div class="test">Hello</div></template>';
      const result = transformVue(content, filePath, defaultEscapeTags);

      expect(result).toContain(`${PathName}="${filePath}:1:11:div" `);
    });

    it('should not add extra space when element has no props', () => {
      const content = '<template><div>Hello</div></template>';
      const result = transformVue(content, filePath, defaultEscapeTags);

      expect(result).toContain(`${PathName}="${filePath}:1:11:div">`);
    });
  });

  describe('escape tags', () => {
    it('should not transform escaped tags (string)', () => {
      const content = '<template><component :is="comp">Hello</component></template>';
      const result = transformVue(content, filePath, ['component']);

      expect(result).not.toContain(`:component"`);
    });

    it('should not transform escaped tags (RegExp)', () => {
      const content = '<template><custom-element>Hello</custom-element></template>';
      const result = transformVue(content, filePath, [/^custom-/]);

      expect(result).not.toContain(`:custom-element"`);
    });

    it('should transform non-escaped tags', () => {
      const content = '<template><div>Hello</div></template>';
      const result = transformVue(content, filePath, ['script', 'style']);

      expect(result).toContain(`:div"`);
    });

    it('should handle empty escape tags array', () => {
      const content = '<template><div>Hello</div></template>';
      const result = transformVue(content, filePath, []);

      expect(result).toContain(`:div"`);
    });
  });

  describe('skip elements with existing path', () => {
    it('should skip elements that already have data-insp-path in source', () => {
      const content = `<template><div ${PathName}="existing/path">Hello</div></template>`;
      const result = transformVue(content, filePath, defaultEscapeTags);

      // Should not add another path attribute
      expect(result.match(new RegExp(PathName, 'g'))?.length).toBe(1);
    });
  });

  describe('script and style sections', () => {
    it('should handle script section', () => {
      const content = `<script>
export default {
  name: 'TestComponent'
}
</script>

<template>
  <div>Hello</div>
</template>`;
      const result = transformVue(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
      expect(result).toContain("name: 'TestComponent'");
    });

    it('should handle script setup', () => {
      const content = `<script setup>
const msg = 'Hello';
</script>

<template>
  <div>{{ msg }}</div>
</template>`;
      const result = transformVue(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });

    it('should handle script lang="ts"', () => {
      const content = `<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'TestComponent'
});
</script>

<template>
  <div>Hello</div>
</template>`;
      const result = transformVue(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });

    it('should handle style section', () => {
      const content = `<template>
  <div>Hello</div>
</template>

<style>
div { color: red; }
</style>`;
      const result = transformVue(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
      expect(result).toContain('color: red');
    });

    it('should handle style scoped', () => {
      const content = `<template>
  <div>Hello</div>
</template>

<style scoped>
div { color: red; }
</style>`;
      const result = transformVue(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });
  });

  describe('line and column tracking', () => {
    it('should track correct line and column', () => {
      const content = '<template><div>Hello</div></template>';
      const result = transformVue(content, filePath, defaultEscapeTags);

      expect(result).toContain(`${filePath}:1:11:div"`);
    });

    it('should track correct line and column for multi-line', () => {
      const content = `<template>
  <div>
    <span>Hello</span>
  </div>
</template>`;
      const result = transformVue(content, filePath, defaultEscapeTags);

      expect(result).toContain(`${filePath}:2:3:div"`);
      expect(result).toContain(`${filePath}:3:5:span"`);
    });
  });

  describe('Vue-specific directives', () => {
    it('should handle v-if', () => {
      const content = '<template><div v-if="show">Hello</div></template>';
      const result = transformVue(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });

    it('should handle v-for', () => {
      const content = '<template><div v-for="item in items" :key="item.id">{{ item.name }}</div></template>';
      const result = transformVue(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });

    it('should handle v-bind', () => {
      const content = '<template><div :class="dynamicClass">Hello</div></template>';
      const result = transformVue(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });

    it('should handle v-on', () => {
      const content = '<template><button @click="handleClick">Click</button></template>';
      const result = transformVue(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:button"`);
    });

    it('should handle v-model', () => {
      const content = '<template><input v-model="value" /></template>';
      const result = transformVue(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:input"`);
    });

    it('should handle v-slot', () => {
      const content = '<template><MyComponent><template v-slot:default>Content</template></MyComponent></template>';
      const result = transformVue(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:MyComponent"`);
    });
  });

  describe('Pug template', () => {
    it('should transform Pug template with simple element', () => {
      const content = `<template lang="pug">
div Hello
</template>`;
      const result = transformVue(content, filePath, defaultEscapeTags);

      expect(result).toContain(`${PathName}="${filePath}:`);
      expect(result).toContain(':div"');
    });

    it('should transform Pug template with nested elements', () => {
      const content = `<template lang="pug">
div
  span Hello
</template>`;
      const result = transformVue(content, filePath, defaultEscapeTags);

      expect(result).toContain(':div"');
      expect(result).toContain(':span"');
    });

    it('should transform Pug template with existing attributes using parentheses', () => {
      const content = `<template lang="pug">
div(class="container")
  span Hello
</template>`;
      const result = transformVue(content, filePath, defaultEscapeTags);

      expect(result).toContain(':div"');
      expect(result).toContain(':span"');
    });

    it('should transform Pug template with id shorthand', () => {
      const content = `<template lang="pug">
div#app Hello
</template>`;
      const result = transformVue(content, filePath, defaultEscapeTags);

      expect(result).toContain(':div"');
    });

    it('should transform Pug template with class shorthand', () => {
      const content = `<template lang="pug">
div.container Hello
</template>`;
      const result = transformVue(content, filePath, defaultEscapeTags);

      expect(result).toContain(':div"');
    });

    it('should transform Pug template with multiple class shorthands', () => {
      const content = `<template lang="pug">
div.container.wrapper Hello
</template>`;
      const result = transformVue(content, filePath, defaultEscapeTags);

      expect(result).toContain(':div"');
    });

    it('should transform Pug template element starting with class shorthand only', () => {
      // Test when element starts with .class instead of tag name
      // This tests the else branch where node.name doesn't match the start
      const content = `<template lang="pug">
.my-class Hello
</template>`;
      const result = transformVue(content, 'test/pug-class-only.vue', defaultEscapeTags);

      expect(result).toContain(':div"');
    });

    it('should transform Pug template element starting with id shorthand only', () => {
      // Test when element starts with #id instead of tag name
      const content = `<template lang="pug">
#my-id Hello
</template>`;
      const result = transformVue(content, 'test/pug-id-only.vue', defaultEscapeTags);

      expect(result).toContain(':div"');
    });

    it('should transform Pug template with class shorthand and existing parentheses attributes', () => {
      // Test the branch where content[insertPosition] === '('
      const content = `<template lang="pug">
.my-class(data-foo="bar") Hello
</template>`;
      const result = transformVue(content, 'test/pug-class-attrs.vue', defaultEscapeTags);

      expect(result).toContain(':div"');
      expect(result).toContain('data-foo="bar"');
    });

    it('should not transform escaped tags in Pug', () => {
      const content = `<template lang="pug">
component(:is="comp") Hello
</template>`;
      const result = transformVue(content, filePath, ['component']);

      expect(result).not.toContain(`:component"`);
    });

    it('should handle Pug conditionals', () => {
      const content = `<template lang="pug">
if show
  div Visible
else
  span Hidden
</template>`;
      const result = transformVue(content, filePath, defaultEscapeTags);

      expect(result).toContain(':div"');
      expect(result).toContain(':span"');
    });

    it('should handle Pug each loop', () => {
      const content = `<template lang="pug">
each item in items
  li= item
</template>`;
      const result = transformVue(content, filePath, defaultEscapeTags);

      expect(result).toContain(':li"');
    });

    it('should handle Pug while loop', () => {
      const content = `<template lang="pug">
- var n = 0
while n < 3
  li= n++
</template>`;
      const result = transformVue(content, filePath, defaultEscapeTags);

      expect(result).toContain(':li"');
    });

    it('should handle Pug case/when', () => {
      const content = `<template lang="pug">
case value
  when 1
    div One
  when 2
    span Two
  default
    p Default
</template>`;
      const result = transformVue(content, filePath, defaultEscapeTags);

      expect(result).toContain(':div"');
      expect(result).toContain(':span"');
      expect(result).toContain(':p"');
    });

    it('should skip Pug elements with existing path attribute', () => {
      const content = `<template lang="pug">
div(${PathName}="existing/path") Hello
</template>`;
      const result = transformVue(content, filePath, defaultEscapeTags);

      // Should not add another path
      expect(result.match(new RegExp(PathName, 'g'))?.length).toBe(1);
    });

    it('should handle Pug hot reload with partial content', () => {
      // First, register a file in pugMap by transforming it
      const uniqueFilePath = 'test/pug-hot-reload.vue';
      const fullContent = `<template lang="pug">
div Hello
</template>`;
      // First transformation registers the file in pugMap
      transformVue(fullContent, uniqueFilePath, defaultEscapeTags);

      // Second transformation with same filePath (already in pugMap)
      // This tests the path where pugMap.has(filePath) is true
      // and content doesn't include PathName (will try to read file)
      const result = transformVue(fullContent, uniqueFilePath, defaultEscapeTags);

      expect(result).toContain(':div"');
    });

    it('should handle Pug hot reload with fs.readFileSync success', () => {
      // Use unique filePath
      const uniqueFilePath = 'test/pug-hot-reload-fs.vue';
      const fullContent = `<template lang="pug">
div Hello
</template>`;

      // First transformation registers the file in pugMap
      transformVue(fullContent, uniqueFilePath, defaultEscapeTags);

      // Mock fs.readFileSync to return full content
      const readFileSyncSpy = vi.spyOn(fs, 'readFileSync').mockReturnValue(fullContent);

      // Second transformation with partial content that doesn't include PathName
      // This triggers the fs.readFileSync path
      const partialContent = 'div Hello';
      const result = transformVue(partialContent, uniqueFilePath, defaultEscapeTags);

      readFileSyncSpy.mockRestore();

      // Result should still be processed
      expect(result).toBeDefined();
    });

    it('should handle Pug hot reload when content includes PathName', () => {
      // Use unique filePath
      const uniqueFilePath = 'test/pug-already-has-path.vue';
      const fullContent = `<template lang="pug">
div Hello
</template>`;

      // First transformation registers the file in pugMap
      transformVue(fullContent, uniqueFilePath, defaultEscapeTags);

      // Second transformation where content already includes PathName
      // This should skip the fs.readFileSync path
      const contentWithPath = `<template lang="pug">
div(${PathName}="existing") Hello
</template>`;
      const result = transformVue(contentWithPath, uniqueFilePath, defaultEscapeTags);

      expect(result).toBeDefined();
    });

    it('should handle Pug hot reload with relative file path', () => {
      // Use a relative path that will trigger the ProjectRootPath branch
      const relativeFilePath = 'relative/pug-file.vue';
      const fullContent = `<template lang="pug">
div Hello
</template>`;

      // First transformation registers the file in pugMap
      transformVue(fullContent, relativeFilePath, defaultEscapeTags);

      // Mock fs.readFileSync to throw error (file not found with absolute path)
      const readFileSyncSpy = vi.spyOn(fs, 'readFileSync').mockImplementation(() => {
        throw new Error('File not found');
      });

      // Second transformation with partial content (without PathName)
      // This triggers the path that uses ProjectRootPath
      const partialContent = 'div Hello';
      const result = transformVue(partialContent, relativeFilePath, defaultEscapeTags);

      readFileSyncSpy.mockRestore();

      // Result should still be defined (error is caught)
      expect(result).toBeDefined();
    });

    it('should handle Pug hot reload with absolute file path', () => {
      // Use an absolute path to trigger the other branch (filePath directly)
      const absoluteFilePath = '/absolute/path/pug-file.vue';
      const fullContent = `<template lang="pug">
div Hello
</template>`;

      // First transformation registers the file in pugMap
      transformVue(fullContent, absoluteFilePath, defaultEscapeTags);

      // Mock fs.readFileSync to return content for successful read
      const readFileSyncSpy = vi.spyOn(fs, 'readFileSync').mockReturnValue(fullContent);

      // Second transformation with partial content (without PathName)
      // This triggers the branch where absolute path is used directly
      const partialContent = 'div Hello';
      const result = transformVue(partialContent, absoluteFilePath, defaultEscapeTags);

      readFileSyncSpy.mockRestore();

      // Result should still be defined
      expect(result).toBeDefined();
    });
  });

  describe('belongTemplate function coverage', () => {
    it('should handle target line between start and end', () => {
      const content = `<template lang="pug">
div
  span Hello
</template>`;
      const result = transformVue(content, filePath, defaultEscapeTags);

      expect(result).toContain(':span"');
    });

    it('should handle target on start line with column', () => {
      // Pug on separate line from template tag
      const content = `<template lang="pug">
div Hello
</template>`;
      const result = transformVue(content, filePath, defaultEscapeTags);

      expect(result).toContain(':div"');
    });

    it('should handle target on end line with column', () => {
      const content = `<template lang="pug">
div Hello
</template>`;
      const result = transformVue(content, filePath, defaultEscapeTags);

      expect(result).toContain(':div"');
    });
  });

  describe('complex scenarios', () => {
    it('should handle deeply nested elements', () => {
      // Use unique filePath to avoid pugMap interference
      const uniqueFilePath = 'test/complex-nested.vue';
      const content = `<template>
  <div>
    <section>
      <article>
        <p>
          <span>Deep</span>
        </p>
      </article>
    </section>
  </div>
</template>`;
      const result = transformVue(content, uniqueFilePath, defaultEscapeTags);

      expect(result).toContain(':div"');
      expect(result).toContain(':section"');
      expect(result).toContain(':article"');
      expect(result).toContain(':p"');
      expect(result).toContain(':span"');
    });

    it('should handle full SFC with all sections', () => {
      // Use unique filePath to avoid pugMap interference
      const uniqueFilePath = 'test/full-sfc.vue';
      const content = `<script setup lang="ts">
import { ref } from 'vue';

const count = ref(0);
</script>

<template>
  <div class="container">
    <h1>Hello Vue!</h1>
    <button @click="count++">Count: {{ count }}</button>
  </div>
</template>

<style scoped>
.container {
  text-align: center;
}
</style>`;
      const result = transformVue(content, uniqueFilePath, defaultEscapeTags);

      expect(result).toContain(':div"');
      expect(result).toContain(':h1"');
      expect(result).toContain(':button"');
      expect(result).toContain("import { ref } from 'vue'");
      expect(result).toContain('text-align: center');
    });

    it('should handle template with HTML comments', () => {
      // Use unique filePath to avoid pugMap interference
      const uniqueFilePath = 'test/with-comments.vue';
      const content = `<template>
  <!-- This is a comment -->
  <div>Hello</div>
</template>`;
      const result = transformVue(content, uniqueFilePath, defaultEscapeTags);

      expect(result).toContain(':div"');
      expect(result).toContain('<!-- This is a comment -->');
    });

    it('should handle component with custom elements', () => {
      // Use unique filePath to avoid pugMap interference
      const uniqueFilePath = 'test/custom-elements.vue';
      const content = `<template>
  <my-component>
    <template #header>
      <h1>Header</h1>
    </template>
    <p>Content</p>
  </my-component>
</template>`;
      const result = transformVue(content, uniqueFilePath, defaultEscapeTags);

      expect(result).toContain(':my-component"');
      expect(result).toContain(':h1"');
      expect(result).toContain(':p"');
    });
  });

  describe('edge cases', () => {
    it('should handle template without root element', () => {
      // Use unique filePath to avoid pugMap interference
      const uniqueFilePath = 'test/text-only.vue';
      const content = `<template>
  Text only
</template>`;
      const result = transformVue(content, uniqueFilePath, defaultEscapeTags);

      expect(result).toContain('Text only');
    });

    it('should handle multiple root elements (Vue 3)', () => {
      // Use unique filePath to avoid pugMap interference
      const uniqueFilePath = 'test/multi-root.vue';
      const content = `<template>
  <header>Header</header>
  <main>Content</main>
  <footer>Footer</footer>
</template>`;
      const result = transformVue(content, uniqueFilePath, defaultEscapeTags);

      expect(result).toContain(':header"');
      expect(result).toContain(':main"');
      expect(result).toContain(':footer"');
    });

    it('should preserve original content structure', () => {
      // Use unique filePath to avoid pugMap interference
      const uniqueFilePath = 'test/preserve-structure.vue';
      const content = `<template>
  <div>
    Hello
  </div>
</template>`;
      const result = transformVue(content, uniqueFilePath, defaultEscapeTags);

      // template tag will be transformed but check that structure is preserved
      expect(result).toContain('template');
      expect(result).toContain('</template>');
      expect(result).toContain('Hello');
      expect(result).toContain(':div"');
    });
  });
});
