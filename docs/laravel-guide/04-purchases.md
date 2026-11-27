# الوحدة 4: الموردين وطلبات الشراء والاستلام

هون بيدخل المخزون الحقيقي للصيدلية. كل استلام بيعمل دفعات جديدة، وبيزيد حساب المورد.

المديرة والصيدلي بيفتحوا كل الصفحات. الكاشير لا.

## المحتويات

1. [الصفحات](#الصفحات)
2. [القصة من أولها](#القصة-من-أولها)
3. [الموردين](#الموردين)
4. [كشف حساب المورد](#كشف-حساب-المورد)
5. [تسديد للمورد](#تسديد-للمورد)
6. [قائمة طلبات الشراء](#قائمة-طلبات-الشراء)
7. [الطلبات المقترحة](#الطلبات-المقترحة)
8. [إنشاء وتعديل طلب](#إنشاء-وتعديل-طلب)
9. [الإرسال والإلغاء](#الإرسال-والإلغاء)
10. [الاستلام](#الاستلام)
11. [الجداول](#الجداول)
12. [الروابط بملف لارافيل](#الروابط-بملف-لارافيل)
13. [اختبري حالك](#اختبري-حالك)

---

## الصفحات

| الصفحة        | الرابط                   | ملف الصفحة                                                             |
| ------------- | ------------------------ | ---------------------------------------------------------------------- |
| الموردين      | `/suppliers`             | `src/pages/purchasing/suppliers/ui/SuppliersPage.tsx`                  |
| كشف حساب مورد | `/suppliers/:id`         | `src/pages/purchasing/supplier-statement/ui/SupplierStatementPage.tsx` |
| طلبات الشراء  | `/purchases`             | `src/pages/purchasing/purchases/ui/PurchasesPage.tsx`                  |
| طلب جديد      | `/purchases/new`         | `src/pages/purchasing/purchase-order/ui/PurchaseOrderPage.tsx`         |
| تفاصيل طلب    | `/purchases/:id`         | نفس الملف                                                              |
| الاستلام      | `/purchases/:id/receive` | `src/pages/purchasing/purchase-receive/ui/PurchaseReceivePage.tsx`     |

| شو                | وين                                               |
| ----------------- | ------------------------------------------------- |
| أنواع المورد      | `src/entities/supplier/model/types.ts`            |
| طلبات المورد      | `src/entities/supplier/api/supplier-api.ts`       |
| أنواع طلب الشراء  | `src/entities/purchase-order/model/types.ts`      |
| طلبات طلب الشراء  | `src/entities/purchase-order/api/purchase-api.ts` |
| رد السيرفر الوهمي | `src/app/mocks/handlers/purchases.ts`             |

---

## القصة من أولها

```
1. الصنف بينقص تحت الحد الأدنى
2. بيطلع بالطلبات المقترحة تحت مورده          GET  /api/purchases/suggestions
3. بنعمل مسودة طلب (يدوي أو من الاقتراح)       POST /api/purchases
4. بنبعتها للمورد (واتساب، بالفرونت)           POST /api/purchases/{id}/send
5. البضاعة بتوصل، بنستلمها                     POST /api/purchases/{id}/receive
   ← دفعات جديدة بتاريخها وتكلفتها
   ← حركة مخزون نوعها purchase
   ← الحساب بيزيد بقيمة اللي وصل
   ← ولو دفعنا شي وقت الاستلام، بيقل
6. بعدين بنسدد الباقي                          POST /api/suppliers/{id}/payments
```

### حالات الطلب

```
draft ──send──→ sent ──receive (ناقص)──→ partial ──receive──→ received
  │               │
  └──cancel───────┴──→ cancelled   (بس إذا ما وصل منه ولا شي)
```

| الحالة      | معناها       | شو مسموح            |
| ----------- | ------------ | ------------------- |
| `draft`     | مسودة        | تعديل، إرسال، إلغاء |
| `sent`      | انبعت للمورد | استلام، إلغاء       |
| `partial`   | وصل جزء      | استلام الباقي       |
| `received`  | وصل كله      | ولا شي              |
| `cancelled` | ملغي         | ولا شي              |

أي فعل مش مسموح بالحالة الحالية: **409**.

### حالة الدفع

بتنحسب، ما بتنخزن:

| الحالة    | متى                            |
| --------- | ------------------------------ |
| `none`    | ما وصل شي بعد، فما في شي مستحق |
| `unpaid`  | وصل وما دفعنا                  |
| `partial` | دفعنا جزء                      |
| `paid`    | دفعنا كل قيمة اللي وصل         |

> **المستحق هو قيمة اللي وصل، مش اللي انطلب.** طلبنا 20 علبة ووصل 15؟ بندين للمورد بـ 15 بس.

---

## الموردين

### شو بيصير بالشاشة

- تلات بطاقات فوق: كم علينا للموردين كلهم، مشتريات هالشهر، وكم طلب مستني توصيل.
- جدول الموردين: الاسم، المسؤول، الجوال، الرصيد، آخر طلب، وعدد الطلبات هالسنة.
- إضافة وتعديل بلوحة جانبية.

### الروابط

| الطريقة | الرابط                   | الرد                                 |
| ------- | ------------------------ | ------------------------------------ |
| GET     | `/api/suppliers/options` | قائمة مختصرة للاختيار (`id`، `name`) |
| GET     | `/api/suppliers`         | الموردين كاملين، ومعهم `summary`     |
| POST    | `/api/suppliers`         | 201، المورد                          |
| PUT     | `/api/suppliers/{id}`    | المورد                               |

القائمة المختصرة بتنستخدم بكل مكان فيه "اختار مورد" (الأصناف، الطلبات):

```json
{
  "data": [
    { "id": 1, "name": "شركة القدس للأدوية" },
    { "id": 2, "name": "مستودع الشفاء" }
  ]
}
```

القائمة الكاملة:

```json
{
  "data": [
    {
      "id": 1,
      "name": "شركة القدس للأدوية",
      "contactName": "خالد · مبيعات",
      "phone": "0599111222",
      "address": "غزة، الرمال",
      "notes": "التوصيل الأحد والأربعاء",
      "balance": 1840.5,
      "lastOrder": { "id": 14, "number": "PO-0014", "date": "2026-11-20T10:00:00+02:00" },
      "ordersThisYear": 12
    }
  ],
  "summary": {
    "totalOwed": 4210.75,
    "purchasesThisMonth": 6380,
    "awaitingDelivery": 2
  }
}
```

| الحقل                | كيف بينحسب                                |
| -------------------- | ----------------------------------------- |
| `balance`            | مجموع قيم الاستلامات ناقص مجموع التسديدات |
| `lastOrder`          | آخر طلب مش مسودة                          |
| `ordersThisYear`     | الطلبات اللي مش مسودة وانعملت هالسنة      |
| `totalOwed`          | مجموع أرصدة كل الموردين                   |
| `purchasesThisMonth` | مجموع قيم الاستلامات هالشهر               |
| `awaitingDelivery`   | عدد الطلبات `sent` أو `partial`           |

### جسم الإضافة والتعديل

```json
{
  "name": "شركة القدس للأدوية",
  "contactName": "خالد · مبيعات",
  "phone": "0599111222",
  "address": "غزة، الرمال",
  "notes": ""
}
```

| الحقل         | القاعدة                                   | الخطأ     |
| ------------- | ----------------------------------------- | --------- |
| `name`        | مطلوب، وفريد بالصيدلية بعد التوحيد العربي | `taken`   |
| `contactName` | نص، ممكن فاضي                             |           |
| `phone`       | فاضي، أو جوال، أو أرضي (08 وبعده 7 أرقام) | `invalid` |
| `address`     | نص، ممكن فاضي                             |           |
| `notes`       | نص، ممكن فاضي                             |           |

---

## كشف حساب المورد

### شو بيصير بالشاشة

صفحة المورد: بياناته، رصيده، وجدول كشف الحساب لفترة (شهر، 3 شهور، سنة). كل سطر إما فاتورة شراء (بتزيد) أو تسديد (بينقص)، والرصيد بعد كل سطر. زر "تسديد"، وزر "كمّل المسودة" لو في مسودة لهالمورد.

### الطلب

```http
GET /api/suppliers/1/statement?period=quarter
```

| `period`  | من متى            |
| --------- | ----------------- |
| `month`   | أول الشهر الحالي  |
| `quarter` | قبل 90 يوم        |
| `year`    | أول السنة الحالية |

### الرد

```json
{
  "data": {
    "supplier": { "id": 1, "name": "شركة القدس للأدوية", "...": "نفس شكل القائمة" },
    "period": "quarter",
    "from": "2026-08-26",
    "openingBalance": 920,
    "lines": [
      {
        "id": 51,
        "date": "2026-11-20",
        "kind": "invoice",
        "reference": "PO-0014",
        "orderId": 14,
        "detail": "فاتورة المورد 88213 · 6 أصناف",
        "method": null,
        "debit": 1420.5,
        "credit": 0,
        "balance": 2340.5
      },
      {
        "id": 52,
        "date": "2026-11-22",
        "kind": "payment",
        "reference": "RV-0034",
        "orderId": 14,
        "detail": "دفعة أولى · رزان",
        "method": "cash",
        "debit": 0,
        "credit": 500,
        "balance": 1840.5
      }
    ],
    "purchases": 1420.5,
    "paid": 500,
    "draft": { "id": 17, "number": "PO-0017" }
  }
}
```

| الحقل               | معناه                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `from`              | أول يوم بالفترة                                                       |
| `openingBalance`    | الرصيد لآخر اليوم اللي قبل `from`                                     |
| `lines`             | مرتبة بالتاريخ، وبنفس التاريخ برقم السطر                              |
| `debit`             | فاتورة: قيمتها. تسديد: صفر                                            |
| `credit`            | تسديد: قيمته. فاتورة: صفر                                             |
| `balance`           | الرصيد الجاري: `openingBalance` + كل `debit` − كل `credit` لحد هالسطر |
| `method`            | للتسديد: `cash` `bank` `cheque`. للفاتورة: `null`                     |
| `purchases`, `paid` | مجموع الأعمدة بالفترة                                                 |
| `draft`             | مسودة طلب لهالمورد، أو `null`                                         |

### بلارافيل

أسهل طريقة: جدول واحد للحركات المالية مع المورد. كل استلام بيكتب سطر `invoice`، وكل تسديد سطر `payment`. والرصيد مجموعهم:

```php
// app/Models/Supplier.php
public function balance(?string $until = null): float
{
    return round((float) $this->ledger()
        ->when($until, fn ($q) => $q->where('date', '<=', $until))
        ->selectRaw("COALESCE(SUM(CASE WHEN kind = 'invoice' THEN amount ELSE -amount END), 0) as b")
        ->value('b'), 2);
}
```

```php
// app/Http/Controllers/SupplierStatementController.php
public function __invoke(Request $request, Supplier $supplier)
{
    $period = $request->query('period', 'month');
    $from = match ($period) {
        'year' => today()->startOfYear(),
        'quarter' => today()->subDays(90),
        default => today()->startOfMonth(),
    };

    $running = $opening = $supplier->balance($from->copy()->subDay()->toDateString());
    $lines = $supplier->ledger()->where('date', '>=', $from)->orderBy('date')->orderBy('id')->get()
        ->map(function ($entry) use (&$running) {
            $debit = $entry->kind === 'invoice' ? (float) $entry->amount : 0;
            $credit = $entry->kind === 'payment' ? (float) $entry->amount : 0;
            $running = round($running + $debit - $credit, 2);

            return [
                'id' => $entry->id,
                'date' => $entry->date->toDateString(),
                'kind' => $entry->kind,
                'reference' => $entry->reference,
                'orderId' => $entry->kind === 'invoice' ? $entry->purchase_order_id : null,
                'detail' => (string) $entry->detail,
                'method' => $entry->method,
                'debit' => $debit,
                'credit' => $credit,
                'balance' => $running,
            ];
        });

    $draft = $supplier->orders()->where('status', 'draft')->first(['id', 'number']);

    return response()->json(['data' => [
        'supplier' => new SupplierResource($supplier),
        'period' => $period,
        'from' => $from->toDateString(),
        'openingBalance' => $opening,
        'lines' => $lines,
        'purchases' => round($lines->sum('debit'), 2),
        'paid' => round($lines->sum('credit'), 2),
        'draft' => $draft?->only('id', 'number'),
    ]]);
}
```

---

## تسديد للمورد

### شو بيصير بالشاشة

لوحة جانبية: المبلغ، الطريقة، التاريخ، ملاحظة، والفاتورة اللي بنسددها (أو الحساب بشكل عام). لو نقدي، في خيار "من درج الوردية". بعد الحفظ بينطبع سند صرف.

### قائمة الفواتير المفتوحة

عشان قائمة "شو بتسدد":

```http
GET /api/suppliers/1/open-invoices
```

```json
{ "data": [{ "orderId": 14, "number": "PO-0014", "remaining": 920.5 }] }
```

الطلبات اللي قيمة المستلم منها أكبر من المدفوع.

### التسديد

```http
POST /api/suppliers/1/payments
```

```json
{
  "amount": 500,
  "method": "cash",
  "fromDrawer": true,
  "date": "2026-11-24",
  "orderId": 14,
  "note": "دفعة أولى"
}
```

| الحقل        | القاعدة                     | الخطأ تحت `amount` |
| ------------ | --------------------------- | ------------------ |
| `amount`     | أكبر من صفر                 | `positive`         |
| `amount`     | مش أكتر من رصيد المورد      | `tooMuch`          |
| `method`     | `cash` `bank` `cheque`      |                    |
| `fromDrawer` | منطقي. معناه بس مع `cash`   |                    |
| `date`       | `YYYY-MM-DD`                |                    |
| `orderId`    | رقم طلب لهالمورد، أو `null` |                    |
| `note`       | نص، ممكن فاضي               |                    |

الرد (201):

```json
{ "data": { "receipt": "RV-0034", "balance": 1340.5 } }
```

`receipt` رقم السند المطبوع. `balance` الرصيد بعد التسديد.

### شو لازم يصير جوا السيرفر

1. سطر `payment` بدفتر المورد.
2. لو في `orderId`، زيدي `paid` على الطلب.
3. لو `fromDrawer`، المبلغ بينحسب **من نقدية الوردية المفتوحة**. يعني لما الوردية تتسكر، النقدي المتوقع بالدرج بيقل بهالمبلغ (الوحدة 6). خزني رقم الوردية مع السطر.

```php
public function store(Request $request, Supplier $supplier)
{
    $data = $request->validate([
        'amount' => ['required', 'numeric', 'gt:0', 'lte:'.($supplier->balance() + 0.001)],
        'method' => ['required', 'in:cash,bank,cheque'],
        'fromDrawer' => ['required', 'boolean'],
        'date' => ['required', 'date_format:Y-m-d'],
        'orderId' => ['nullable', Rule::exists('purchase_orders', 'id')->where('supplier_id', $supplier->id)],
        'note' => ['present', 'nullable', 'string', 'max:200'],
    ], ['amount.gt' => 'positive', 'amount.lte' => 'tooMuch']);

    $fromDrawer = $data['fromDrawer'] && $data['method'] === 'cash';
    $shift = $fromDrawer ? Shift::open()->first() : null;

    $entry = DB::transaction(function () use ($supplier, $data, $shift, $request) {
        if ($data['orderId']) {
            PurchaseOrder::whereKey($data['orderId'])->increment('paid', $data['amount']);
        }

        return $supplier->ledger()->create([
            'kind' => 'payment',
            'date' => $data['date'],
            'amount' => $data['amount'],
            'method' => $data['method'],
            'purchase_order_id' => $data['orderId'],
            'shift_id' => $shift?->id,
            'reference' => SupplierLedger::nextReceipt(),
            'detail' => collect([$data['note'], $shift ? 'من درج الوردية' : null, $request->user()->name])->filter()->join(' · '),
            'user_id' => $request->user()->id,
        ]);
    });

    return response()->json(['data' => [
        'receipt' => $entry->reference,
        'balance' => $supplier->balance(),
    ]], 201);
}
```

---

## قائمة طلبات الشراء

### الطلب

```http
GET /api/purchases?supplier=1&status=sent&payment=unpaid&days=90
```

| المعامل    | القيم                                             | إذا ما انبعت |
| ---------- | ------------------------------------------------- | ------------ |
| `supplier` | رقم المورد                                        | الكل         |
| `status`   | `draft` `sent` `partial` `received` `cancelled`   | الكل         |
| `payment`  | `none` `unpaid` `partial` `paid`                  | الكل         |
| `days`     | `30` `90` `365`: الطلبات اللي انعملت خلال هالأيام | 30           |

### الرد

قائمة بدون صفحات، الأحدث أول:

```json
{
  "data": [
    {
      "id": 14,
      "number": "PO-0014",
      "supplier": { "id": 1, "name": "شركة القدس للأدوية" },
      "status": "partial",
      "paymentStatus": "partial",
      "createdAt": "2026-11-18T09:30:00+02:00",
      "lineCount": 6,
      "total": 1680
    }
  ]
}
```

`total` هون قيمة اللي **انطلب** (كمية × تكلفة لكل سطر).

---

## الطلبات المقترحة

### شو بيصير بالشاشة

بقائمة الطلبات، في قسم "مقترح": الأصناف الناقصة، مجمعة تحت مورد كل صنف. بتختاري موردين، وبضغطة بتنعمل مسودة لكل واحد.

### الروابط

```http
GET  /api/purchases/suggestions
POST /api/purchases/suggestions
```

الرد:

```json
{
  "data": [
    {
      "supplier": { "id": 1, "name": "شركة القدس للأدوية" },
      "lines": [
        {
          "productId": 12,
          "name": "Augmentin 625mg 14 Tablets",
          "unit": "علبة",
          "stock": 3,
          "minStock": 5,
          "quantity": 7,
          "cost": 32
        }
      ]
    }
  ]
}
```

إنشاء المسودات:

```json
{ "supplierIds": [1, 2] }
```

الرد (201): قائمة الطلبات اللي انعملت، بشكل القائمة.

### مين بيطلع بالاقتراح

الصنف بيطلع إذا **كل** هدول صح:

| الشرط                                                 |
| ----------------------------------------------------- |
| فعال                                                  |
| إله مورد                                              |
| مش موجود بطلب `draft` أو `sent` (عشان ما نطلبه مرتين) |
| كميته أقل أو بتساوي الحد الأدنى، أو خلص               |

| القيمة     | كيف بتنحسب                                                         |
| ---------- | ------------------------------------------------------------------ |
| `quantity` | اللي بيوصل الكمية لضعف الحد الأدنى: `max(1, minStock × 2 − stock)` |
| `cost`     | تكلفة آخر دفعة. لو ما في دفعات، 70% من سعر البيع                   |

```php
// app/Services/PurchaseSuggestions.php
public function groups(): Collection
{
    $onOrder = PurchaseOrderItem::whereHas('order', fn ($q) => $q->whereIn('status', ['draft', 'sent']))
        ->pluck('product_id');

    return Product::query()
        ->withStock()
        ->with(['supplier:id,name', 'firstUnit', 'latestBatch'])
        ->where('active', true)
        ->whereNotNull('supplier_id')
        ->whereNotIn('id', $onOrder)
        ->get()
        ->filter(fn ($p) => (float) $p->stock_quantity <= (float) $p->min_stock)
        ->groupBy('supplier_id')
        ->map(fn ($products) => [
            'supplier' => $products->first()->supplier->only('id', 'name'),
            'lines' => $products->map(fn ($p) => [
                'productId' => $p->id,
                'name' => $p->name,
                'unit' => $p->firstUnit->name,
                'stock' => (float) $p->stock_quantity,
                'minStock' => (float) $p->min_stock,
                'quantity' => max(1, $p->min_stock * 2 - $p->stock_quantity),
                'cost' => (float) ($p->latestBatch?->cost ?? round($p->firstUnit->price * 0.7, 2)),
            ])->values(),
        ])
        ->values();
}
```

---

## إنشاء وتعديل طلب

### شو بيصير بالشاشة

تختاري المورد، وتضيفي أصناف بالبحث. لكل سطر: الكمية والتكلفة. جنب كل صنف بيطلع مخزونه وحده الأدنى، عشان تقرري الكمية. وفي ملاحظة.

### الطلب

```http
POST /api/purchases
PUT  /api/purchases/14     ← المسودة بس، غير هيك 409
```

```json
{
  "supplierId": 1,
  "lines": [
    { "productId": 12, "quantity": 20, "cost": 32 },
    { "productId": 15, "quantity": 10, "cost": 8.5 }
  ],
  "note": "التوصيل يوم الأحد"
}
```

| الحقل               | القاعدة                         | الخطأ                                     |
| ------------------- | ------------------------------- | ----------------------------------------- |
| `supplierId`        | مورد من نفس الصيدلية            |                                           |
| `lines`             | سطر واحد على الأقل              | `{ "errors": { "lines": ["required"] } }` |
| `lines.*.productId` | صنف من نفس الصيدلية، بدون تكرار |                                           |
| `lines.*.quantity`  | أكبر من صفر، بأول وحدة          |                                           |
| `lines.*.cost`      | صفر أو أكتر، تكلفة أول وحدة     |                                           |
| `note`              | نص، ممكن فاضي                   |                                           |

### الرد

201 أو 200، الطلب كامل:

```json
{
  "data": {
    "id": 14,
    "number": "PO-0014",
    "supplier": { "id": 1, "name": "شركة القدس للأدوية", "phone": "0599111222" },
    "status": "draft",
    "paymentStatus": "none",
    "createdAt": "2026-11-18T09:30:00+02:00",
    "sentAt": null,
    "note": "التوصيل يوم الأحد",
    "lines": [
      {
        "productId": 12,
        "name": "Augmentin 625mg 14 Tablets",
        "unit": "علبة",
        "quantity": 20,
        "cost": 32,
        "received": 0,
        "stock": 3,
        "minStock": 5
      }
    ],
    "total": 725,
    "receivedTotal": 0,
    "paid": 0
  }
}
```

| الحقل              | معناه                                              |
| ------------------ | -------------------------------------------------- |
| `supplier.phone`   | الفرونت بيستخدمه لزر "ابعت على واتساب"             |
| `lines.*.received` | كم وصل لحد هلق، من كل الاستلامات                   |
| `lines.*.stock`    | مخزون الصنف **هلق**                                |
| `total`            | قيمة المطلوب                                       |
| `receivedTotal`    | قيمة الواصل: مجموع `received × cost`. وهاد المستحق |
| `paid`             | المدفوع على هالطلب                                 |

رقم الطلب: `PO-` وبعده الرقم بـ 4 خانات.

بالتعديل، احذفي السطور وارجعي اعمليها (المسودة ما فيها استلام، فآمن).

---

## الإرسال والإلغاء

```http
POST /api/purchases/14/send
```

بيحول المسودة لـ `sent`، وبيحط `sentAt`. الرد: الطلب كامل. **الإرسال للمورد نفسه (واتساب) بيصير بالفرونت**، السيرفر بس بيعلّم.

```http
POST /api/purchases/14/cancel
```

الرد: 204. مسموح بس إذا الحالة `draft` أو `sent` **وما وصل ولا شي**. غير هيك: 409.

---

## الاستلام

هاي أهم عملية بالوحدة.

### شو بيصير بالشاشة

لكل سطر بالطلب: كم وصل، رقم الدفعة، تاريخ الانتهاء، والتكلفة (ممكن تتغير عن الطلب). فوق: رقم فاتورة المورد. وتحت: كم دفعنا هلق، وكيف، ومن الدرج أو لا. الشاشة بتعرض قيمة الواصل والباقي اللي رح ينضاف على الحساب.

### الطلب

```http
POST /api/purchases/14/receive
```

```json
{
  "supplierInvoice": "88213",
  "lines": [
    { "productId": 12, "received": 15, "batch": "AUG-2706", "expiry": "2027-06-30", "cost": 32 },
    { "productId": 15, "received": 0, "batch": "", "expiry": "", "cost": 8.5 }
  ],
  "payment": { "amount": 300, "method": "cash", "fromDrawer": true }
}
```

| الحقل            | القاعدة                                         | الخطأ                        |
| ---------------- | ----------------------------------------------- | ---------------------------- |
| الحالة           | `sent` أو `partial`                             | 409                          |
| `lines`          | سطر واحد على الأقل `received` أكبر من صفر       | `lines` ← `required`         |
| `lines.N.batch`  | مطلوب للسطر اللي وصل منه                        | `lines.N.batch` ← `required` |
| `lines.N.expiry` | للسطر اللي وصل: تاريخ بعد اليوم                 | `lines.N.expiry` ← `past`    |
| `lines.N.cost`   | صفر أو أكتر                                     |                              |
| `payment.amount` | صفر أو أكتر، ومش أكتر من قيمة الواصل بهالاستلام | `payment.amount` ← `tooMuch` |
| `payment.method` | `cash` `bank` `cheque`                          |                              |

السطور اللي `received = 0` بتتجاهل.

> انتبهي لأسماء الأخطاء: `lines.0.batch` و`lines.0.expiry`. الفرونت بيحط الخطأ تحت الحقل الصح بالسطر الصح. لارافيل بيعطي هالأسماء تلقائياً لما القواعد تكون على `lines.*.batch`.

### الرد

```json
{
  "data": {
    "status": "partial",
    "receivedValue": 480,
    "paid": 300,
    "addedToAccount": 180
  }
}
```

### شو لازم يصير جوا السيرفر، بعملية وحدة

1. لكل سطر وصل:
   - زيدي `received` بسطر الطلب، وحدثي `cost` للتكلفة الجديدة.
   - اعملي **دفعة** جديدة: الرمز، الانتهاء، الكمية، التكلفة، المورد، ورقم الطلب.
   - اكتبي **حركة مخزون** `purchase` بموجب الكمية، ومرجعها رقم الطلب.
2. حالة الطلب: `received` إذا كل سطر وصل كامل أو أكتر، وإلا `partial`.
3. سطر `invoice` بدفتر المورد بقيمة الواصل بهالاستلام، والتفاصيل "فاتورة المورد 88213 · 6 أصناف".
4. لو في دفعة: سطر `payment`، وزيدي `paid` على الطلب. ولو `fromDrawer`، اربطيها بالوردية المفتوحة.

```php
// app/Http/Controllers/PurchaseReceiveController.php
public function __invoke(ReceiveRequest $request, PurchaseOrder $order)
{
    abort_unless(in_array($order->status, ['sent', 'partial']), 409, 'Not allowed now.');

    $arriving = collect($request->input('lines'))->filter(fn ($l) => $l['received'] > 0);
    $value = round($arriving->sum(fn ($l) => $l['received'] * $l['cost']), 2);
    $payment = $request->input('payment');

    if ($payment['amount'] > $value + 0.001) {
        throw ValidationException::withMessages(['payment.amount' => 'tooMuch']);
    }

    DB::transaction(function () use ($order, $arriving, $value, $payment, $request) {
        foreach ($arriving as $line) {
            $item = $order->items()->where('product_id', $line['productId'])->firstOrFail();
            $item->increment('received', $line['received'], ['cost' => $line['cost']]);

            $batch = Batch::create([
                'product_id' => $line['productId'],
                'code' => trim($line['batch']),
                'expiry' => $line['expiry'],
                'quantity' => $line['received'],
                'cost' => $line['cost'],
                'supplier_id' => $order->supplier_id,
                'purchase_order_id' => $order->id,
            ]);
            StockMovement::record($batch, +$line['received'], 'purchase', $order->number, link: ['order', $order->id], adjust: false);
        }

        $order->update([
            'status' => $order->items()->whereColumn('received', '<', 'quantity')->exists() ? 'partial' : 'received',
        ]);

        $order->supplier->ledger()->create([
            'kind' => 'invoice',
            'date' => today(),
            'amount' => $value,
            'purchase_order_id' => $order->id,
            'reference' => $order->number,
            'detail' => collect([
                $request->input('supplierInvoice') ? 'فاتورة المورد '.$request->input('supplierInvoice') : null,
                $arriving->count().' أصناف',
            ])->filter()->join(' · '),
            'user_id' => $request->user()->id,
        ]);

        if ($payment['amount'] > 0) {
            $shift = $payment['fromDrawer'] && $payment['method'] === 'cash' ? Shift::open()->first() : null;
            $order->increment('paid', $payment['amount']);
            $order->supplier->ledger()->create([
                'kind' => 'payment',
                'date' => today(),
                'amount' => $payment['amount'],
                'method' => $payment['method'],
                'purchase_order_id' => $order->id,
                'shift_id' => $shift?->id,
                'reference' => SupplierLedger::nextReceipt(),
                'detail' => collect([$shift ? 'من درج الوردية' : null, $request->user()->name])->filter()->join(' · '),
                'user_id' => $request->user()->id,
            ]);
        }
    });

    return response()->json(['data' => [
        'status' => $order->fresh()->status,
        'receivedValue' => $value,
        'paid' => (float) $payment['amount'],
        'addedToAccount' => round($value - $payment['amount'], 2),
    ]]);
}
```

```php
// app/Http/Requests/ReceiveRequest.php
public function rules(): array
{
    return [
        'supplierInvoice' => ['present', 'nullable', 'string', 'max:60'],
        'lines' => ['required', 'array', 'min:1'],
        'lines.*.productId' => ['required', 'integer'],
        'lines.*.received' => ['required', 'numeric', 'min:0'],
        'lines.*.batch' => ['present', 'nullable', 'string', 'max:40'],
        'lines.*.expiry' => ['present', 'nullable', 'string'],
        'lines.*.cost' => ['required', 'numeric', 'min:0'],
        'payment.amount' => ['required', 'numeric', 'min:0'],
        'payment.method' => ['required', 'in:cash,bank,cheque'],
        'payment.fromDrawer' => ['required', 'boolean'],
    ];
}

public function withValidator($validator): void
{
    $validator->after(function ($v) {
        $lines = collect($this->input('lines', []));
        if ($lines->every(fn ($l) => ($l['received'] ?? 0) <= 0)) {
            $v->errors()->add('lines', 'required');
        }
        foreach ($lines as $i => $l) {
            if (($l['received'] ?? 0) > 0 && blank($l['batch'] ?? null)) $v->errors()->add("lines.{$i}.batch", 'required');
            if (($l['received'] ?? 0) > 0 && (($l['expiry'] ?? '') <= today()->toDateString())) $v->errors()->add("lines.{$i}.expiry", 'past');
        }
    });
}
```

> الدفعة والتاريخ مطلوبين **بس** للسطر اللي وصل منه. قواعد لارافيل العادية صعب تقول هيك لكل سطر، فالفحص الحقيقي صار بـ `withValidator`، والقواعد فوق بس للشكل.

### حركة المخزون: دالة وحدة لكل الوحدات

كل مكان بيغير كمية دفعة (شراء، بيع، مرتجع، جرد، تالف) لازم يكتب حركة، بدالة وحدة اسمها `StockMovement::record`. الكود الكامل وجدولها بالوحدة 5. هون بنناديها بـ `adjust: false` لأنه الدفعة انعملت بكميتها، فما لازم تنزاد مرة تانية.

---

## الجداول

```php
Schema::create('suppliers', function (Blueprint $table) {
    $table->id();
    $table->foreignId('pharmacy_id')->constrained()->cascadeOnDelete();
    $table->string('name');
    $table->string('contact_name')->default('');
    $table->string('phone', 10)->default('');
    $table->string('address')->default('');
    $table->text('notes')->nullable();
    $table->timestamps();
});

Schema::create('purchase_orders', function (Blueprint $table) {
    $table->id();
    $table->foreignId('pharmacy_id')->constrained()->cascadeOnDelete();
    $table->string('number', 20);
    $table->foreignId('supplier_id')->constrained();
    $table->enum('status', ['draft', 'sent', 'partial', 'received', 'cancelled'])->default('draft');
    $table->text('note')->nullable();
    $table->decimal('paid', 12, 2)->default(0);
    $table->timestamp('sent_at')->nullable();
    $table->foreignId('user_id')->constrained();
    $table->timestamps();

    $table->unique(['pharmacy_id', 'number']);
});

Schema::create('purchase_order_items', function (Blueprint $table) {
    $table->id();
    $table->foreignId('purchase_order_id')->constrained()->cascadeOnDelete();
    $table->foreignId('product_id')->constrained();
    $table->decimal('quantity', 12, 4);
    $table->decimal('cost', 10, 2);
    $table->decimal('received', 12, 4)->default(0);
});

Schema::create('supplier_ledger', function (Blueprint $table) {
    $table->id();
    $table->foreignId('pharmacy_id')->constrained()->cascadeOnDelete();
    $table->foreignId('supplier_id')->constrained();
    $table->enum('kind', ['invoice', 'payment']);
    $table->date('date');
    $table->decimal('amount', 12, 2);
    $table->enum('method', ['cash', 'bank', 'cheque'])->nullable();
    $table->foreignId('purchase_order_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignId('shift_id')->nullable()->constrained()->nullOnDelete();   // تسديد من الدرج
    $table->string('reference', 20);                                           // PO-0014 أو RV-0034
    $table->string('detail')->default('');
    $table->foreignId('user_id')->constrained();
    $table->timestamps();

    $table->index(['supplier_id', 'date']);
});
```

> **ليش ما في عمود `balance` بجدول الموردين؟** لأنه بيتغير مع كل استلام وتسديد، ولو نسيتي تحدثيه مرة، بيصير الرقم غلط للأبد. المجموع من الدفتر دايماً صح. لو صار بطيء مع الوقت، بتقدري تضيفيه بعدين كرقم محفوظ وتحدثيه بنفس العملية.

الحسابات بالموديل:

```php
// app/Models/PurchaseOrder.php
public function totals(): array
{
    $total = round($this->items->sum(fn ($i) => $i->quantity * $i->cost), 2);
    $received = round($this->items->sum(fn ($i) => $i->received * $i->cost), 2);
    $paid = (float) $this->paid;

    return [
        'total' => $total,
        'receivedTotal' => $received,
        'paymentStatus' => match (true) {
            $received == 0 => 'none',
            $paid >= $received => 'paid',
            $paid > 0 => 'partial',
            default => 'unpaid',
        },
    ];
}
```

---

## الروابط بملف لارافيل

```php
// القائمة المختصرة بتلزم فلتر الأصناف عند الكاشير كمان
Route::middleware('auth:sanctum')->get('/suppliers/options', [SupplierController::class, 'options']);

Route::middleware(['auth:sanctum', 'role:manager,pharmacist'])->group(function () {
    Route::get('/suppliers', [SupplierController::class, 'index']);
    Route::post('/suppliers', [SupplierController::class, 'store']);
    Route::put('/suppliers/{supplier}', [SupplierController::class, 'update']);
    Route::get('/suppliers/{supplier}/statement', SupplierStatementController::class);
    Route::get('/suppliers/{supplier}/open-invoices', [SupplierPaymentController::class, 'openInvoices']);
    Route::post('/suppliers/{supplier}/payments', [SupplierPaymentController::class, 'store']);

    Route::get('/purchases/suggestions', [PurchaseSuggestionController::class, 'index']);
    Route::post('/purchases/suggestions', [PurchaseSuggestionController::class, 'store']);
    Route::get('/purchases', [PurchaseOrderController::class, 'index']);
    Route::post('/purchases', [PurchaseOrderController::class, 'store']);
    Route::get('/purchases/{order}', [PurchaseOrderController::class, 'show']);
    Route::put('/purchases/{order}', [PurchaseOrderController::class, 'update']);
    Route::post('/purchases/{order}/send', [PurchaseOrderController::class, 'send']);
    Route::post('/purchases/{order}/cancel', [PurchaseOrderController::class, 'cancel']);
    Route::post('/purchases/{order}/receive', PurchaseReceiveController::class);
});
```

---

## اختبري حالك

- [ ] صنف تحت الحد الأدنى بيطلع بالاقتراح تحت مورده، وبيختفي لما ينعمله طلب
- [ ] تعديل طلب بعد الإرسال بيرجع 409
- [ ] استلام 15 من 20 بيخلي الطلب `partial`، والصنف بيزيد 15
- [ ] الصنف بيطلع بدفعة جديدة بتاريخها، والحركة `purchase` بمرجع الطلب
- [ ] رصيد المورد بيزيد بقيمة الواصل بس، مش المطلوب
- [ ] دفع أكتر من قيمة الواصل بيعرض الخطأ تحت المبلغ
- [ ] كشف الحساب: الرصيد بآخر سطر = رصيد المورد بالقائمة
- [ ] تسديد من الدرج بيقلل النقدي المتوقع بإغلاق الوردية
- [ ] إلغاء طلب وصل منه شي بيرجع 409
