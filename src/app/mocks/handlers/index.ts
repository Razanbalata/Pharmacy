import { alertHandlers } from './alerts'
import { catalogHandlers } from './catalog'
import { joinRequestHandlers } from './join-requests'
import { pharmacyHandlers } from './pharmacy'
import { sessionHandlers } from './session'
import { staffHandlers } from './staff'

/** Every fake endpoint. Each module adds its own file here. */
export const handlers = [
  ...sessionHandlers,
  ...alertHandlers,
  ...joinRequestHandlers,
  ...pharmacyHandlers,
  ...staffHandlers,
  ...catalogHandlers,
]
