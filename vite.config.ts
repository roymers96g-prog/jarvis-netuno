import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Cargar variables de entorno (incluyendo las de Vercel)
  // El tercer parámetro '' permite cargar variables que no empiecen por VITE_
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Inyectar la API Key de forma segura durante el build
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY)
    },
    build: {
      // Aumentamos el límite de advertencia para que no moleste en el log
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // Dividimos el código: librerías (vendor) por un lado, app por otro.
          // Esto soluciona la advertencia "Some chunks are larger than 500 kB"
          manualChunks: {
            vendor: ['react', 'react-dom', 'recharts', 'lucide-react', '@google/genai'],
          },
        },
      },
    },
  };
});