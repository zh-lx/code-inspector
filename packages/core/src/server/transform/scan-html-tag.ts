const HtmlTags = new Set([
  'a',
  'abbr',
  'address',
  'area',
  'article',
  'aside',
  'audio',
  'b',
  'base',
  'bdi',
  'bdo',
  'blockquote',
  'body',
  'br',
  'button',
  'canvas',
  'caption',
  'cite',
  'code',
  'col',
  'colgroup',
  'data',
  'datalist',
  'dd',
  'del',
  'details',
  'dfn',
  'dialog',
  'div',
  'dl',
  'dt',
  'em',
  'embed',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'head',
  'header',
  'hgroup',
  'hr',
  'html',
  'i',
  'iframe',
  'img',
  'input',
  'ins',
  'kbd',
  'label',
  'legend',
  'li',
  'link',
  'main',
  'map',
  'mark',
  'menu',
  'meta',
  'meter',
  'nav',
  'noscript',
  'object',
  'ol',
  'optgroup',
  'option',
  'output',
  'p',
  'picture',
  'pre',
  'progress',
  'q',
  'rp',
  'rt',
  'ruby',
  's',
  'samp',
  'search',
  'section',
  'select',
  'slot',
  'small',
  'source',
  'span',
  'strong',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'template',
  'textarea',
  'tfoot',
  'th',
  'thead',
  'time',
  'title',
  'tr',
  'track',
  'u',
  'ul',
  'var',
  'video',
  'wbr',
]);

const SvgContainerTags = new Set([
  'svg',
]);

const SvgChildTags = new Set([
  'animate',
  'animatemotion',
  'animatetransform',
  'circle',
  'clippath',
  'defs',
  'desc',
  'ellipse',
  'feblend',
  'fecolormatrix',
  'fecomponenttransfer',
  'fecomposite',
  'feconvolvematrix',
  'fediffuselighting',
  'fedisplacementmap',
  'fedistantlight',
  'fedropshadow',
  'feflood',
  'fefunca',
  'fefuncb',
  'fefuncg',
  'fefuncr',
  'fegaussianblur',
  'feimage',
  'femerge',
  'femergenode',
  'femorphology',
  'feoffset',
  'fepointlight',
  'fespecularlighting',
  'fespotlight',
  'fetile',
  'feturbulence',
  'filter',
  'foreignobject',
  'g',
  'image',
  'line',
  'lineargradient',
  'marker',
  'mask',
  'metadata',
  'mpath',
  'path',
  'pattern',
  'polygon',
  'polyline',
  'radialgradient',
  'rect',
  'set',
  'stop',
  'switch',
  'symbol',
  'text',
  'textpath',
  'tspan',
  'use',
  'view',
]);

const VoidTags = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

const RawTextTags = new Set([
  'script',
  'style',
]);

export function isScannableDomTag(name: string) {
  const lowerName = name.toLowerCase();
  return (
    HtmlTags.has(lowerName) ||
    SvgContainerTags.has(lowerName) ||
    isComponentTagName(name) ||
    isCustomElementTagName(name)
  );
}

export function shouldSkipScannedTagChildren(name: string) {
  const lowerName = name.toLowerCase();
  return RawTextTags.has(lowerName) || SvgContainerTags.has(lowerName);
}

export function isNonInjectableScannedTag(name: string) {
  const lowerName = name.toLowerCase();
  return RawTextTags.has(lowerName) || SvgChildTags.has(lowerName);
}

export function isLikelyTypeScriptGeneric(
  content: string,
  tagStart: number,
) {
  const prev = getPreviousNonWhitespaceChar(content, tagStart);
  return Boolean(prev && /[\w\])]/.test(prev));
}

export function isWellFormedScannedTag(
  content: string,
  insertPosition: number,
  name: string,
) {
  const lowerName = name.toLowerCase();
  return (
    content[insertPosition] === '/' ||
    content[insertPosition - 1] === '/' ||
    VoidTags.has(lowerName) ||
    content.toLowerCase().indexOf(`</${lowerName}`, insertPosition) !== -1
  );
}

function getPreviousNonWhitespaceChar(content: string, offset: number) {
  for (let i = offset - 1; i >= 0; i--) {
    if (content[i] === '\n' || content[i] === '\r') {
      return '';
    }

    if (!/\s/.test(content[i])) {
      return content[i];
    }
  }

  return '';
}

function isComponentTagName(name: string) {
  return /^[A-Z]/.test(name);
}

function isCustomElementTagName(name: string) {
  return name.includes('-');
}
