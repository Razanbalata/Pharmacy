import { alertHandlers } from './alerts'
import { joinRequestHandlers } from './join-requests'
import { pharmacyHandlers } from './pharmacy'
import { sessionHandlers } from './session'

/** Every fake endpoint. Each module adds its own file here. */
export const handlers = [
  ...sessionHandlers,
  ...alertHandlers,
  ...joinRequestHandlers,
  ...pharmacyHandlers,
]
