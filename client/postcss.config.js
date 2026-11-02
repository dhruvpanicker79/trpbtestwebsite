import { fileURLToPath } from 'node:url';

// Resolve the Tailwind config relative to this file so builds work from any cwd.
export default {
  plugins: {
    tailwindcss: { config: fileURLToPath(new URL('./tailwind.config.js', import.meta.url)) },
    autoprefixer: {},
  },
};
