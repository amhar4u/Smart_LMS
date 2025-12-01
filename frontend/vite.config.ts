import { defineConfig } from 'vite';

export default defineConfig({
  assetsInclude: ['**/*.shard1', '**/*.bin'],
  server: {
    fs: {
      strict: false
    }
  },
  optimizeDeps: {
    include: ['face-api.js']
  }
});
