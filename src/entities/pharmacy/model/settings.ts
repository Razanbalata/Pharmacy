export type ReceiptSize = '80mm' | '58mm' | 'A4'

/** Everything that differs between pharmacies, each with a default from the server. */
export interface PharmacySettings {
  sale: {
    paymentMethods: { cash: boolean; bankApp: boolean; credit: boolean }
    /** e.g. "بنك فلسطين، جوال باي" */
    bankAppNames: string
    defaultDebtLimit: number
    returnDays: number
    shiftsEnabled: boolean
    sellByUnit: boolean
    sellAtZero: boolean
  }
  stock: {
    expiryAlertDays: number
    defaultMinStock: number
    dailyDigest: boolean
  }
  print: {
    receiptSize: ReceiptSize
    autoPrint: boolean
    footer: string
    labelSize: '38x25' | '50x30'
  }
  backup: {
    lastBackupAt: string | null
  }
}

export type PharmacySettingsInput = Omit<PharmacySettings, 'backup'>
