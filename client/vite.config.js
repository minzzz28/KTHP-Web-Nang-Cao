import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    // Keep browser requests on the same origin. This also works when the
    // frontend is opened through a Dev Container or a forwarded port.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'ws://127.0.0.1:4000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
