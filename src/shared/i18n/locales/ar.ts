/** Arabic is the source of truth: every key starts here, English must match its shape. */
export const ar = {
  app: { name: 'فارما سمارت' },
  common: {
    optional: 'اختياري',
    loading: 'جاري التحميل…',
    close: 'إغلاق',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    back: 'رجوع',
    undo: 'تراجع',
    retry: 'إعادة',
    search: 'ابحث…',
    noResultsFor: 'ما لقينا "{{query}}"',
    addNew: 'أضيفي "{{value}}"',
    selected: 'محدد: {{count}}',
  },
  theme: { label: 'المظهر', system: 'حسب الجهاز', light: 'نهاري', dark: 'ليلي' },
  language: { label: 'اللغة', ar: 'العربية', en: 'English' },
  home: {
    title: 'نظام التصميم شغال',
    body: 'الألوان والخطوط جاية من نظام التصميم، وبتتبدل مع المظهر.',
  },
  actions: {
    newSale: 'بيع جديد',
    export: 'تصدير',
    viewAll: 'عرض الكل',
    cancelInvoice: 'إلغاء الفاتورة',
  },
  status: {
    inStock: 'متوفر',
    expiringSoon: 'قريب الانتهاء',
    expired: 'منتهي',
    outOfStock: 'نافد',
    draft: 'مسودة',
  },
  role: { manager: 'المدير', pharmacist: 'صيدلي', cashier: 'كاشير' },
  network: {
    offline: 'الاتصال مقطوع. بنحفظ شغلك وبنرفعه أول ما يرجع النت.',
    // Arabic has six plural forms; a count after a colon reads right with any number.
    pending: 'بانتظار الرفع: {{count}}',
  },
  notFound: { title: 'الصفحة مش موجودة', back: 'للصفحة الرئيسية' },
}

export type Messages = typeof ar
