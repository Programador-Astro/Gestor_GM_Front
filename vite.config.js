import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'


export default defineConfig({
  plugins: [react()],
  // ... outras configurações
  server: {
    host: '0.0.0.0', // Garante que ele ouça em todas as interfaces (equivalente ao --host)
    watch: {
      usePolling: true, // Força a verificação das mudanças de arquivo
    }
  }
});