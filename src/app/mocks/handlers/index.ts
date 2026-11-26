import { alertHandlers } from './alerts'
import { catalogHandlers } from './catalog'
import { customerHandlers } from './customers'
import { dashboardHandlers } from './dashboard'
import { financeHandlers } from './finance'
import { reportHandlers } from './reports'
import { importHandlers } from './imports'
import { purchaseHandlers } from './purchases'
import { salesHandlers } from './sales'
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
  ...salesHandlers,
  ...customerHandlers,
  ...financeHandlers,
  ...dashboardHandlers,
  ...reportHandlers,
]
