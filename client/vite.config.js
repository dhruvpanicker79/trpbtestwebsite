import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_DEV_API_TARGET || 'http://localhost:5000';
  const proxy = { target, changeOrigin: false };

  return {
    plugins: [react()],
    server: {
      port: 5173,
      // Same-origin proxy in development so auth cookies are first-party.
      proxy: {
        '/api': proxy,
        '/uploads': proxy,
        '/sitemap.xml': proxy,
        '/robots.txt': proxy,
      },
    },
    build: {
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            editor: ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/extension-link', '@tiptap/extension-placeholder'],
            charts: ['recharts'],
          },
        },
      },
    },
  };
});
