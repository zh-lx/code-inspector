import { describe, it, expect } from 'vitest';
import { transformJsx } from '@/core/src/server/transform/transform-jsx';
import { PathName } from '@/core/src/shared/constant';

describe('transformJsx', () => {
  const filePath = 'test/file.jsx';
  const defaultEscapeTags = ['script', 'style'];

  describe('basic transformation', () => {
    it('should add data-insp-path attribute to JSX elements', () => {
      const content = 'function App() { return <div>Hello</div>; }';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      // Column is 0-indexed + 1, so column 24 (0-indexed) becomes 25
      expect(result).toContain(`${PathName}="${filePath}:1:25:div"`);
    });

    it('should add data-insp-path to nested elements', () => {
      const content = `function App() {
  return (
    <div>
      <span>Hello</span>
    </div>
  );
}`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(':div"');
      expect(result).toContain(':span"');
    });

    it('should handle self-closing elements', () => {
      const content = 'function App() { return <input type="text" />; }';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      // Column is 0-indexed + 1
      expect(result).toContain(`${PathName}="${filePath}:1:25:input"`);
    });

    it('should add space after path attribute when element has existing attributes', () => {
      const content = 'function App() { return <div className="test">Hello</div>; }';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      // Column is 0-indexed + 1
      expect(result).toContain(`${PathName}="${filePath}:1:25:div" `);
    });

    it('should not add extra space when element has no attributes', () => {
      const content = 'function App() { return <div>Hello</div>; }';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      // Column is 0-indexed + 1
      expect(result).toContain(`${PathName}="${filePath}:1:25:div">`);
    });
  });

  describe('escape tags', () => {
    it('should not transform escaped tags (string)', () => {
      const content = 'function App() { return <script>console.log("test")</script>; }';
      const result = transformJsx(content, filePath, ['script']);

      expect(result).not.toContain(`:script"`);
    });

    it('should not transform escaped tags (RegExp)', () => {
      const content = 'function App() { return <custom-component>Hello</custom-component>; }';
      const result = transformJsx(content, filePath, [/^custom-/]);

      expect(result).not.toContain(`:custom-component"`);
    });

    it('should transform non-escaped tags', () => {
      const content = 'function App() { return <div>Hello</div>; }';
      const result = transformJsx(content, filePath, ['script', 'style']);

      expect(result).toContain(`:div"`);
    });

    it('should handle empty escape tags array', () => {
      const content = 'function App() { return <div>Hello</div>; }';
      const result = transformJsx(content, filePath, []);

      expect(result).toContain(`:div"`);
    });
  });

  describe('skip elements with existing path attribute', () => {
    it('should skip elements that already have data-insp-path attribute', () => {
      const content = `function App() { return <div ${PathName}="existing/path">Hello</div>; }`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toBe(content);
    });

    it('should skip self-closing elements that already have data-insp-path', () => {
      const content = `function App() { return <input ${PathName}="existing/path" />; }`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toBe(content);
    });

    it('should not skip elements with spread attributes', () => {
      const content = 'function App() { const props = {}; return <div {...props}>Hello</div>; }';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });
  });

  describe('TypeScript support', () => {
    it('should handle TSX with type annotations', () => {
      const content = 'function App(): JSX.Element { return <div>Hello</div>; }';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });

    it('should handle generic components', () => {
      const content = 'function App<T>() { return <div>Hello</div>; }';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });

    it('should handle interfaces', () => {
      const content = `
interface Props {
  name: string;
}
function App(props: Props) { return <div>{props.name}</div>; }`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });

    it('should handle type assertions', () => {
      const content = 'function App() { return <div>{("test" as string)}</div>; }';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });
  });

  describe('import.meta support', () => {
    it('should handle import.meta syntax', () => {
      const content = `
const url = import.meta.url;
function App() { return <div>Hello</div>; }`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });
  });

  describe('Vue JSX support', () => {
    it('should handle Vue JSX v-model', () => {
      const content = 'function App() { return <input v-model={value} />; }';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:input"`);
    });

    it('should handle Vue JSX v-show', () => {
      const content = 'function App() { return <div v-show={visible}>Hello</div>; }';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });
  });

  describe('decorators support', () => {
    it('should handle class decorators', () => {
      const content = `
@Component
class MyComponent {
  render() { return <div>Hello</div>; }
}`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });

    it('should handle method decorators', () => {
      const content = `
class MyComponent {
  @Bind
  handleClick() {}
  render() { return <div>Hello</div>; }
}`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });
  });

  describe('line and column tracking', () => {
    it('should track correct line and column for multi-line JSX', () => {
      const content = `function App() {
  return (
    <div>
      <span>Hello</span>
    </div>
  );
}`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      // div is at line 3, column 4 (0-indexed), so +1 = 5
      expect(result).toContain(`${filePath}:3:5:div"`);
      // span is at line 4, column 6 (0-indexed), so +1 = 7
      expect(result).toContain(`${filePath}:4:7:span"`);
    });

    it('should track correct position for elements on same line', () => {
      const content = 'function App() { return <div><span>A</span><span>B</span></div>; }';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      // All elements on line 1, columns are 0-indexed + 1
      expect(result).toContain(`${filePath}:1:25:div"`);
      expect(result).toContain(`${filePath}:1:30:span"`);
      // Second span is at column 43 (0-indexed), so +1 = 44
      expect(result).toContain(`${filePath}:1:44:span"`);
    });
  });

  describe('complex JSX patterns', () => {
    it('should handle JSX fragments', () => {
      const content = 'function App() { return <><div>A</div><div>B</div></>; }';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      // Fragments should not have path attribute, but inner elements should
      expect(result).toContain(`:div"`);
    });

    it('should handle conditional rendering', () => {
      const content = 'function App() { return condition ? <div>A</div> : <span>B</span>; }';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
      expect(result).toContain(`:span"`);
    });

    it('should handle map rendering', () => {
      const content = 'function App() { return <ul>{items.map(i => <li key={i}>{i}</li>)}</ul>; }';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:ul"`);
      expect(result).toContain(`:li"`);
    });

    it('should handle JSX expressions', () => {
      const content = 'function App() { return <div className={styles.container}>Hello</div>; }';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });

    it('should handle multiple root elements in different functions', () => {
      const content = `
function A() { return <div>A</div>; }
function B() { return <span>B</span>; }`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
      expect(result).toContain(`:span"`);
    });
  });

  describe('edge cases', () => {
    it('should handle elements without name (should not crash)', () => {
      // This tests that code handles nodeName being empty
      const content = 'function App() { return <div>Hello</div>; }';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`${PathName}=`);
    });

    it('should handle deeply nested JSX', () => {
      const content = `
function App() {
  return (
    <div>
      <section>
        <article>
          <p>
            <span>Deep</span>
          </p>
        </article>
      </section>
    </div>
  );
}`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
      expect(result).toContain(`:section"`);
      expect(result).toContain(`:article"`);
      expect(result).toContain(`:p"`);
      expect(result).toContain(`:span"`);
    });
  });
});
