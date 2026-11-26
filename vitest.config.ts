import { mergeConfig, defineConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./test/setup.ts'],
      css: false,
      passWithNoTests: true,
      // Slower machines (Windows, a laptop on battery) need longer than the 5 s default.
      testTimeout: 20_000,
    },
  }),
)
