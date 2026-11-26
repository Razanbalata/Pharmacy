import type { ActivityEntry } from '@/entities/activity'
import type { JoinRequest } from '@/entities/join-request'
import type { OnboardingStatus, PharmacyProfile, PharmacySettings } from '@/entities/pharmacy'
import type { StaffMember } from '@/entities/staff-member'
import { initialCustomers } from './customers-data'
import { initialFinance } from './finance-data'
import { initialCatalog } from './catalog-data'
import { initialPurchases } from './purchases-data'
import { initialSales } from './sales-data'
import { initialStock } from './stock-data'

/**
 * The fake server's memory. Starts from the design data and changes as you use the app,
 * until the page is reloaded. reset() puts it back, so every test starts the same.
 */
function initial() {
  const joinRequests: JoinRequest[] = [
    {
      id: 34,
      reference: 'REQ-0034',
      pharmacyName: 'صيدلية الرحمة',
      ownerName: 'هبة نصار',
      city: 'النصيرات',
      phone: '0599402219',
      licenseNumber: 'PH-2025-0388',
      status: 'new',
      hasLicensePhoto: true,
      rejectionReason: null,
      createdAt: '2026-11-24T08:40:00Z',
    },
    {
      id: 33,
      reference: 'REQ-0033',
      pharmacyName: 'صيدلية الوفاء',
      ownerName: 'إياد مقداد',
      city: 'خان يونس',
      phone: '0597118640',
      licenseNumber: 'PH-2024-0912',
      status: 'new',
      hasLicensePhoto: false,
      rejectionReason: null,
      createdAt: '2026-11-23T14:10:00Z',
    },
    {
      id: 32,
      reference: 'REQ-0032',
      pharmacyName: 'صيدلية ابن سينا',
      ownerName: 'ريم أبو شمالة',
      city: 'غزة',
      phone: '0598503772',
      licenseNumber: 'PH-2026-0077',
      status: 'new',
      hasLicensePhoto: true,
      rejectionReason: null,
      createdAt: '2026-11-23T09:25:00Z',
    },
    {
      id: 30,
      reference: 'REQ-0030',
      pharmacyName: 'صيدلية الحكمة',
      ownerName: 'ناصر الدحدوح',
      city: 'دير البلح',
      phone: '0592660135',
      licenseNumber: 'PH-2023-0451',
      status: 'approved',
      hasLicensePhoto: true,
      rejectionReason: null,
      createdAt: '2026-11-22T11:00:00Z',
    },
    {
      id: 31,
      reference: 'REQ-0031',
      pharmacyName: 'صيدلية الشفاء',
      ownerName: 'رزان بلاطة',
      city: 'غزة',
      phone: '0599920307',
      licenseNumber: 'PH-2026-0147',
      status: 'activated',
      hasLicensePhoto: true,
      rejectionReason: null,
      createdAt: '2026-11-11T07:30:00Z',
    },
    {
      id: 29,
      reference: 'REQ-0029',
      pharmacyName: 'صيدلية المدينة',
      ownerName: 'عماد سرحان',
      city: 'رفح',
      phone: '0595207918',
      licenseNumber: 'PH-2022-0310',
      status: 'rejected',
      hasLicensePhoto: true,
      rejectionReason: 'الترخيص مش مطابق لاسم الصيدلية',
      createdAt: '2026-11-20T10:15:00Z',
    },
  ]
  const profile: PharmacyProfile = {
    id: 1,
    name: 'صيدلية الشفاء',
    city: 'غزة',
    address: 'الرمال · شارع عمر المختار',
    phone: '0599123456',
    licenseNumber: 'PH-2026-0147',
    currency: 'ILS',
    logoUrl: null,
  }
  const onboarding: OnboardingStatus = {
    dismissed: false,
    steps: [
      { key: 'account', done: true },
      { key: 'profile', done: true },
      { key: 'products', done: false },
      { key: 'openingStock', done: false },
      { key: 'staff', done: false },
      { key: 'payments', done: false },
    ],
  }
  const noExtras = { sellOnCredit: false, seePurchasePrice: false, approveCounts: false }
  const staff: StaffMember[] = [
    {
      id: 1,
      name: 'رزان',
      phone: '0599920307',
      email: 'razan@pharmasmart.ps',
      role: 'manager',
      discountLimit: null,
      permissions: { sellOnCredit: true, seePurchasePrice: true, approveCounts: true },
      active: true,
      isOwner: true,
      lastLoginAt: '2026-11-24T13:40:00Z',
    },
    {
      id: 2,
      name: 'سارة يوسف',
      phone: '0598210774',
      email: 'sara@pharmasmart.ps',
      role: 'pharmacist',
      discountLimit: 10,
      permissions: { sellOnCredit: true, seePurchasePrice: false, approveCounts: true },
      active: true,
      isOwner: false,
      lastLoginAt: '2026-11-24T07:05:00Z',
    },
    {
      id: 3,
      name: 'محمد سالم',
      phone: '0597640118',
      email: null,
      role: 'cashier',
      discountLimit: 5,
      permissions: { ...noExtras, sellOnCredit: true },
      active: true,
      isOwner: false,
      lastLoginAt: '2026-11-24T05:58:00Z',
    },
    {
      id: 4,
      name: 'أحمد شحادة',
      phone: '0592455301',
      email: null,
      role: 'cashier',
      discountLimit: 5,
      permissions: noExtras,
      active: false,
      isOwner: false,
      lastLoginAt: '2026-10-02T12:00:00Z',
    },
  ]
  const activity: ActivityEntry[] = [
    {
      id: 9,
      at: '2026-11-24T13:41:00Z',
      actor: { id: 3, name: 'محمد سالم' },
      kind: 'sale',
      event: 'discount',
      params: { amount: 5, invoice: 'INV-000245' },
      detail: 'ضمن حده (5%) · نقدي 184 ₪',
    },
    {
      id: 8,
      at: '2026-11-24T12:25:00Z',
      actor: { id: 2, name: 'سارة يوسف' },
      kind: 'sensitive',
      event: 'returnApproved',
      params: { invoice: 'INV-000241' },
      detail: 'محمد طلب الموافقة · المبلغ رجع نقدي',
    },
    {
      id: 7,
      at: '2026-11-24T12:20:00Z',
      actor: { id: 1, name: 'رزان' },
      kind: 'settings',
      event: 'settingsChanged',
      params: { field: 'مدة تنبيه الصلاحية', from: 60, to: 90 },
      detail: 'الإعدادات ← المخزون والتنبيهات',
    },
    {
      id: 6,
      at: '2026-11-24T11:05:00Z',
      actor: { id: 1, name: 'رزان' },
      kind: 'sensitive',
      event: 'bulkEdit',
      params: { count: 3 },
      detail: 'الحد الأدنى والمورد · صاروا تحت الحد وظهروا بالنواقص',
    },
    {
      id: 5,
      at: '2026-11-24T09:30:00Z',
      actor: { id: 2, name: 'سارة يوسف' },
      kind: 'sensitive',
      event: 'damage',
      params: { product: 'أوميغا 3' },
      detail: 'السبب: انتهاء صلاحية',
    },
    {
      id: 4,
      at: '2026-11-24T07:10:00Z',
      actor: { id: 2, name: 'سارة يوسف' },
      kind: 'stock',
      event: 'countStarted',
      params: { section: 'المضادات الحيوية' },
      detail: '46 صنف · لسا ما اعتمد',
    },
    {
      id: 3,
      at: '2026-11-24T07:05:00Z',
      actor: { id: 2, name: 'سارة يوسف' },
      kind: 'login',
      event: 'login',
      params: {},
      detail: 'Chrome · ويندوز',
    },
    {
      id: 2,
      at: '2026-11-24T06:00:00Z',
      actor: { id: 3, name: 'محمد سالم' },
      kind: 'sale',
      event: 'shiftOpened',
      params: { shift: 14, amount: 200 },
      detail: 'الدرج الرئيسي',
    },
    {
      id: 1,
      at: '2026-11-24T05:58:00Z',
      actor: { id: 3, name: 'محمد سالم' },
      kind: 'login',
      event: 'login',
      params: {},
      detail: 'Chrome · أندرويد',
    },
    {
      id: 0,
      at: '2026-11-20T09:00:00Z',
      actor: { id: 1, name: 'رزان' },
      kind: 'sensitive',
      event: 'staffStopped',
      params: { name: 'أحمد شحادة' },
      detail: null,
    },
  ]
  const settings: PharmacySettings = {
    sale: {
      paymentMethods: { cash: true, bankApp: true, credit: true },
      bankAppNames: 'بنك فلسطين، جوال باي',
      defaultDebtLimit: 300,
      returnDays: 14,
      shiftsEnabled: true,
      sellByUnit: true,
      sellAtZero: false,
    },
    stock: { expiryAlertDays: 90, defaultMinStock: 5, dailyDigest: true },
    print: {
      receiptSize: '80mm',
      autoPrint: true,
      footer: 'شكراً لزيارتكم، دمتم بصحة.',
      labelSize: '38x25',
    },
    backup: { lastBackupAt: '2026-11-24T01:00:00Z' },
  }
  const catalog = initialCatalog()
  return {
    ...catalog,
    ...initialStock(catalog.products),
    ...initialSales(catalog.products),
    ...initialCustomers(),
    ...initialFinance(),
    /** Alerts already opened. These two were seen before; the other eight are new. */
    alertsRead: ['expiringMore', 'orderPartial:13'],
    ...initialPurchases(),
    staff,
    activity,
    settings,
    /** The fake "today", so period filters give the same answer every day. */
    today: '2026-11-24',
    joinRequests,
    profile,
    onboarding,
    cities: [
      'غزة',
      'خان يونس',
      'دير البلح',
      'رفح',
      'النصيرات',
      'البريج',
      'المغازي',
      'جباليا',
      'بيت لاهيا',
      'بيت حانون',
    ],
    /** activation token → join request id. "expired-token" is known but too old. */
    activationTokens: new Map<string, { requestId: number; expired: boolean }>([
      ['demo-token', { requestId: 30, expired: false }],
      ['expired-token', { requestId: 30, expired: true }],
    ]),
    failedLogins: 0,
    /** Password reset: the code that "was sent", and the token after verifying it. */
    resetCode: '481927',
    resetTokens: new Set<string>(),
  }
}

export let db = initial()

export function resetDb(): void {
  db = initial()
}
