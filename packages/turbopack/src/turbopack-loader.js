const {
  normalizePath,
  getCodeWithWebComponent,
  isExcludedFile,
  transformCode,
  isJsTypeFile,
} = require('@code-inspector/core');

module.exports = async function turbopackLoader(content) {
  this.cacheable && this.cacheable(true);
  const filePath = normalizePath(this.resourcePath);
  const options = this.query;

  if (isExcludedFile(filePath, options)) {
    return content;
  }

  // start server and inject client code to entry file
  content = await getCodeWithWebComponent({
    options,
    file: filePath,
    code: content,
    record: options.record,
  });

  // Transform JSX/TSX files to add data-inspector attributes
  if (isJsTypeFile(filePath)) {
    content = transformCode({
      content,
      filePath,
      fileType: 'jsx',
      escapeTags: options.escapeTags || [],
      pathType: options.pathType,
    });
  }

  return content;
};