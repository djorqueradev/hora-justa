import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativa: funciona en GitHub Pages (/hora-justa/) y en local.
export default defineConfig({
  plugins: [react()],
  base: './',
});
