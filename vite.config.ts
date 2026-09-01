import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Porta fixa: o OAuth do Google exige que a origem cadastrada no Cloud
  // Console bata exatamente com a porta em uso — sem isso, cada "npm run dev"
  // com a porta padrão ocupada pulava pra outra porta e quebrava o login.
  server: {
    port: 5173,
    strictPort: true,
  },
})
