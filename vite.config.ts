mport { defineConfig } from 'vite'
import react from '@vitejs/react-swc'

export default defineConfig({
  base: './',   // <--- Add this exact line!
  plugins: [react()],
})