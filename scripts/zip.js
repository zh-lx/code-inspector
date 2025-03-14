const path = require('path');
const { zip } = require('zip-a-folder');
const { moveSync, removeSync } = require('fs-extra');

async function main() {
  removeSync(path.resolve(__dirname, '../zip'));
  moveSync(path.resolve(__dirname, '../docs/zh/.vitepress/dist'), path.resolve(__dirname, '../zip/cn'));
  moveSync(path.resolve(__dirname, '../docs/en/.vitepress/dist'), path.resolve(__dirname, '../zip/en'));
  await zip(path.resolve(__dirname, '../zip'), path.resolve(__dirname, '../dist.zip'));
  removeSync(path.resolve(__dirname, '../zip'));
}

main();