// more config: https://d.umijs.org/config
import { defineConfig } from 'dumi';
import path from 'path';

const basePath = process.env.GH_PAGES ? '/motion/' : '/';
const publicPath = basePath;

export default defineConfig({
  alias: {
    'rc-motion$': path.resolve('src'),
    'rc-motion/es': path.resolve('src'),
  },
  favicons: ['https://avatars0.githubusercontent.com/u/9441414?s=200&v=4'],
  themeConfig: {
    name: 'Motion',
    logo: 'https://avatars0.githubusercontent.com/u/9441414?s=200&v=4',
  },
  outputPath: 'docs-dist',
  base: basePath,
  publicPath,
  exportStatic: {},
});
