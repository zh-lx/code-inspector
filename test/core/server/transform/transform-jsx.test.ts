import { describe, it, expect } from 'vitest';
import {
  __TEST__,
  getCallExpressionName,
  getExpressionName,
  getJsxNodeName,
  injectCreateElementPath,
  transformJsx,
} from '@/core/src/server/transform/transform-jsx';
import { PathName } from '@/core/src/shared/constant';

describe('transformJsx', () => {
  const filePath = 'test/file.jsx';
  const defaultEscapeTags = ['script', 'style'];

  describe('basic transformation', () => {
    it('should add data-insp-path attribute to JSX elements', () => {
      const content = 'function App() { return <div>Hello</div>; }';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      // Component root elements get dynamic path injection with prop propagation
      expect(result).toContain(`|| "${filePath}:1:25:div"`);
      expect(result).toContain(`${PathName}={`);
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

      // Component root elements get dynamic path injection
      expect(result).toContain(`|| "${filePath}:1:25:input"`);
    });

    it('should handle self-closing elements in non-component code with static injection', () => {
      const content = 'const el = <input />;';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`${PathName}="${filePath}:1:12:input"`);
    });

    it('should add space after path attribute when element has existing attributes', () => {
      const content = 'function App() { return <div className="test">Hello</div>; }';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      // Root element gets dynamic path with trailing space for existing attributes
      expect(result).toContain(`|| "${filePath}:1:25:div"}`);
      expect(result).toContain(`${PathName}={`);
    });

    it('should not add extra space when element has no attributes', () => {
      const content = 'function App() { return <div>Hello</div>; }';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      // Root element gets dynamic path, closes directly into >
      expect(result).toContain(`|| "${filePath}:1:25:div"}`);
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

      // Existing path attribute should be preserved (not overwritten with a new path)
      expect(result).toContain(`${PathName}="existing/path"`);
      // No dynamic path injection since attribute already exists
      expect(result).not.toContain(`|| "existing/path"`);
    });

    it('should skip self-closing elements that already have data-insp-path', () => {
      const content = `function App() { return <input ${PathName}="existing/path" />; }`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      // Existing path attribute should be preserved
      expect(result).toContain(`${PathName}="existing/path"`);
      expect(result).not.toContain(`|| "existing/path"`);
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

    it('should not propagate a single component path to multiple fragment roots', () => {
      const content = 'function App(props) { return <><div>A</div><h1>B</h1></>; }';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`${PathName}="${filePath}:1:32:div"`);
      expect(result).toContain(`${PathName}="${filePath}:1:44:h1"`);
      expect(result).not.toContain('props && props[');
      expect(result).not.toContain(`|| "${filePath}:1:32:div"`);
      expect(result).not.toContain(`|| "${filePath}:1:44:h1"`);
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

  describe('function expressions and arrow functions', () => {
    it('should handle function expressions assigned to variables', () => {
      const content = 'const App = function() { return <div>Hello</div>; };';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });

    it('should handle arrow function components', () => {
      const content = 'const App = () => <div>Hello</div>;';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });

    it('should handle arrow function with block body', () => {
      const content = 'const App = () => { return <div>Hello</div>; };';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });
  });

  describe('class components', () => {
    it('should handle class component with extends and render method', () => {
      const content = `
class MyApp extends React.Component {
  render() {
    return <div>Hello</div>;
  }
}`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
      // Class components use this.props for path propagation
      expect(result).toContain('this.props');
    });

    it('should handle class expression assigned to variable', () => {
      const content = `
const MyApp = class extends React.Component {
  render() {
    return <div>Hello</div>;
  }
};`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });

    it('should not transform class without superClass', () => {
      const content = `
class NotAComponent {
  render() {
    return <div>Hello</div>;
  }
}`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      // Still transforms JSX elements via the general enter handler
      expect(result).toContain(`:div"`);
    });

    it('should not transform class without render method', () => {
      const content = `
class MyApp extends React.Component {
  doSomething() {
    return <div>Hello</div>;
  }
}`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      // Not a valid component class (no render), but JSX in enter handler still works
      expect(result).toContain(`:div"`);
    });

    it('should handle class with inner function in render', () => {
      const content = `
class MyApp extends React.Component {
  render() {
    const helper = () => <span>inner</span>;
    return <div>Hello</div>;
  }
}`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
      expect(result).toContain(`:span"`);
    });

    it('should handle class with inner class in render', () => {
      const content = `
class MyApp extends React.Component {
  render() {
    class Inner {}
    return <div>Hello</div>;
  }
}`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });

    it('should not propagate a single component path to multiple class render roots', () => {
      const content = `
class MyApp extends React.Component {
  render() {
    return <><div>A</div><h1>B</h1></>;
  }
}`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`${PathName}="${filePath}:4:14:div"`);
      expect(result).toContain(`${PathName}="${filePath}:4:26:h1"`);
      expect(result).not.toContain('this.props');
      expect(result).not.toContain(`|| "${filePath}:4:14:div"`);
      expect(result).not.toContain(`|| "${filePath}:4:26:h1"`);
    });
  });

  describe('component owner name detection', () => {
    it('should detect assignment expression component name', () => {
      const content = `
let MyComponent;
MyComponent = function() { return <div>Hello</div>; };`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });

    it('should not treat lowercase function as component', () => {
      const content = 'function helper() { return <div>Hello</div>; }';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      // lowercase function is not treated as a component, but JSX still gets static path via enter handler
      expect(result).toContain(`:div"`);
      // Should NOT have dynamic path propagation (no __codeInspectorProps)
      expect(result).not.toContain('__codeInspectorProps');
    });
  });

  describe('parameter path expression handling', () => {
    it('should handle component with named props parameter', () => {
      const content = 'function App(props) { return <div>Hello</div>; }';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      // Should use existing props parameter for path propagation
      expect(result).toContain('props &&');
      expect(result).toContain(`:div"`);
    });

    it('should handle destructured props parameter', () => {
      const content = 'function App({ name }) { return <div>{name}</div>; }';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
      // Should inject path binding into destructured pattern
      expect(result).toContain('__codeInspectorPath');
    });

    it('should handle destructured props with default values', () => {
      const content = 'function App({ name = "default" }) { return <div>{name}</div>; }';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });

    it('should handle destructured props that already have PathName', () => {
      const content = `function App({ ["${PathName}"]: inspPath }) { return <div>Hello</div>; }`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
      // Should use existing binding
      expect(result).toContain('inspPath');
    });

    it('should handle destructured props with PathName and default value', () => {
      const content = `function App({ "${PathName}": inspPath = "" }) { return <div>Hello</div>; }`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });

    it('should handle props with AssignmentPattern', () => {
      const content = 'function App(props = {}) { return <div>Hello</div>; }';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
      expect(result).toContain('props &&');
    });
  });

  describe('createElement calls', () => {
    it('should handle React.createElement calls', () => {
      const content = `function App() { return React.createElement("div", null, "Hello"); }`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(PathName);
    });

    it('should handle createElement with object props', () => {
      const content = `function App() { return React.createElement("div", { className: "test" }, "Hello"); }`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(PathName);
    });

    it('should handle createElement with empty object props', () => {
      const content = `function helper() { return React.createElement("div", {}, "Hello"); }`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`{"${PathName}": "${filePath}:1:28:div"}`);
    });

    it('should handle createElement with variable props', () => {
      const content = `function App() { const p = {}; return React.createElement("div", p, "Hello"); }`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(PathName);
    });

    it('should handle createElement with no props argument', () => {
      const content = `function App() { return React.createElement("span"); }`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(PathName);
    });

    it('should skip createElement with existing path property', () => {
      const content = `function App() { return React.createElement("div", { "${PathName}": "existing" }, "Hello"); }`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain('"existing"');
    });

    it('should skip createElement for escaped tags', () => {
      const content = `function App() { return React.createElement("script", null, "code"); }`;
      const result = transformJsx(content, filePath, ['script']);

      // script is escaped, so no path injection
      expect(result).not.toContain(`:script"`);
    });
  });

  describe('collectRootTargets - conditional and logical expressions', () => {
    it('should handle ternary expression as root return', () => {
      const content = 'const App = () => condition ? <div>A</div> : <span>B</span>;';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
      expect(result).toContain(`:span"`);
    });

    it('should handle logical AND expression', () => {
      const content = 'const App = () => show && <div>Hello</div>;';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });

    it('should handle logical OR expression', () => {
      const content = 'const App = () => fallback || <div>Hello</div>;';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });

    it('should handle sequence expression (comma operator)', () => {
      const content = 'const App = () => (sideEffect(), <div>Hello</div>);';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });

    it('should handle array expression return', () => {
      const content = 'const App = () => [<div key="1">A</div>, <span key="2">B</span>];';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
      expect(result).toContain(`:span"`);
    });

    it('should handle array with spread elements', () => {
      const content = `const App = () => { const items = []; return [...items, <div>A</div>]; };`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });

    it('should handle nested fragments with expression containers', () => {
      const content = `const App = () => <><div>A</div>{condition && <span>B</span>}</>;`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
      expect(result).toContain(`:span"`);
    });

    it('should handle nested fragments within fragments', () => {
      const content = `const App = () => <><><div>A</div></></>;`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });
  });

  describe('identifier root targets and variable tracking', () => {
    it('should handle uppercase component returning undefined identifier', () => {
      const content = `function App() { return undefined; }`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain('__codeInspectorProps');
      expect(result).not.toContain(PathName);
    });

    it('should track JSX assigned to variable and returned', () => {
      const content = `function App() {
  const el = <div>Hello</div>;
  return el;
}`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });

    it('should track variable assigned later and returned', () => {
      const content = `function App() {
  let el;
  el = <div>Hello</div>;
  return el;
}`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });

    it('should handle undefined identifier', () => {
      const content = `function helper() { return undefined; }`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      // lowercase function, no JSX, should be unchanged
      expect(result).toBe(content);
    });

    it('should stop tracking cyclic identifier bindings', () => {
      const content = `function App() {
  const first = second;
  const second = first;
  return first;
}`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain('__codeInspectorProps');
      expect(result).not.toContain(PathName);
    });
  });

  describe('createPortal support', () => {
    it('should handle ReactDOM.createPortal', () => {
      const content = `function App() { return ReactDOM.createPortal(<div>Portal</div>, document.body); }`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });
  });

  describe('JSX member expressions and namespaced names', () => {
    it('should handle member expression tag names', () => {
      const content = 'function App() { return <Foo.Bar>Hello</Foo.Bar>; }';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(':Foo.Bar"');
    });

    it('should handle namespaced names', () => {
      const content = 'function App() { return <xml:svg>Hello</xml:svg>; }';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(':xml:svg"');
    });

    it('should escape member expression tag with dot notation', () => {
      const content = 'function App() { return <UI.Button>Click</UI.Button>; }';
      const result = transformJsx(content, filePath, ['Button']);

      // "Button" is the last segment, should be escaped
      expect(result).not.toContain(':UI.Button"');
    });
  });

  describe('export default anonymous components', () => {
    it('should handle export default function expression', () => {
      const content = 'export default function() { return <div>Hello</div>; }';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });

    it('should handle export default arrow function', () => {
      const content = 'export default () => <div>Hello</div>;';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });
  });

  describe('non-component code', () => {
    it('should not crash on code without JSX', () => {
      const content = 'const x = 1 + 2;';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toBe(content);
    });

    it('should handle empty function body', () => {
      const content = 'function helper() {}';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      // lowercase function is not a component, should be unchanged
      expect(result).toBe(content);
    });
  });

  describe('getCallExpressionName and getExpressionName', () => {
    it('should ignore malformed createElement call without type end position', () => {
      const s = {
        appendLeft: () => {
          throw new Error('appendLeft should not be called');
        },
      } as any;

      expect(() =>
        injectCreateElementPath(
          {
            arguments: [{}],
          },
          s,
          '',
          '"path"',
        ),
      ).not.toThrow();
    });

    it('should ignore createElement calls without a type argument', () => {
      const content = `function App() { return React.createElement(); }`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain('__codeInspectorProps');
      expect(result).not.toContain(PathName);
    });

    it('should handle createElement called as plain function', () => {
      const content = `function App() { return createElement("div", null, "Hello"); }`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(PathName);
    });

    it('should handle nested member expression in createElement', () => {
      const content = `function App() { return React.DOM.createElement("div", null, "Hello"); }`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      // The callee is a nested member expression — getCallExpressionName reads property.name
      expect(result).toContain(PathName);
    });

    it('should handle createElement with MemberExpression tag', () => {
      const content = `function App() { return React.createElement(Components.Div, null, "Hello"); }`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(PathName);
    });

    it('should handle createElement with StringLiteral tag', () => {
      const content = `function App() { return React.createElement("section", null, "Hello"); }`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:section"`);
    });

    it('should skip createElement with unsupported literal tag type', () => {
      const content = `function App() { return React.createElement(123, null, "Hello"); }`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain('__codeInspectorProps');
      expect(result).not.toContain(PathName);
    });

    it('should return empty call expression name for missing callee', () => {
      expect(getCallExpressionName(undefined)).toBe('');
    });

    it('should return empty JSX node name for unsupported node types', () => {
      expect(getJsxNodeName({ type: 'JSXSpreadChild' })).toBe('');
    });

    it('should return empty expression name for missing and unsupported expressions', () => {
      expect(getExpressionName(undefined)).toBe('');
      expect(getExpressionName({ type: 'NumericLiteral', value: 1 })).toBe('');
    });
  });

  describe('unwrapRenderableExpression', () => {
    it('should handle parenthesized expression', () => {
      const content = 'function App() { return (<div>Hello</div>); }';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });

    it('should handle TS as expression', () => {
      const content = 'function App() { return <div>Hello</div> as any; }';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });

    it('should handle TS non-null assertion', () => {
      const content = `function App() {
  const el = <div>Hello</div>;
  return el!;
}`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });
  });

  describe('containsRenderableReturn', () => {
    it('should detect component in export default with arrow body', () => {
      const content = 'export default () => <div>Hello</div>;';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });

    it('should not detect non-renderable export default', () => {
      const content = 'export default () => 42;';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toBe(content);
    });

    it('should detect component export default with block body return', () => {
      const content = `export default function() { return <div>Hello</div>; }`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });
  });

  describe('hasExportDefaultAncestor boundary', () => {
    it('should not treat function inside class as export default', () => {
      const content = `
class Wrapper {
  method() {
    const fn = function() { return <div>Hello</div>; };
    return fn;
  }
}
export default Wrapper;`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      // fn is inside a class method, not a direct export default
      expect(result).toContain(`:div"`);
    });

    it('should not treat nested function as export default component', () => {
      const content = `
function outer() {
  return function() { return <div>Hello</div>; };
}`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });
  });

  describe('getEmptyParamsInsertPosition edge cases', () => {
    it('should handle arrow function without parens', () => {
      // Arrow functions like `x => <div/>` have params so this doesn't apply
      // But `() => <div/>` does - testing the position detection
      const content = 'const App = () => <div>Hello</div>;';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });
  });

  describe('export default class component', () => {
    it('should handle export default class with render returning JSX', () => {
      const content = `
export default class extends React.Component {
  render() {
    return <div>Hello</div>;
  }
}`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
      expect(result).toContain('this.props');
    });
  });

  describe('containsRenderableReturn internals', () => {
    it('should skip inner functions and classes in containsRenderableReturn', () => {
      // export default with block body containing inner function and class
      const content = `
export default function() {
  class Inner {}
  const helper = function() { return <span>inner</span>; };
  return <div>Hello</div>;
}`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });

    it('should handle containsMethodRenderableReturn with inner function and class', () => {
      // Class component where render has inner functions/classes
      const content = `
export default class extends React.Component {
  render() {
    class InnerClass {}
    const helper = function() { return <span>nested</span>; };
    return <div>Hello</div>;
  }
}`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });
  });

  describe('createElement in component root', () => {
    it('should inject dynamic path for component root createElement', () => {
      const content = `function App() { return React.createElement("div", null, "Hello"); }`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      // Root createElement in component gets dynamic path propagation
      expect(result).toContain(PathName);
    });

    it('should handle non-component createElement (static injection)', () => {
      const content = `function helper() { return React.createElement("div", null, "Hello"); }`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      // Static createElement injection for non-component
      expect(result).toContain(PathName);
    });

    it('should handle createElement with variable prop as root return', () => {
      const content = `function App() { const p = { className: "test" }; return React.createElement("div", p, "Hello"); }`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      // Variable props gets Object.assign wrapper
      expect(result).toContain('Object.assign');
    });

    it('should handle createElement with no args beyond type', () => {
      const content = `function helper() { return React.createElement("br"); }`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(PathName);
    });
  });

  describe('edge cases for identifier tracking', () => {
    it('should handle circular variable references', () => {
      // Variable referencing itself should not infinite loop
      const content = `function App() {
  let el = <div>Initial</div>;
  el = el;
  return el;
}`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });

    it('should handle multiple assignments to same variable', () => {
      // getSingleBindingAssignment returns null when there are multiple assignments
      const content = `function App() {
  let el;
  el = <div>A</div>;
  el = <span>B</span>;
  return el;
}`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      // Multiple assignments means getSingleBindingAssignment returns null
      // but the static enter handler still catches the JSX
      expect(result).toContain(`:div"`);
      expect(result).toContain(`:span"`);
    });

    it('should handle variable without init and no assignments', () => {
      const content = `function App() {
  let el;
  return el;
}`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      // el is uninitialized, no assignments - returns empty targets
      expect(result).toContain('__codeInspectorProps');
    });

    it('should handle non-VariableDeclarator binding', () => {
      // Function parameter binding is not a VariableDeclarator - returns empty
      const content = `function App(el) {
  return el;
}`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      // el is a function param, not a VariableDeclarator - no root target found
      // so no dynamic path injection on the return value
      expect(result).toBeDefined();
    });
  });

  describe('array with sparse elements', () => {
    it('should handle array with holes (sparse array)', () => {
      const content = `const App = () => [<div key="1">A</div>, , <span key="2">B</span>];`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
      expect(result).toContain(`:span"`);
    });
  });

  describe('fragment with text and non-JSX children', () => {
    it('should handle fragment with text children', () => {
      const content = `const App = () => <>Hello<div>World</div>text</>;`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });
  });

  describe('createPortal as root of component', () => {
    it('should follow createPortal first argument for root injection', () => {
      const content = `function App() { return ReactDOM.createPortal(<div>Portal</div>, container); }`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
    });
  });

  describe('computed member expression in callee', () => {
    it('should handle computed member expression callee', () => {
      // computed member expression - getCallExpressionName returns ''
      const content = `function helper() { return React["createElement"]("div", null, "Hello"); }`;
      const result = transformJsx(content, filePath, defaultEscapeTags);

      // computed member expressions are not recognized as createElement calls
      expect(result).toBeDefined();
    });
  });

  describe('empty destructured props', () => {
    it('should handle empty destructured props object', () => {
      const content = 'function App({}) { return <div>Hello</div>; }';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      expect(result).toContain(`:div"`);
      expect(result).toContain('__codeInspectorPath');
    });
  });

  describe('rest parameter', () => {
    it('should handle rest parameter as first param', () => {
      const content = 'function App(...args) { return <div>Hello</div>; }';
      const result = transformJsx(content, filePath, defaultEscapeTags);

      // RestElement is not Identifier/ObjectPattern/AssignmentPattern - returns ''
      // This means getPropagatedPathExpression returns '' and no dynamic injection happens
      expect(result).toContain(`:div"`);
    });
  });

  describe('internal helper fallbacks', () => {
    it('should return false when no export default ancestor exists', () => {
      expect(
        __TEST__.hasExportDefaultAncestor({
          parentPath: {
            isExportDefaultDeclaration: () => false,
            isClass: () => false,
            isFunction: () => false,
            isObjectMethod: () => false,
            parentPath: null,
          },
        }),
      ).toBe(false);
    });

    it('should return empty propagated expression when implicit props insertion is unavailable', () => {
      expect(
        __TEST__.getPropagatedPathExpression(
          {
            node: {
              params: [],
              body: {},
            },
          },
          {
            prependLeft: () => {
              throw new Error('prependLeft should not be called');
            },
          },
          'function App() { return <div />; }',
        ),
      ).toBe('');
    });

    it('should return empty string for missing or unsupported object property names', () => {
      expect(__TEST__.getObjectPropertyName(null)).toBe('');
      expect(__TEST__.getObjectPropertyName({ type: 'NumericLiteral', value: 1 })).toBe('');
    });

    it('should return empty string when object pattern properties are missing', () => {
      expect(__TEST__.getObjectPatternPathBinding({})).toBe('');
    });

    it('should return null when empty params insertion position cannot be resolved', () => {
      expect(
        __TEST__.getEmptyParamsInsertPosition(
          {
            body: {},
          },
          'function App() { return <div />; }',
        ),
      ).toBeNull();

      expect(
        __TEST__.getEmptyParamsInsertPosition(
          {
            start: 0,
            body: {
              start: 15,
            },
          },
          'function App => ',
        ),
      ).toBeNull();
    });

    it('should return an empty root target list for null nodes', () => {
      expect(__TEST__.collectRootTargets(null, null)).toEqual([]);
    });

    it('should ignore sparse array holes when collecting root targets', () => {
      expect(
        __TEST__.collectRootTargets(
          {
            type: 'ArrayExpression',
            elements: [null],
          },
          null,
        ),
      ).toEqual([]);
    });

    it('should collect fragment expression container root targets', () => {
      expect(
        __TEST__.collectRootTargets(
          {
            type: 'JSXFragment',
            children: [
              {
                type: 'JSXExpressionContainer',
                expression: {
                  type: 'JSXElement',
                },
              },
            ],
          },
          null,
        ),
      ).toEqual([
        {
          type: 'jsx',
          node: {
            type: 'JSXElement',
          },
        },
      ]);
    });

    it('should tolerate bindings without identifier metadata or constant violations', () => {
      expect(
        __TEST__.collectRootTargets(
          {
            type: 'Identifier',
            name: 'el',
          },
          {
            getBinding: () => ({
              identifier: {},
              path: {
                node: {
                  type: 'VariableDeclarator',
                },
                scope: null,
              },
            }),
          },
        ),
      ).toEqual([]);
    });

    it('should estimate zero roots when identifier bindings have missing metadata', () => {
      expect(
        __TEST__.estimateRootCount(
          {
            type: 'Identifier',
            name: 'el',
          },
          {
            getBinding: () => ({
              identifier: {},
              path: {
                node: {
                  type: 'VariableDeclarator',
                },
                scope: null,
              },
            }),
          },
          new Set(),
        ),
      ).toBe(0);
    });

    it('should return zero root count for null, unsupported calls, and unsupported nodes', () => {
      expect(__TEST__.estimateRootCount(null, null, new Set())).toBe(0);
      expect(
        __TEST__.estimateRootCount(
          {
            type: 'CallExpression',
            callee: {
              type: 'Identifier',
              name: 'helper',
            },
          },
          null,
          new Set(),
        ),
      ).toBe(0);
      expect(
        __TEST__.estimateRootCount(
          {
            type: 'NumericLiteral',
            value: 1,
          },
          null,
          new Set(),
        ),
      ).toBe(0);
    });

    it('should handle empty arrays and fragments when estimating root count', () => {
      expect(
        __TEST__.estimateRootCount(
          {
            type: 'ArrayExpression',
          },
          null,
          new Set(),
        ),
      ).toBe(0);
      expect(
        __TEST__.estimateRootCount(
          {
            type: 'JSXFragment',
          },
          null,
          new Set(),
        ),
      ).toBe(0);
    });

    it('should stop propagating path for multi-root arrays and fragments', () => {
      expect(
        __TEST__.shouldPropagatePathToExpression(
          {
            type: 'ArrayExpression',
            elements: [
              null,
              {
                type: 'SpreadElement',
                argument: {
                  type: 'ArrayExpression',
                  elements: [
                    {
                      type: 'JSXElement',
                    },
                    {
                      type: 'JSXElement',
                    },
                  ],
                },
              },
            ],
          },
          null,
        ),
      ).toBe(false);

      expect(
        __TEST__.shouldPropagatePathToExpression(
          {
            type: 'JSXFragment',
            children: [
              {
                type: 'JSXElement',
              },
              {
                type: 'JSXExpressionContainer',
                expression: {
                  type: 'JSXElement',
                },
              },
            ],
          },
          null,
        ),
      ).toBe(false);
    });

    it('should fall back to the original node name when escaped tag suffix is empty', () => {
      expect(__TEST__.isEscapedJsxTag(['bar'], 'Foo.')).toBe(false);
    });
  });
});
