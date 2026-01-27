import { describe, it, expect } from 'vitest';
import { transformSvelte } from '@/core/src/server/transform/transform-svelte';
import { PathName } from '@/core/src/shared/constant';

describe('transformSvelte', () => {
  const filePath = 'test/file.svelte';
  const defaultEscapeTags = ['script', 'style'];

  describe('basic transformation', () => {
    it('should add data-insp-path attribute to elements', () => {
      const content = '<div>Hello</div>';
      const result = transformSvelte(content, filePath, defaultEscapeTags);

      expect(result).toContain(`${PathName}="${filePath}:1:1:div"`);
    });

    it('should add data-insp-path to nested elements', () => {
      const content = '<div><span>Hello</span></div>';
      const result = transformSvelte(content, filePath, defaultEscapeTags);

      expect(result).toContain(':div"');
      expect(result).toContain(':span"');
    });

    it('should handle self-closing elements', () => {
      const content = '<input type="text" />';
      const result = transformSvelte(content, filePath, defaultEscapeTags);

      expect(result).toContain(`${PathName}="${filePath}:1:1:input"`);
    });

    it('should add space after path attribute when element has existing attributes', () => {
      const content = '<div class="test">Hello</div>';
      const result = transformSvelte(content, filePath, defaultEscapeTags);

      expect(result).toContain(`${PathName}="${filePath}:1:1:div" `);
    });

    it('should not add extra space when element has no attributes', () => {
      const content = '<div>Hello</div>';
      const result = transformSvelte(content, filePath, defaultEscapeTags);

      expect(result).toContain(`${PathName}="${filePath}:1:1:div">`);
    });
  });

  describe('escape tags', () => {
    it('should not transform escaped tags (string)', () => {
      const content = '<div>Hello</div>';
      const result = transformSvelte(content, filePath, ['div']);

      expect(result).not.toContain(`:div"`);
    });

    it('should not transform escaped tags (RegExp)', () => {
      const content = '<custom-element>Hello</custom-element>';
      const result = transformSvelte(content, filePath, [/^custom-/]);

      expect(result).not.toContain(`:custom-element"`);
    });

    it('should transform non-escaped tags', () => {
      const content = '<div>Hello</div>';
      const result = transformSvelte(content, filePath, ['script', 'style']);

      expect(result).toContain(`:div"`);
    });

    it('should handle empty escape tags array', () => {
      const content = '<div>Hello</div>';
      const result = transformSvelte(content, filePath, []);

      expect(result).toContain(`:div"`);
    });
  });

  describe('skip elements with existing path attribute', () => {
    it('should skip elements that already have data-insp-path attribute', () => {
      const content = `<div ${PathName}="existing/path">Hello</div>`;
      const result = transformSvelte(content, filePath, defaultEscapeTags);

      // Should not add another path attribute
      expect(result.match(new RegExp(PathName, 'g'))?.length).toBe(1);
    });
  });

  describe('script and style blocks', () => {
    it('should handle script blocks', () => {
      const content = `<script>
  let count = 0;
</script>

<div>{count}</div>`;
      const result = transformSvelte(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
      // Script content should be preserved
      expect(result).toContain('let count = 0');
    });

    it('should handle script lang="ts" blocks', () => {
      const content = `<script lang="ts">
  let count: number = 0;
</script>

<div>{count}</div>`;
      const result = transformSvelte(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });

    it('should handle style blocks', () => {
      const content = `<style>
  div { color: red; }
</style>

<div>Hello</div>`;
      const result = transformSvelte(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
      // Style content should be preserved
      expect(result).toContain('color: red');
    });

    it('should handle style lang="scss" blocks', () => {
      const content = `<style lang="scss">
  div { color: red; }
</style>

<div>Hello</div>`;
      const result = transformSvelte(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });

    it('should handle multiple script and style blocks', () => {
      const content = `<script context="module">
  export const prerender = true;
</script>

<script>
  let name = 'world';
</script>

<style>
  p { color: blue; }
</style>

<p>Hello {name}</p>`;
      const result = transformSvelte(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:p"`);
      expect(result).toContain('export const prerender = true');
      expect(result).toContain("let name = 'world'");
      expect(result).toContain('color: blue');
    });
  });

  describe('line and column tracking', () => {
    it('should track correct line and column for single line', () => {
      const content = '<div>Hello</div>';
      const result = transformSvelte(content, filePath, defaultEscapeTags);

      expect(result).toContain(`${filePath}:1:1:div"`);
    });

    it('should track correct line and column for multi-line', () => {
      const content = `<div>
  <span>Hello</span>
</div>`;
      const result = transformSvelte(content, filePath, defaultEscapeTags);

      expect(result).toContain(`${filePath}:1:1:div"`);
      expect(result).toContain(`${filePath}:2:3:span"`);
    });

    it('should track correct position for elements on same line', () => {
      const content = '<div><span>A</span><span>B</span></div>';
      const result = transformSvelte(content, filePath, defaultEscapeTags);

      expect(result).toContain(`${filePath}:1:1:div"`);
      expect(result).toContain(`${filePath}:1:6:span"`);
      expect(result).toContain(`${filePath}:1:20:span"`);
    });

    it('should calculate correct line after script block', () => {
      const content = `<script>
  let count = 0;
</script>

<div>Hello</div>`;
      const result = transformSvelte(content, filePath, defaultEscapeTags);

      // div is on line 5
      expect(result).toContain(`${filePath}:5:1:div"`);
    });
  });

  describe('Svelte-specific syntax', () => {
    it('should handle {#if} blocks', () => {
      const content = `{#if condition}
  <div>True</div>
{:else}
  <span>False</span>
{/if}`;
      const result = transformSvelte(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
      expect(result).toContain(`:span"`);
    });

    it('should handle {#each} blocks', () => {
      const content = `{#each items as item}
  <li>{item}</li>
{/each}`;
      const result = transformSvelte(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:li"`);
    });

    it('should handle {#await} blocks', () => {
      const content = `{#await promise}
  <p>Loading...</p>
{:then value}
  <div>{value}</div>
{:catch error}
  <span>{error}</span>
{/await}`;
      const result = transformSvelte(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:p"`);
      expect(result).toContain(`:div"`);
      expect(result).toContain(`:span"`);
    });

    it('should handle event handlers', () => {
      const content = '<button on:click={handleClick}>Click me</button>';
      const result = transformSvelte(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:button"`);
    });

    it('should handle bindings', () => {
      const content = '<input bind:value={name} />';
      const result = transformSvelte(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:input"`);
    });

    it('should handle transitions', () => {
      const content = '<div transition:fade>Hello</div>';
      const result = transformSvelte(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });

    it('should handle slots', () => {
      const content = '<div><slot></slot></div>';
      const result = transformSvelte(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });
  });

  describe('complex scenarios', () => {
    it('should handle deeply nested elements', () => {
      const content = `<div>
  <section>
    <article>
      <p>
        <span>Deep</span>
      </p>
    </article>
  </section>
</div>`;
      const result = transformSvelte(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
      expect(result).toContain(`:section"`);
      expect(result).toContain(`:article"`);
      expect(result).toContain(`:p"`);
      expect(result).toContain(`:span"`);
    });

    it('should handle component with all sections', () => {
      const content = `<script lang="ts">
  export let name: string = 'World';

  function greet() {
    console.log('Hello ' + name);
  }
</script>

<main>
  <h1>Hello {name}!</h1>
  <button on:click={greet}>Greet</button>
</main>

<style lang="scss">
  main {
    text-align: center;
  }

  h1 {
    color: purple;
  }
</style>`;
      const result = transformSvelte(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:main"`);
      expect(result).toContain(`:h1"`);
      expect(result).toContain(`:button"`);
      // Script and style content preserved
      expect(result).toContain("export let name: string = 'World'");
      expect(result).toContain('text-align: center');
    });

    it('should handle HTML attributes with special characters', () => {
      const content = '<a href="https://example.com?a=1&b=2">Link</a>';
      const result = transformSvelte(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:a"`);
    });

    it('should handle class directive', () => {
      const content = '<div class:active={isActive}>Hello</div>';
      const result = transformSvelte(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });
  });

  describe('edge cases', () => {
    it('should handle empty content', () => {
      const content = '';
      const result = transformSvelte(content, filePath, defaultEscapeTags);

      expect(result).toBe('');
    });

    it('should handle content with only text', () => {
      const content = 'Just some text';
      const result = transformSvelte(content, filePath, defaultEscapeTags);

      expect(result).toBe(content);
    });

    it('should handle content with only whitespace', () => {
      const content = '   \n   \n   ';
      const result = transformSvelte(content, filePath, defaultEscapeTags);

      expect(result).toBe(content);
    });

    it('should preserve original whitespace', () => {
      const content = `<div>
    <span>   spaced   </span>
</div>`;
      const result = transformSvelte(content, filePath, defaultEscapeTags);

      expect(result).toContain('   spaced   ');
    });
  });
});
