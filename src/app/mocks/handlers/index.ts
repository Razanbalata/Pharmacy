import { sessionHandlers } from './session'

/** Every fake endpoint. Each module adds its own file here. */
export const handlers = [...sessionHandlers]
