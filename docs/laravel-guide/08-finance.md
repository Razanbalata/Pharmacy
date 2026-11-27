# الوحدة 8: سجل الورديات والمصاريف

صفحتين للمديرة بس: وين راحت الفلوس من الدرج، وشو المصاريف اللي بتطلع من الصيدلية.

## المحتويات

1. [الصفحات](#الصفحات)
2. [سجل الورديات](#سجل-الورديات)
3. [المصاريف](#المصاريف)
4. [الجداول](#الجداول)
5. [الروابط بملف لارافيل](#الروابط-بملف-لارافيل)
6. [اختبري حالك](#اختبري-حالك)

---

## الصفحات

| الصفحة       | الرابط              | ملف الصفحة                                       |
| ------------ | ------------------- | ------------------------------------------------ |
| سجل الورديات | `/finance/shifts`   | `src/pages/finance/shifts/ui/ShiftsPage.tsx`     |
| المصاريف     | `/finance/expenses` | `src/pages/finance/expenses/ui/ExpensesPage.tsx` |

| شو                | وين                                   |
| ----------------- | ------------------------------------- |
| أنواع الوردية     | `src/entities/shift/model/types.ts`   |
| أنواع المصروف     | `src/entities/expense/model/types.ts` |
| رد السيرفر الوهمي | `src/app/mocks/handlers/finance.ts`   |

---

## سجل الورديات

### شو بيصير بالشاشة

- بطاقات: الوردية المفتوحة هلق (رقمها والكاشير)، عدد الورديات بالفترة، مجموع الفروقات، وعدد الورديات اللي فيها عجز.
- فلاتر: الفترة (اليوم، الأسبوع، الشهر)، الكاشير، و"اللي فيها فرق بس".
- جدول: الرقم، الكاشير، الفتح والإغلاق، المبيع، النقدي المتوقع، المعدود، الفرق، والملاحظة.

### الطلب

```http
GET /api/shifts?period=month&cashier=3&difference=1
```

| المعامل      | القيم                                        | إذا ما انبعت |
| ------------ | -------------------------------------------- | ------------ |
| `period`     | `today` `week` (آخر 7 أيام) `month` (هالشهر) | `week`       |
| `cashier`    | رقم الموظف                                   | الكل         |
| `difference` | `1`: المسكرة اللي فرقها مش صفر بس            | الكل         |

الفترة بتنحسب من **وقت الفتح**.

### الرد

```json
{
  "data": [
    {
      "id": 41,
      "number": 41,
      "cashier": { "id": 3, "name": "محمد العطار" },
      "openedAt": "2026-11-24T08:00:00+02:00",
      "closedAt": "2026-11-24T16:05:00+02:00",
      "openingCash": 250,
      "status": "closed",
      "sales": 1635.5,
      "expectedCash": 1183.5,
      "countedCash": 1180,
      "difference": -3.5,
      "note": "نقص 3.5 فكة"
    }
  ],
  "summary": {
    "open": { "number": 42, "cashier": "سارة" },
    "count": 18,
    "totalDifference": -12.5,
    "shortCount": 3
  }
}
```

| الحقل                     | معناه                                                     |
| ------------------------- | --------------------------------------------------------- |
| `sales`                   | مجموع `total` لكل فواتير الوردية (نقدي وبنكي وآجل)        |
| `expectedCash`            | **المحفوظ** وقت الإغلاق. `null` والوردية مفتوحة           |
| `countedCash`             | المعدود. `null` والوردية مفتوحة                           |
| `difference`              | المعدود − المتوقع. `null` والوردية مفتوحة                 |
| `summary.open`            | الوردية المفتوحة هلق، **بغض النظر** عن الفلاتر            |
| `summary.count`           | الورديات بالفترة والكاشير، **قبل** فلتر "فيها فرق"        |
| `summary.totalDifference` | مجموع الفروقات للمسكرة بالفترة. العجز والزيادة بيلغوا بعض |
| `summary.shortCount`      | كم وردية فيها عجز (فرق سالب)                              |

الترتيب: الأحدث أول (بالرقم تنازلي).

### بلارافيل

```php
// app/Http/Controllers/ShiftLogController.php
public function __invoke(Request $request)
{
    $from = match ($request->query('period', 'week')) {
        'today' => today(),
        'month' => today()->startOfMonth(),
        default => today()->subDays(6),
    };

    $shifts = Shift::with('user:id,name')
        ->withSum('invoices as sales', 'total')
        ->where('opened_at', '>=', $from)
        ->when($request->query('cashier'), fn ($q, $id) => $q->where('user_id', $id))
        ->orderByDesc('number')
        ->get();

    $closed = $shifts->where('status', 'closed');
    $difference = fn (Shift $s) => round($s->counted_cash - $s->expected_cash, 2);
    $list = $request->boolean('difference') ? $closed->filter(fn ($s) => $difference($s) != 0) : $shifts;
    $open = Shift::with('user:id,name')->where('status', 'open')->first();

    return response()->json([
        'data' => ShiftRecordResource::collection($list->values()),
        'summary' => [
            'open' => $open ? ['number' => $open->number, 'cashier' => $open->user->name] : null,
            'count' => $shifts->count(),
            'totalDifference' => round($closed->sum($difference), 2),
            'shortCount' => $closed->filter(fn ($s) => $difference($s) < 0)->count(),
        ],
    ]);
}
```

```php
// app/Http/Resources/ShiftRecordResource.php
public function toArray(Request $request): array
{
    $closed = $this->status === 'closed';

    return [
        'id' => $this->id,
        'number' => $this->number,
        'cashier' => ['id' => $this->user->id, 'name' => $this->user->name],
        'openedAt' => $this->opened_at->toIso8601String(),
        'closedAt' => $this->closed_at?->toIso8601String(),
        'openingCash' => (float) $this->opening_cash,
        'status' => $this->status,
        'sales' => round((float) $this->sales, 2),
        'expectedCash' => $closed ? (float) $this->expected_cash : null,
        'countedCash' => $closed ? (float) $this->counted_cash : null,
        'difference' => $closed ? round($this->counted_cash - $this->expected_cash, 2) : null,
        'note' => (string) $this->note,
    ];
}
```

> ليش `expectedCash` محفوظ ومش محسوب؟ لأنه لو حد سجّل مصروف بتاريخ قديم، أو تسديد من الدرج بعد الإغلاق، الحساب من جديد بيعطي رقم غير اللي شافه الكاشير وقت عدّ الدرج. والسجل لازم يعرض اللي صار فعلاً.

---

## المصاريف

### شو بيصير بالشاشة

- بطاقات: مصاريف الشهر، ومقارنة بالشهر اللي قبله.
- رسم: المصاريف حسب النوع.
- اختيار الشهر: هالشهر أو الماضي.
- جدول: التاريخ، النوع، المبلغ، المصدر (الدرج أو برا)، الوردية، مين، والملاحظة.
- زر "مصروف جديد": النوع، المبلغ، التاريخ، المصدر، ملاحظة، و"شهري".

### القائمة

```http
GET /api/expenses?month=last
```

`month`: `this` (هالشهر، وهو الأصل) أو `last` (الشهر الماضي).

```json
{
  "data": [
    {
      "id": 55,
      "date": "2026-11-23",
      "category": "generatorFuel",
      "amount": 45,
      "source": "drawer",
      "shiftNumber": 41,
      "actor": "رزان",
      "note": "10 لتر",
      "monthly": false
    }
  ],
  "summary": {
    "month": "2026-11",
    "total": 2380,
    "previous": 2150,
    "byCategory": [
      { "category": "rent", "total": 1200 },
      { "category": "generatorSubscription", "total": 600 }
    ]
  }
}
```

| الحقل                | معناه                                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `category`           | `rent` `generatorSubscription` `generatorFuel` `maintenance` `supplies` `transport` `internet` `salaries` `other` |
| `source`             | `drawer` (نقدي من درج الوردية) أو `outside` (من برا الدرج)                                                        |
| `shiftNumber`        | للدرج: رقم الوردية. غير هيك `null`                                                                                |
| `monthly`            | مصروف بيتكرر كل شهر (الإيجار مثلاً)                                                                                |
| `summary.month`      | الشهر المعروض `YYYY-MM`                                                                                           |
| `summary.previous`   | مجموع الشهر اللي قبل المعروض                                                                                      |
| `summary.byCategory` | الأنواع اللي فيها مبلغ بس، من الأكبر للأصغر                                                                       |

الترتيب: الأحدث تاريخ أول.

### الإضافة

```http
POST /api/expenses
```

```json
{
  "category": "generatorFuel",
  "amount": 45,
  "date": "2026-11-24",
  "source": "drawer",
  "note": "10 لتر",
  "monthly": false
}
```

| الفحص                                   | الخطأ                  |
| --------------------------------------- | ---------------------- |
| المستخدم مديرة                          | 403                    |
| النوع من القائمة                        | `category` ← `invalid` |
| المبلغ أكبر من صفر                      | `amount` ← `positive`  |
| التاريخ بشكل `YYYY-MM-DD` ومش بالمستقبل | `date` ← `invalid`     |
| لو النوع `other`، الملاحظة مطلوبة       | `note` ← `required`    |
| لو المصدر `drawer`، لازم وردية مفتوحة   | `source` ← `noShift`   |

قواعد خاصة بالدرج:

| القاعدة                            | ليش                                    |
| ---------------------------------- | -------------------------------------- |
| التاريخ بيصير **اليوم** مهما انبعت | الفلوس طلعت من الدرج هلق               |
| بينربط بالوردية المفتوحة           | عشان ينقص من النقدي المتوقع (الوحدة 6) |

### الرد

201، المصروف بشكل القائمة.

### بلارافيل

```php
// app/Http/Controllers/ExpenseController.php
public function index(Request $request)
{
    $month = $request->query('month') === 'last' ? today()->subMonthNoOverflow()->startOfMonth() : today()->startOfMonth();
    $previous = $month->copy()->subMonthNoOverflow();

    $list = Expense::with('user:id,name')
        ->whereBetween('date', [$month, $month->copy()->endOfMonth()])
        ->orderByDesc('date')->orderByDesc('id')
        ->get();

    return response()->json([
        'data' => ExpenseResource::collection($list),
        'summary' => [
            'month' => $month->format('Y-m'),
            'total' => round((float) $list->sum('amount'), 2),
            'previous' => round((float) Expense::whereBetween('date', [$previous, $previous->copy()->endOfMonth()])->sum('amount'), 2),
            'byCategory' => $list->groupBy('category')
                ->map(fn ($items, $category) => ['category' => $category, 'total' => round((float) $items->sum('amount'), 2)])
                ->sortByDesc('total')->values(),
        ],
    ]);
}

public function store(Request $request)
{
    $data = $request->validate([
        'category' => ['required', 'in:rent,generatorSubscription,generatorFuel,maintenance,supplies,transport,internet,salaries,other'],
        'amount' => ['required', 'numeric', 'gt:0'],
        'date' => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],
        'source' => ['required', 'in:drawer,outside'],
        'note' => ['required_if:category,other', 'nullable', 'string', 'max:200'],
        'monthly' => ['required', 'boolean'],
    ], [
        'category.*' => 'invalid',
        'amount.*' => 'positive',
        'date.*' => 'invalid',
        'note.required_if' => 'required',
    ]);

    $shift = null;
    if ($data['source'] === 'drawer') {
        $shift = Shift::where('status', 'open')->first();
        if (! $shift) {
            throw ValidationException::withMessages(['source' => 'noShift']);
        }
    }

    $expense = Expense::create([
        'date' => $shift ? today() : $data['date'],
        'category' => $data['category'],
        'amount' => round($data['amount'], 2),
        'source' => $data['source'],
        'shift_id' => $shift?->id,
        'note' => trim((string) ($data['note'] ?? '')),
        'monthly' => $data['monthly'],
        'user_id' => $request->user()->id,
    ]);

    return (new ExpenseResource($expense))->response()->setStatusCode(201);
}
```

> `subMonthNoOverflow` مش `subMonth`: يوم 31 مارس ناقص شهر بـ `subMonth` بيطلع 3 مارس (لأنه ما في 31 فبراير). `NoOverflow` بيطلع آخر فبراير صح.

---

## الجداول

جدول `shifts` بالوحدة 6.

```php
Schema::create('expenses', function (Blueprint $table) {
    $table->id();
    $table->foreignId('pharmacy_id')->constrained()->cascadeOnDelete();
    $table->date('date');
    $table->enum('category', ['rent', 'generatorSubscription', 'generatorFuel', 'maintenance', 'supplies', 'transport', 'internet', 'salaries', 'other']);
    $table->decimal('amount', 12, 2);
    $table->enum('source', ['drawer', 'outside']);
    $table->foreignId('shift_id')->nullable()->constrained()->nullOnDelete();
    $table->string('note', 200)->default('');
    $table->boolean('monthly')->default(false);
    $table->foreignId('user_id')->constrained();
    $table->timestamps();

    $table->index(['pharmacy_id', 'date']);
});
```

> `monthly` حالياً علامة بس. لو بدك المصاريف الشهرية تنضاف لحالها كل شهر، اعملي مهمة مجدولة أول كل شهر بتنسخ آخر مصروف `monthly` من كل نوع.

---

## الروابط بملف لارافيل

```php
Route::middleware(['auth:sanctum', 'role:manager'])->group(function () {
    Route::get('/shifts', ShiftLogController::class);
    Route::get('/expenses', [ExpenseController::class, 'index']);
    Route::post('/expenses', [ExpenseController::class, 'store']);
});
```

> `GET /shifts` (السجل) غير `GET /shifts/current` (الوردية الحالية، للكل، بالوحدة 6). انتبهي إنه ما يتعارضوا بالترتيب: `/shifts/current` لازم ييجي قبل أي رابط فيه `{shift}`.

---

## اختبري حالك

- [ ] الوردية المفتوحة بتطلع بالبطاقة حتى لو الفلتر "اليوم" وهي فتحت مبارح
- [ ] الوردية المسكرة بتعرض نفس الفرق اللي طلع للكاشير وقت الإغلاق
- [ ] "فيها فرق بس" بيخبي المفتوحة واللي فرقها صفر، والعدد فوق ما بيتغير
- [ ] مصروف من الدرج بدون وردية بيعرض `noShift` تحت المصدر
- [ ] مصروف من الدرج بتاريخ مبارح بينحفظ بتاريخ اليوم
- [ ] مصروف من الدرج بينقص النقدي المتوقع بملخص الوردية
- [ ] نوع "أخرى" بدون ملاحظة بيعرض الخطأ تحت الملاحظة
- [ ] الصيدلي بياخد 403 على الصفحتين
