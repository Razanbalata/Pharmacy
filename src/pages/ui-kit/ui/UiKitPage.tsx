import { useState, type ReactNode } from 'react'
import { LanguageSwitcher } from '@/features/switch-language'
import { ThemeSwitcher } from '@/features/switch-theme'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Combobox, type ComboboxOption } from '@/shared/ui/combobox'
import { ConfirmDialog, Drawer } from '@/shared/ui/dialog'
import { EmptyState } from '@/shared/ui/empty-state'
import { Field, Input } from '@/shared/ui/field'
import { Skeleton } from '@/shared/ui/skeleton'
import { DataTable, Pagination, type Column } from '@/shared/ui/table'
import { toast } from '@/shared/ui/toast'

interface DemoProduct {
  id: string
  name: string
  quantity: string
  price: string
  status: 'ok' | 'low' | 'out'
}

const products: DemoProduct[] = [
  {
    id: '1',
    name: 'Augmentin 625mg 14 Tablets',
    quantity: '38 علبة',
    price: '39.00',
    status: 'ok',
  },
  { id: '2', name: 'Ventolin Inhaler 100mcg', quantity: '3 علب', price: '24.00', status: 'low' },
  { id: '3', name: 'Amoxil 500mg 16 Capsules', quantity: '0', price: '18.00', status: 'out' },
]

const statusBadge = {
  ok: <Badge tone="success">متوفر</Badge>,
  low: <Badge tone="warning">ناقص</Badge>,
  out: <Badge>نافد</Badge>,
}

const columns: Column<DemoProduct>[] = [
  { id: 'name', header: 'الصنف', cell: (row) => <span dir="ltr">{row.name}</span> },
  { id: 'quantity', header: 'الكمية', cell: (row) => row.quantity },
  { id: 'price', header: 'السعر ₪', cell: (row) => row.price, numeric: true },
  { id: 'status', header: 'الحالة', cell: (row) => statusBadge[row.status] },
]

const categoryOptions: ComboboxOption[] = [
  { value: '1', label: 'مضادات حيوية', meta: '48 صنف' },
  { value: '2', label: 'مضادات حساسية', meta: '17 صنف' },
  { value: '3', label: 'مسكنات', meta: '31 صنف', keywords: 'painkillers' },
  { value: '4', label: 'أمراض مزمنة', meta: '26 صنف' },
  { value: '5', label: 'جهاز تنفسي', meta: '18 صنف' },
  { value: '6', label: 'عناية بالبشرة', meta: '22 صنف' },
  { value: '7', label: 'فيتامينات', meta: '35 صنف' },
  { value: '8', label: 'أطفال', meta: '29 صنف' },
]

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface-100 p-6 shadow-card">
      <h2 className="font-display text-subheading">{title}</h2>
      {children}
    </section>
  )
}

/** Every shared component in one place, to check them in both themes and languages. */
export function UiKitPage() {
  const [category, setCategory] = useState<string | null>('1')
  const [options, setOptions] = useState(categoryOptions)
  const [selected, setSelected] = useState<Set<string>>(new Set(['2']))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [page, setPage] = useState(1)

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-display">مكتبة المكونات</h1>
        <div className="flex flex-wrap gap-2">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </header>

      <Section title="الأزرار والشارات">
        <div className="flex flex-wrap gap-2">
          <Button>أساسي</Button>
          <Button variant="secondary">ثانوي</Button>
          <Button variant="ghost">نصي</Button>
          <Button variant="danger">إلغاء الفاتورة</Button>
          <Button disabled>معطل</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="success">متوفر</Badge>
          <Badge tone="warning">قريب الانتهاء</Badge>
          <Badge tone="danger">منتهي</Badge>
          <Badge>نافد</Badge>
          <Badge tone="info">مسودة</Badge>
          <Badge tone="brand">صيدلي</Badge>
        </div>
      </Section>

      <Section title="الحقول والاختيار بالبحث">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="اسم الصنف" hint="بالعربي أو الإنجليزي">
            {(control) => <Input {...control} defaultValue="Panadol Extra" />}
          </Field>
          <Field label="الكمية" error="الكمية لازم تكون أكبر من صفر">
            {(control) => <Input {...control} defaultValue="-3" inputMode="numeric" />}
          </Field>
          <Field label="التصنيف" hint="جربي: امراض، pain، أو اسم جديد">
            {(control) => (
              <Combobox
                {...control}
                options={options}
                value={category}
                onChange={setCategory}
                onCreate={(label) => {
                  const value = String(options.length + 1)
                  setOptions([...options, { value, label, meta: 'جديد' }])
                  setCategory(value)
                  toast.success(`انضاف تصنيف "${label}"`)
                }}
              />
            )}
          </Field>
          <Field label="ملاحظة" optional>
            {(control) => <Input {...control} placeholder="أي ملاحظة للمورد" />}
          </Field>
        </div>
      </Section>

      <Section title="الجدول">
        <DataTable
          caption="أصناف تجريبية"
          columns={columns}
          rows={products}
          getRowId={(row) => row.id}
          selection={{
            selected,
            onChange: setSelected,
            rowLabel: (id) => products.find((row) => row.id === id)?.name ?? id,
          }}
        />
        <Pagination page={page} pageSize={25} total={312} onPageChange={setPage} />
      </Section>

      <Section title="النوافذ والرسائل">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
            افتحي نافذة جانبية
          </Button>
          <Button variant="secondary" onClick={() => setConfirmOpen(true)}>
            افتحي نافذة تأكيد
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast.success('انوقف حساب أحمد شحادة', {
                label: 'تراجع',
                onClick: () => toast.info('رجع الحساب نشط'),
              })
            }
          >
            رسالة نجاح
          </Button>
          <Button variant="secondary" onClick={() => toast.error('ما انحفظ. جربي كمان مرة.')}>
            رسالة خطأ
          </Button>
        </div>
      </Section>

      <Section title="الحالة الفاضية والتحميل">
        <div className="grid gap-4 sm:grid-cols-2">
          <EmptyState
            icon="▦"
            tone="brand"
            title="لسا ما في أصناف"
            description="استوردي من Excel أو ضيفي أول صنف."
            actions={
              <>
                <Button size="sm">استيراد</Button>
                <Button size="sm" variant="secondary">
                  صنف جديد
                </Button>
              </>
            }
          />
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <Skeleton className="h-18 flex-1" />
              <Skeleton className="h-18 flex-1" />
            </div>
            <Skeleton className="h-3.5 w-4/5" />
            <Skeleton className="h-3.5 w-3/5" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
        </div>
      </Section>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="زبون جديد"
        description="الاسم والهاتف بس من نقطة البيع، والباقي بعدين."
        footer={
          <>
            <Button onClick={() => setDrawerOpen(false)}>حفظ الزبون</Button>
            <Button variant="ghost" onClick={() => setDrawerOpen(false)}>
              إلغاء
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="الاسم">{(control) => <Input {...control} />}</Field>
          <Field label="رقم الهاتف" hint="لازم للبيع الآجل">
            {(control) => <Input {...control} inputMode="tel" dir="ltr" />}
          </Field>
        </div>
      </Drawer>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          toast.success('تأكدت الفاتورة')
        }}
        title="تأكيد الفاتورة؟"
        message="بعد التأكيد ما بتتعدل. أي تصحيح بيصير بمرتجع."
      />
    </main>
  )
}
