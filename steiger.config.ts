import fsd from '@feature-sliced/steiger-plugin'
import { defineConfig } from 'steiger'

// Feature-Sliced Design linter: checks layer order, slice isolation and public APIs.
export default defineConfig([
  ...fsd.configs.recommended,
  {
    // Empty layers are expected while the project grows.
    rules: {
      'fsd/insignificant-slice': 'off',
    },
  },
])
