import { ThemeSwitcher } from '@/features/switch-theme'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'

/** Temporary page that shows the design system is wired. Replaced by the dashboard later. */
export function HomePage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-display">فارما سمارت</h1>
        <ThemeSwitcher />
      </header>
      <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface-100 p-6 shadow-card">
        <h2 className="font-display text-heading">نظام التصميم شغال</h2>
        <p className="text-body text-ink-muted">
          الألوان والخطوط جاية من نظام التصميم، وبتتبدل مع المظهر.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button>بيع جديد</Button>
          <Button variant="secondary">تصدير</Button>
          <Button variant="ghost">عرض الكل</Button>
          <Button variant="danger">إلغاء الفاتورة</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="success">متوفر</Badge>
          <Badge tone="warning">قريب الانتهاء</Badge>
          <Badge tone="danger">منتهي</Badge>
          <Badge>نافد</Badge>
          <Badge tone="info">مسودة</Badge>
          <Badge tone="brand">صيدلي</Badge>
        </div>
        <p className="tabular text-number-xl">1,834 ₪</p>
      </section>
    </main>
  )
}
