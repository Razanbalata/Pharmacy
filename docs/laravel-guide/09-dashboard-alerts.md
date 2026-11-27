# الوحدة 9: لوحة التحكم والتنبيهات

هالوحدة ما بتخزن شي تقريباً. كلها **قراءة وحساب** من بيانات الوحدات اللي قبلها. فابنيها بعد ما تخلص 3 لـ 8.

## المحتويات

1. [الصفحات ومين بيشوف شو](#الصفحات-ومين-بيشوف-شو)
2. [التنبيهات: الفكرة](#التنبيهات-الفكرة)
3. [أنواع التنبيهات](#أنواع-التنبيهات)
4. [روابط التنبيهات](#روابط-التنبيهات)
5. [لوحة التحكم](#لوحة-التحكم)
6. [منحنى المبيعات](#منحنى-المبيعات)
7. [الجداول](#الجداول)
8. [الروابط بملف لارافيل](#الروابط-بملف-لارافيل)
9. [اختبري حالك](#اختبري-حالك)

---

## الصفحات ومين بيشوف شو

| الصفحة                 | الرابط    | ملف الصفحة                                    |
| ---------------------- | --------- | --------------------------------------------- |
| لوحة التحكم (المديرة)  | `/`       | `src/pages/dashboard/ui/ManagerDashboard.tsx` |
| لوحة التحكم (الموظفين) | `/`       | `src/pages/dashboard/ui/StaffDashboard.tsx`   |
| التنبيهات              | `/alerts` | `src/pages/alerts/ui/AlertsPage.tsx`          |

| شو                        | المديرة | الصيدلي           | الكاشير           |
| ------------------------- | ------- | ----------------- | ----------------- |
| لوحة التحكم               | كاملة   | بدون الربح والدرج | بدون الربح والدرج |
| منحنى المبيعات            | ✓       |                   |                   |
| التنبيهات (الصفحة والجرس) | ✓       | ✓                 |                   |

| شو                  | وين                                                 |
| ------------------- | --------------------------------------------------- |
| أنواع التنبيهات     | `src/entities/alert/model/types.ts`                 |
| لوين بيودي كل تنبيه | `src/entities/alert/model/link.ts`                  |
| أنواع لوحة التحكم   | `src/pages/dashboard/model/types.ts`                |
| رد السيرفر الوهمي   | `src/app/mocks/handlers/alerts.ts` و `dashboard.ts` |

---

## التنبيهات: الفكرة

> **التنبيهات بتنحسب كل مرة من البيانات. ما بتنخزن.**

يعني: دوا قرب ينتهي؟ بيطلع تنبيه. سجلتيه تالف؟ التنبيه بيختفي لحاله، بدون ما حد يمسحه. زبون متأخر؟ تنبيه. سدد؟ اختفى.

الشي الوحيد اللي بينخزن: **مين قرا أي تنبيه**. عشان هيك كل تنبيه إله `id` ثابت لنفس الموضوع:

```
expiring:12          ← تنبيه انتهاء للصنف 12
debtLate:7           ← تنبيه تأخير للزبون 7
orderSent:14         ← تنبيه طلب الشراء 14
expiredInStock       ← تنبيه وحيد من نوعه
```

لو المديرة قرت `debtLate:7`، وبكرا انحسب نفس التنبيه، بيضل مقروء. ولو الزبون سدد وبعدين تأخر مرة تانية، نفس `id`، فبيضل مقروء. لو بدك يرجع جديد، ضيفي تاريخ أقدم دين للـ `id`.

**السيرفر ما بيبعت جمل.** بيبعت النوع (`kind`) والأرقام (`params`)، والفرونت بيكتب الجملة بلغة المستخدم، وبيعرف لوين يودي الزر.

---

## أنواع التنبيهات

| النوع            | المجموعة    | الشدة                              | متى بيطلع                                                     |
| ---------------- | ----------- | ---------------------------------- | ------------------------------------------------------------- |
| `expiredInStock` | `expiry`    | `danger`                           | في دفعات فيها كمية وتاريخها فات                               |
| `expiringSoon`   | `expiry`    | `warning` لو ≤ 30 يوم، وإلا `info` | أقرب صنف حالته `soon`                                         |
| `expiringMore`   | `expiry`    | `warning`                          | باقي الأصناف اللي حالتها `soon`                               |
| `lowUrgent`      | `shortage`  | `danger`                           | أكتر صنف ناقص (أقل نسبة كمية ÷ حد أدنى، واللي لسا فيه شي أول) |
| `lowMore`        | `shortage`  | `warning`                          | باقي الناقص                                                   |
| `debtOverLimit`  | `debts`     | `danger`                           | لكل زبون بالآجل دينه فوق حده                                  |
| `debtLate`       | `debts`     | `warning`                          | لكل زبون متأخر (أكتر من 30 يوم) ومش فوق حده                   |
| `orderSent`      | `purchases` | `info`                             | لكل طلب شراء `sent`                                           |
| `orderPartial`   | `purchases` | `info`                             | لكل طلب `partial`                                             |
| `trialEnding`    | `system`    | `neutral`                          | التجربة باقيلها 30 يوم أو أقل                                 |

القيم لكل نوع:

| النوع            | `params`                                                                        | `id`                         |
| ---------------- | ------------------------------------------------------------------------------- | ---------------------------- |
| `expiredInStock` | `batches` (عدد)، `names` (نص: "Brufen · 2، Ventolin · 1")                       | `expiredInStock`             |
| `expiringSoon`   | `productId`، `name`، `days`، `batch` (رمز)، `quantity`                          | `expiring:{productId}`       |
| `expiringMore`   | `count`، `value` (قيمتها بالتكلفة)                                              | `expiringMore`               |
| `lowUrgent`      | `productId`، `name`، `quantity`، `minStock`، `draft` (`{id, number}` أو `null`) | `low:{productId}`            |
| `lowMore`        | `count`                                                                         | `lowMore`                    |
| `debtOverLimit`  | `customerId`، `name`، `debt`، `limit`، `days`                                   | `debtOverLimit:{customerId}` |
| `debtLate`       | `customerId`، `name`، `debt`، `days`                                            | `debtLate:{customerId}`      |
| `orderSent`      | `orderId`، `number`، `supplier`، `items`                                        | `orderSent:{orderId}`        |
| `orderPartial`   | `orderId`، `number`، `supplier`                                                 | `orderPartial:{orderId}`     |
| `trialEnding`    | `days`                                                                          | `trialEnding`                |

`draft` بـ `lowUrgent`: لو الصنف موجود بمسودة طلب شراء، الزر بيصير "كمّل الطلب" بدل "اعمل طلب".

---

## روابط التنبيهات

| الطريقة | الرابط                  | الرد                          |
| ------- | ----------------------- | ----------------------------- |
| GET     | `/api/alerts/summary`   | `{ "data": { "unread": 8 } }` |
| GET     | `/api/alerts`           | القائمة والملخص               |
| POST    | `/api/alerts/{id}/read` | 204                           |
| POST    | `/api/alerts/read-all`  | 204                           |

الملخص هو رقم الجرس. **الفرونت بيطلبه كل دقيقة**، فخليه سريع. لو الحساب تقيل، خزني النتيجة بالكاش دقيقة:

```php
Cache::remember("alerts:{$pharmacyId}", 60, fn () => $alerts->current());
```

ولما حد يقرا، امسحي الكاش.

`{id}` ممكن يكون فيه نقطتين (`expiring:12`). الفرونت بيرمّزه بالرابط (`expiring%3A12`)، ولارافيل بيفكه لحاله.

### القائمة

```json
{
  "data": [
    {
      "id": "expiring:12",
      "kind": "expiringSoon",
      "params": {
        "productId": 12,
        "name": "Augmentin 625mg",
        "days": 26,
        "batch": "AUG-2611",
        "quantity": 3
      },
      "group": "expiry",
      "severity": "warning",
      "at": "2026-11-24T06:00:00Z",
      "read": false,
      "count": 1
    }
  ],
  "summary": {
    "unread": 8,
    "counts": { "all": 19, "expiry": 6, "shortage": 7, "debts": 3, "purchases": 2, "system": 1 },
    "expiryAlertDays": 90
  }
}
```

| الحقل                     | معناه                                          |
| ------------------------- | ---------------------------------------------- |
| `at`                      | متى انحسب. لطلبات الشراء: تاريخ الإرسال        |
| `count`                   | كم شي بيغطي. `expiringMore` عن 5 أصناف ← 5     |
| `summary.counts`          | **مجموع `count`** بكل مجموعة، مش عدد التنبيهات |
| `summary.expiryAlertDays` | من الإعدادات، الشاشة بتكتب "خلال 90 يوم"       |

### بلارافيل

اعملي خدمة وحدة بتحسب التنبيهات، وبتستخدمها التلات روابط:

```php
// app/Services/Alerts.php
class Alerts
{
    public function current(): Collection
    {
        $alerts = collect();
        $add = fn (string $id, string $group, string $severity, int $count, string $kind, array $params, $at = null) =>
            $alerts->push(compact('id', 'kind', 'params', 'group', 'severity', 'count') + ['at' => ($at ?? today()->setTime(8, 0))->toIso8601String()]);

        $settings = auth()->user()->pharmacy->settings;

        // الانتهاء
        $expired = Batch::with('product:id,name,active')->where('quantity', '>', 0)->where('expiry', '<', today())
            ->whereHas('product', fn ($q) => $q->where('active', true))->get();
        if ($expired->isNotEmpty()) {
            $add('expiredInStock', 'expiry', 'danger', $expired->count(), 'expiredInStock', [
                'batches' => $expired->count(),
                'names' => $expired->map(fn ($b) => "{$b->product->name} · ".(float) $b->quantity)->join('، '),
            ]);
        }

        // ... نفس الفكرة لكل نوع، بنفس الترتيب اللي بالجدول فوق.
        // شوفي src/app/mocks/handlers/alerts.ts، الدالة currentAlerts، سطر بسطر.

        $read = AlertRead::pluck('alert_id')->flip();

        return $alerts->map(fn ($a) => $a + ['read' => isset($read[$a['id']])]);
    }
}
```

```php
// app/Http/Controllers/AlertController.php
public function index(Alerts $alerts)
{
    $list = $alerts->current();
    $groups = ['expiry', 'shortage', 'debts', 'purchases', 'system'];
    $counts = collect($groups)->mapWithKeys(fn ($g) => [$g => $list->where('group', $g)->sum('count')]);

    return response()->json([
        'data' => $list->values(),
        'summary' => [
            'unread' => $list->where('read', false)->count(),
            'counts' => $counts + ['all' => $counts->sum()],
            'expiryAlertDays' => auth()->user()->pharmacy->settings->expiry_alert_days,
        ],
    ]);
}

public function read(string $id)
{
    AlertRead::firstOrCreate(['user_id' => auth()->id(), 'alert_id' => $id]);

    return response()->noContent();
}

public function readAll(Alerts $alerts)
{
    foreach ($alerts->current()->pluck('id') as $id) {
        AlertRead::firstOrCreate(['user_id' => auth()->id(), 'alert_id' => $id]);
    }

    return response()->noContent();
}
```

> المقروء لكل **مستخدم**، مش لكل صيدلية. لو المديرة قرت، الصيدلي لسا بيشوفه جديد. السيرفر الوهمي بيخزنه للكل، بس لكل مستخدم أصح.

---

## لوحة التحكم

### شو بيصير بالشاشة

**المديرة:** شريط "بدها انتباه" (منتهي، قرب ينتهي، ناقص، ديون متأخرة)، مبيعات اليوم والربح، النقدي بالدرج، المنحنى، ملاحظات سريعة، وشو صار اليوم.

**الصيدلي والكاشير:** مبيعاتي اليوم، المهام (منتهي لازم ينشال، جرد مفتوح، طلب لازم ينستلم)، قرب ينتهي، والناقص.

**طلب واحد بيجيب كل شي**، والسيرفر بيشيل اللي الدور ما بيشوفه.

```http
GET /api/dashboard
```

الفرونت بيطلبه كل دقيقة.

### الرد

```json
{
  "data": {
    "attention": {
      "expired": { "batches": 2 },
      "expiring": {
        "count": 3,
        "nearest": { "productId": 12, "name": "Augmentin 625mg", "expiry": "2026-12-20" }
      },
      "low": {
        "count": 7,
        "urgent": { "productId": 40, "name": "Ventolin Inhaler", "quantity": 1, "minStock": 5 }
      },
      "lateDebts": { "count": 6, "amount": 1910 }
    },
    "sales": { "today": 1635.5, "invoices": 38, "yesterday": 1420, "profit": 412.3, "margin": 25 },
    "drawer": { "shiftNumber": 41, "expected": 1183.5 },
    "expiredProducts": 2,
    "notes": [
      {
        "kind": "expiring",
        "productId": 12,
        "name": "Augmentin 625mg",
        "expiry": "2026-12-20",
        "quantity": 3
      },
      {
        "kind": "shortage",
        "productId": 40,
        "name": "Ventolin Inhaler",
        "quantity": 1,
        "minStock": 5,
        "draft": null
      },
      {
        "kind": "topSeller",
        "productId": 15,
        "name": "Panadol Extra",
        "quantity": 46,
        "unit": "علبة"
      }
    ],
    "activity": [
      {
        "at": "2026-11-24T10:42:00+02:00",
        "kind": "sale",
        "actor": "محمد",
        "params": { "amount": 65, "number": "INV-001482" }
      }
    ],
    "tasks": {
      "expired": { "batches": 2, "names": "Brufen Syrup و Ventolin Inhaler" },
      "count": { "id": 5, "scope": "مضادات حيوية", "counted": 20, "total": 34, "differences": 2 },
      "receive": { "orderId": 14, "number": "PO-0014", "supplier": "شركة القدس", "items": 6 }
    },
    "expiring": {
      "total": 8,
      "items": [
        { "productId": 12, "name": "Augmentin 625mg", "expiry": "2026-12-20", "quantity": 3 }
      ]
    },
    "low": {
      "total": 7,
      "items": [{ "productId": 40, "name": "Ventolin Inhaler", "quantity": 1, "minStock": 5 }],
      "draft": null
    },
    "mine": { "total": 820, "invoices": 19 },
    "shift": { "number": 41, "cashier": "محمد العطار" }
  }
}
```

### كل جزء من وين

| الجزء                 | الحساب                                                                      |
| --------------------- | --------------------------------------------------------------------------- |
| `attention.expired`   | عدد الدفعات المنتهية اللي فيها كمية                                         |
| `attention.expiring`  | الأصناف اللي أقرب دفعة **صالحة** إلها بتنتهي خلال **30 يوم**، والأقرب منها  |
| `attention.low`       | الأصناف الفعالة اللي كميتها ≤ حدها. `urgent` زي `lowUrgent` بالتنبيهات      |
| `attention.lateDebts` | الزبائن المتأخرين، وعددهم ومجموع ديونهم                                     |
| `sales.today`         | مجموع `total` لفواتير اليوم                                                 |
| `sales.yesterday`     | نفسه لمبارح                                                                 |
| `sales.profit`        | اليوم − تكلفة اليوم. **`null` لغير المديرة**                                |
| `sales.margin`        | الربح ÷ المبيعات × 100، مقرّب. **`null` لغير المديرة** أو لو ما في مبيعات    |
| `drawer`              | الوردية المفتوحة ونقديها المتوقع. **`null` لغير المديرة** أو لو ما في وردية |
| `expiredProducts`     | كم **صنف** (مش دفعة) فيه دفعة منتهية                                        |
| `notes`               | لحد تلاتة: أقرب انتهاء (بنافذة الإعدادات)، أكتر ناقص، والأكتر مبيع هالشهر   |
| `activity`            | آخر 6 أشياء صارت اليوم، الأحدث أول                                          |
| `tasks.expired`       | الدفعات المنتهية وأسماء أصنافها، أو `null`                                  |
| `tasks.count`         | الجرد المفتوح وتقدمه، أو `null`                                             |
| `tasks.receive`       | أول طلب `sent`، أو `null`                                                   |
| `expiring`            | الأصناف بنافذة الإعدادات (`expiryAlertDays`)، أول 3                         |
| `low`                 | الناقص، أول 3، ومسودة الطلب اللي فيها أول واحد                              |
| `mine`                | مبيعات المستخدم المسجل اليوم                                                |
| `shift`               | الوردية المفتوحة، أو `null`                                                 |

> انتبهي لنافذتين مختلفتين: `attention.expiring` بيعد خلال **30 يوم** (الأحمر المستعجل)، و`expiring` تحت بيعد خلال `expiryAlertDays` من الإعدادات (90 يوم مثلاً).

"الأكتر مبيع هالشهر": اجمعي الكمية (ناقص المرتجع) لكل صنف **بنفس الوحدة**، وخدي الأكبر.

### أنواع "شو صار اليوم"

| `kind`            | من وين                                   | `params`           |
| ----------------- | ---------------------------------------- | ------------------ |
| `sale`            | الفواتير                                 | `amount`، `number` |
| `shiftOpened`     | الورديات                                 | `number`، `amount` |
| `damage`          | التالف                                   | `name`             |
| `countStarted`    | الجرد                                    | `scope`            |
| `customerPayment` | تسديدات الزبائن                          | `amount`، `name`   |
| `return`          | المرتجعات                                | `amount`، `number` |
| `expense`         | المصاريف (موجود بالنوع، مش مبني بالوهمي) | حسب ما تقرري       |

`actor`: الاسم الأول.

### بلارافيل

جمعي كل جزء بدالة صغيرة، والكونترولر بيركبهم:

```php
// app/Http/Controllers/DashboardController.php
public function __invoke(Request $request, DashboardData $data)
{
    $user = $request->user();
    $isManager = $user->role === 'manager';

    return response()->json(['data' => [
        'attention' => $data->attention(),
        'sales' => $data->sales($isManager),
        'drawer' => $isManager ? $data->drawer() : null,
        'expiredProducts' => $data->expiredProducts(),
        'notes' => $data->notes(),
        'activity' => $data->activityToday(6),
        'tasks' => $data->tasks(),
        'expiring' => $data->expiring(3),
        'low' => $data->low(3),
        'mine' => $data->salesBy($user),
        'shift' => $data->openShift(),
    ]]);
}
```

```php
// app/Services/DashboardData.php
public function sales(bool $withProfit): array
{
    $today = Invoice::whereDate('created_at', today());
    $total = round((float) (clone $today)->sum('total'), 2);

    $cost = (float) InvoiceItemBatch::whereHas('item.invoice', fn ($q) => $q->whereDate('created_at', today()))
        ->selectRaw('COALESCE(SUM(quantity * cost), 0) as c')->value('c');
    $profit = round($total - $cost, 2);

    return [
        'today' => $total,
        'invoices' => (clone $today)->count(),
        'yesterday' => round((float) Invoice::whereDate('created_at', today()->subDay())->sum('total'), 2),
        'profit' => $withProfit ? $profit : null,
        'margin' => $withProfit && $total > 0 ? (int) round($profit / $total * 100) : null,
    ];
}
```

> الربح هون **قبل** المرتجعات. لو بدك أدق، اطرحي مبالغ مرتجعات اليوم من المبيعات، وتكلفتها من التكلفة.

---

## منحنى المبيعات

للمديرة بس. غيرها: 403.

```http
GET /api/dashboard/sales?days=30
```

`days`: `7` أو `30` أو `90`. غير هيك بيعتبره 7.

```json
{
  "data": [
    { "date": "2026-10-26", "total": 1420 },
    { "date": "2026-10-27", "total": 0 },
    { "date": "2026-11-24", "total": 1635.5 }
  ]
}
```

بالضبط `days` نقطة، الأقدم أول، آخر نقطة اليوم. يوم بدون مبيعات = 0، **ما بينشال**.

```php
public function sales(Request $request)
{
    abort_unless($request->user()->role === 'manager', 403);
    $days = in_array($request->integer('days'), [7, 30, 90]) ? $request->integer('days') : 7;

    $totals = Invoice::where('created_at', '>=', today()->subDays($days - 1))
        ->selectRaw('DATE(created_at) as day, SUM(total) as total')
        ->groupBy('day')
        ->pluck('total', 'day');

    return response()->json(['data' => collect(range($days - 1, 0))->map(function ($back) use ($totals) {
        $date = today()->subDays($back)->toDateString();

        return ['date' => $date, 'total' => round((float) ($totals[$date] ?? 0), 2)];
    })->values()]);
}
```

---

## الجداول

جدول واحد بس، للمقروء:

```php
Schema::create('alert_reads', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->string('alert_id', 60);          // expiring:12
    $table->timestamp('created_at')->useCurrent();

    $table->unique(['user_id', 'alert_id']);
});
```

> هاد الجدول ما فيه `pharmacy_id`، لأنه مربوط بالمستخدم، والمستخدم من صيدلية وحدة. فما بيحتاج الفلتر العام.

---

## الروابط بملف لارافيل

```php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/dashboard', DashboardController::class);
    Route::get('/dashboard/sales', [DashboardController::class, 'sales']);   // المديرة جوا

    Route::middleware('role:manager,pharmacist')->group(function () {
        Route::get('/alerts/summary', [AlertController::class, 'summary']);
        Route::get('/alerts', [AlertController::class, 'index']);
        Route::post('/alerts/read-all', [AlertController::class, 'readAll']);   // قبل {id}
        Route::post('/alerts/{id}/read', [AlertController::class, 'read']);
    });
});
```

> الكاشير ما إله تنبيهات، والجرس مخفي عنده. بس انتبهي: لو الفرونت طلب الملخص للكاشير بالغلط، 403 رح تبين بالكونسول. هاد عادي.

---

## اختبري حالك

- [ ] رقم الجرس = عدد غير المقروء بالصفحة
- [ ] تسجيل دفعة منتهية تالف بيشيل تنبيه `expiredInStock` لحاله
- [ ] قراءة تنبيه وتحديث الصفحة: بيضل مقروء
- [ ] استلام طلب `sent` بيشيل تنبيهه
- [ ] الصيدلي بيشوف `profit: null` و`drawer: null`
- [ ] المنحنى بـ 30 يوم بيرجع 30 نقطة بالضبط، والأيام الفاضية صفر
- [ ] الكاشير بياخد 403 على المنحنى والتنبيهات
- [ ] "مبيعاتي" للكاشير = مجموع فواتيره اليوم بس
