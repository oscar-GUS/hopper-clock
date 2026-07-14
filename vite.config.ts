import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' para que funcione servido desde una subruta de GitHub Pages.
export default defineConfig({
  base: './',
  plugins: [react()],
})
