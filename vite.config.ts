import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // 精准注入环境变量，避免整体替换 process.env 导致的 ({}) 错误
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
    'process.env.NODE_ENV': JSON.stringify('production'),
    'global': 'globalThis'
  },
  build: {
    outDir: 'dist',
    target: 'esnext',
    emptyOutDir: true
  },
  server: {
    port: 3000
  }
});
