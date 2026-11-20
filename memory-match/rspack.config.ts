import { defineConfig } from '@meteorjs/rspack';
import { DefinePlugin } from '@rspack/core';

export default defineConfig(() => ({
  plugins: [
    new DefinePlugin({
      'import.meta.rstest': 'false',
    }),
  ],
}));
