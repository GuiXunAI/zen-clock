import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // 必须使用 JSON.stringify 以确保它被编译为 JS 对象字面量 {}
    'process.env': JSON.stringify({}),
    'global': 'window'
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
