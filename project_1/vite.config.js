import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Export Vite configuration
export default defineConfig({
  plugins: [react()], // Enable React plugin for Vite

  define: {
    global: {}, // Define a global object (necessary for some libraries)
    
    'global.WebSocket': 'window.WebSocket', // Ensure WebSocket is available globally
    'global.btoa': 'window.btoa.bind(window)', // Ensure btoa (base64 encoding) is available globally
  }
})
