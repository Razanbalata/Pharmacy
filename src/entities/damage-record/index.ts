export type {
  DamageInput,
  DamageReason,
  DamageRecord,
  DamageSummary,
  ExpiredBatch,
} from './model/types'
export { DAMAGE_REASONS } from './model/types'
export { damageQueries, listDamage, recordDamage, recordExpired } from './api/damage-api'
