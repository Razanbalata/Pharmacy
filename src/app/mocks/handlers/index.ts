import { alertHandlers } from './alerts'
import { catalogHandlers } from './catalog'
import { importHandlers } from './imports'
import { purchaseHandlers } from './purchases'
import { stockHandlers } from './stock'
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
  ...importHandlers,
  ...purchaseHandlers,
  ...stockHandlers,
]
