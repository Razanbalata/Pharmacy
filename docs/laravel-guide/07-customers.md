# الوحدة 7: الزبائن والديون

بديل "دفتر الديون" الورقي. كل زبون إله حساب: البيع بالدين بيزيده، والتسديد والمرتجع بينقصوه.

كل الأدوار بتفتح الصفحات. بس الكاشير ما بيعدل زبون، وبيضيف زبون بالاسم والجوال بس.

## المحتويات

1. [الصفحات](#الصفحات)
2. [القاعدة الأهم: الدين محسوب](#القاعدة-الأهم-الدين-محسوب)
3. [عمر الدين](#عمر-الدين)
4. [البحث السريع (نقطة البيع)](#البحث-السريع-نقطة-البيع)
5. [قائمة الزبائن](#قائمة-الزبائن)
6. [إضافة وتعديل زبون](#إضافة-وتعديل-زبون)
7. [كشف حساب الزبون](#كشف-حساب-الزبون)
8. [التسديد](#التسديد)
9. [الجداول](#الجداول)
10. [الروابط بملف لارافيل](#الروابط-بملف-لارافيل)
11. [اختبري حالك](#اختبري-حالك)

---

## الصفحات

| الصفحة        | الرابط           | ملف الصفحة                                                   |
| ------------- | ---------------- | ------------------------------------------------------------ |
| الزبائن       | `/customers`     | `src/pages/customers/list/ui/CustomersPage.tsx`              |
| كشف حساب زبون | `/customers/:id` | `src/pages/customers/statement/ui/CustomerStatementPage.tsx` |

| شو                | وين                                         |
| ----------------- | ------------------------------------------- |
| الأنواع           | `src/entities/customer/model/types.ts`      |
| الطلبات           | `src/entities/customer/api/customer-api.ts` |
| النموذج           | `src/features/customer/manage/`             |
| التسديد           | `src/features/customer/record-payment/`     |
| رد السيرفر الوهمي | `src/app/mocks/handlers/customers.ts`       |

---

## القاعدة الأهم: الدين محسوب

> **دين الزبون مش رقم محفوظ. هو مجموع حسابه.**

كل حركة على الحساب سطر:

| نوع السطر | متى                                   | مدين (بيزيد) | دائن (بينقص) | مين بيكتبه         |
| --------- | ------------------------------------- | ------------ | ------------ | ------------------ |
| `opening` | دين قديم من الدفتر الورقي وقت الإضافة | ✓            |              | هون                |
| `sale`    | بيع فيه جزء آجل                       | ✓            |              | البيع (الوحدة 6)   |
| `payment` | الزبون سدد                            |              | ✓            | هون                |
| `return`  | مرتجع طريقته "من الدين"               |              | ✓            | المرتجع (الوحدة 6) |

```
الدين = مجموع المدين − مجموع الدائن
```

ليش؟ لأنه لو خزنا الدين كرقم، أي نسيان لتحديثه بيخرب الرقم للأبد، وما في طريقة تعرفي من وين جه. مع الحساب، الدين دايماً بيطابق الكشف اللي بيشوفه الزبون.

```php
// app/Models/Customer.php
public function debt(): float
{
    return round((float) $this->entries()->selectRaw('COALESCE(SUM(debit - credit), 0) as d')->value('d'), 2);
}
```

ولقائمة زبائن بطلب واحد:

```php
Customer::query()->withSum('entries as debit_sum', 'debit')->withSum('entries as credit_sum', 'credit')
// الدين = debit_sum - credit_sum
```

---

## عمر الدين

**التسديد بيسدد أقدم دين أول.** فأقدم دين لسا ما انسدد هو اللي بيحدد قديش الزبون متأخر.

```
1 نوفمبر   بيع آجل 100
10 نوفمبر  بيع آجل 50
15 نوفمبر  سدد 120

التسديد غطى الـ 100 كلها، و20 من الـ 50.
أقدم دين مفتوح: 10 نوفمبر.
```

```php
// app/Models/Customer.php
public function oldestDebtAt(): ?Carbon
{
    $entries = $this->entries()->orderBy('created_at')->get();
    $paid = (float) $entries->sum('credit');

    foreach ($entries->where('debit', '>', 0) as $entry) {
        if ($paid + 1e-9 >= $entry->debit) {
            $paid -= $entry->debit;
        } else {
            return $entry->created_at;
        }
    }

    return null;
}
```

| `debtAge` | متى             | اللون بالشاشة |
| --------- | --------------- | ------------- |
| `none`    | ما عليه دين     | ما في         |
| `recent`  | أقل من 14 يوم   | أخضر          |
| `weeks`   | من 14 لـ 30 يوم | أصفر          |
| `late`    | أكتر من 30 يوم  | أحمر          |

`debtDays` = عدد الأيام من أقدم دين مفتوح لليوم.

---

## البحث السريع (نقطة البيع)

بنقطة البيع، الكاشير بيبحث عن الزبون بالاسم أو الجوال، وبيحتاج يعرف دينه وحده قبل البيع بالآجل.

```http
GET /api/customers/options?search=أبو محمد
```

```json
{
  "data": [
    {
      "id": 7,
      "name": "أبو محمد",
      "phone": "0599222333",
      "debt": 180,
      "debtLimit": 300,
      "creditAllowed": true
    }
  ]
}
```

| الحقل           | معناه                                       |
| --------------- | ------------------------------------------- |
| `debt`          | الدين الحالي                                |
| `debtLimit`     | أعلى دين مسموح. فوقه بيحتاج موافقة المديرة  |
| `creditAllowed` | `false`: الزبون بيدفع فوراً دايماً، ما في آجل |

البحث بالاسم أو الجوال (أي جزء). بدون `search` بترجع الكل، بس خلي حد 20 نتيجة.

---

## قائمة الزبائن

### شو بيصير بالشاشة

- بطاقات: مجموع الديون، كم زبون عليه دين، المتأخرين (عدد ومبلغ)، والمحصّل هالشهر.
- تبويبات: الكل، عليهم دين، فوق الحد، متأخرين. كل واحد عليه عدد.
- جدول: الاسم، الجوال، الدين والحد، عمر الدين، وآخر شراء. ولكل زبون زر تذكير على واتساب.

### الطلب

```http
GET /api/customers?filter=withDebt&search=محمد
```

| `filter`    | بيعرض              |
| ----------- | ------------------ |
| `all`       | الكل               |
| `withDebt`  | الدين أكبر من صفر  |
| `overLimit` | الدين أكبر من الحد |
| `late`      | `debtAge = late`   |

### الرد

قائمة بدون صفحات، وملخص:

```json
{
  "data": [
    {
      "id": 7,
      "name": "أبو محمد",
      "phone": "0599222333",
      "debt": 180,
      "debtLimit": 300,
      "creditAllowed": true,
      "notes": "بيسدد أول الشهر",
      "since": "2025-03-14",
      "lastPurchase": "2026-11-20T17:40:00+02:00",
      "oldestDebt": "2026-10-12T11:00:00+02:00",
      "debtDays": 43,
      "debtAge": "late"
    }
  ],
  "summary": {
    "totalDebt": 4820.5,
    "withDebt": 23,
    "late": { "count": 6, "amount": 1910 },
    "collectedThisMonth": 2340,
    "counts": { "all": 112, "withDebt": 23, "overLimit": 4, "late": 6 }
  }
}
```

| الحقل                | كيف بينحسب                                |
| -------------------- | ----------------------------------------- |
| `since`              | تاريخ إضافة الزبون                        |
| `lastPurchase`       | آخر فاتورة إله، أو آخر سطر `sale` بحسابه  |
| `oldestDebt`         | [فوق](#عمر-الدين). `null` إذا ما عليه دين |
| `collectedThisMonth` | مجموع سطور `payment` هالشهر لكل الزبائن   |
| `counts`             | لكل الزبائن، **بدون** البحث               |

**الترتيب:** الأقدم دين أول (`debtDays` تنازلي)، بعدين الأكبر دين، بعدين بالاسم.

> عن الأداء: الحسابات هون (الدين، عمر الدين) لكل زبون. لصيدلية فيها كم مية زبون، احسبيهم بـ PHP بعد ما تجيبي السطور مرة وحدة. لو صاروا آلاف، خزني `debt` و`oldest_debt_at` كأرقام محفوظة وحدثيهم بنفس العملية اللي بتكتب السطر.

---

## إضافة وتعديل زبون

### الطلب

```http
POST /api/customers
PUT  /api/customers/7
```

```json
{
  "name": "أبو محمد",
  "phone": "0599222333",
  "creditAllowed": true,
  "debtLimit": 300,
  "openingDebt": 120,
  "notes": "بيسدد أول الشهر"
}
```

`openingDebt` بالإضافة بس. بالتعديل ما بينبعت.

### القواعد

| الفحص                                           | الخطأ                         |
| ----------------------------------------------- | ----------------------------- |
| `name` مطلوب                                    | `name` ← `required`           |
| `phone` فاضي، أو جوال، أو أرضي                  | `phone` ← `invalid`           |
| لو `creditAllowed`، الجوال مطلوب (عشان التذكير) | `phone` ← `requiredForCredit` |
| الجوال فريد بالصيدلية                           | `phone` ← `taken`             |
| `debtLimit` صفر أو أكتر                         | `debtLimit` ← `invalid`       |
| `openingDebt` صفر أو أكتر                       | `openingDebt` ← `invalid`     |

### قواعد الكاشير

| الفعل | الكاشير                                                                             |
| ----- | ----------------------------------------------------------------------------------- |
| إضافة | مسموح. بس `debtLimit` بياخد `defaultDebtLimit` من الإعدادات، و`openingDebt` بيتجاهل |
| تعديل | 403                                                                                 |

الكاشير بيضيف زبون من نقطة البيع بسرعة، بالاسم والجوال. بس الحد والدين القديم شغل المديرة.

### الرد

201 أو 200، الزبون بشكل القائمة.

### بلارافيل

```php
// app/Http/Requests/CustomerRequest.php
protected function prepareForValidation(): void
{
    $this->merge(['phone' => $this->input('phone') ? normalize_phone($this->input('phone')) : '']);
}

public function rules(): array
{
    $id = $this->route('customer')?->id;

    return [
        'name' => ['required', 'string', 'max:120'],
        'phone' => [
            'nullable', 'regex:/^(05[69]\d{7}|0[2489]\d{7})$/',
            Rule::requiredIf($this->boolean('creditAllowed')),
            Rule::unique('customers', 'phone')->where('pharmacy_id', $this->user()->pharmacy_id)->ignore($id),
        ],
        'creditAllowed' => ['required', 'boolean'],
        'debtLimit' => ['required', 'numeric', 'min:0'],
        'openingDebt' => ['sometimes', 'numeric', 'min:0'],
        'notes' => ['present', 'nullable', 'string', 'max:500'],
    ];
}

public function messages(): array
{
    return [
        'name.required' => 'required',
        'phone.regex' => 'invalid',
        'phone.required' => 'requiredForCredit',
        'phone.unique' => 'taken',
        'debtLimit.*' => 'invalid',
        'openingDebt.*' => 'invalid',
    ];
}
```

```php
// app/Http/Controllers/CustomerController.php
public function store(CustomerRequest $request)
{
    $user = $request->user();
    $isCashier = $user->role === 'cashier';

    $customer = DB::transaction(function () use ($request, $user, $isCashier) {
        $customer = Customer::create([
            'name' => trim($request->input('name')),
            'phone' => $request->input('phone'),
            'credit_allowed' => $request->boolean('creditAllowed'),
            'debt_limit' => $isCashier ? $user->pharmacy->settings->default_debt_limit : $request->input('debtLimit'),
            'notes' => trim((string) $request->input('notes')),
        ]);

        $opening = (float) $request->input('openingDebt', 0);
        if ($opening > 0 && ! $isCashier) {
            $customer->entries()->create([
                'kind' => 'opening', 'reference' => '', 'debit' => round($opening, 2), 'credit' => 0, 'user_id' => $user->id,
            ]);
        }

        return $customer;
    });

    return (new CustomerResource($customer))->response()->setStatusCode(201);
}

public function update(CustomerRequest $request, Customer $customer)
{
    abort_if($request->user()->role === 'cashier', 403);

    $customer->update([
        'name' => trim($request->input('name')),
        'phone' => $request->input('phone'),
        'credit_allowed' => $request->boolean('creditAllowed'),
        'debt_limit' => $request->input('debtLimit'),
        'notes' => trim((string) $request->input('notes')),
    ]);

    return new CustomerResource($customer);
}
```

---

## كشف حساب الزبون

### شو بيصير بالشاشة

- رأس: الاسم، الجوال، الدين، الحد، وعمر الدين. أزرار: تسديد، تذكير واتساب، تعديل.
- مشتريات هالشهر، وآخر أصناف اشتراها (عشان تذكريه قبل ما يخلص دواه).
- جدول الكشف لفترة (شهر، 3 شهور، سنة). سطر الفاتورة بينفتح.

### الطلب

```http
GET /api/customers/7/statement?period=quarter
```

| `period`  | من متى                                     |
| --------- | ------------------------------------------ |
| `month`   | أول الشهر الحالي                           |
| `quarter` | أول الشهر قبل شهرين (يعني تلات شهور كاملة) |
| `year`    | أول السنة                                  |

> لاحظي: `quarter` هون غير الموردين (هناك 90 يوم لورا). هون تلات شهور تقويمية كاملة. لو بدك توحديهم، غيري بالسيرفر الوهمي كمان.

### الرد

```json
{
  "data": {
    "customer": { "...": "شكل القائمة" },
    "period": "quarter",
    "from": "2026-09-01",
    "openingBalance": 40,
    "lines": [
      {
        "id": 301,
        "at": "2026-10-12T11:00:00+02:00",
        "kind": "sale",
        "reference": "INV-001204",
        "invoiceId": 1204,
        "method": null,
        "actor": "محمد",
        "items": 3,
        "debit": 140,
        "credit": 0,
        "balance": 180
      },
      {
        "id": 322,
        "at": "2026-11-02T09:20:00+02:00",
        "kind": "payment",
        "reference": "R-0041",
        "invoiceId": null,
        "method": "cash",
        "actor": "رزان",
        "items": null,
        "debit": 0,
        "credit": 50,
        "balance": 130
      }
    ],
    "purchasesThisMonth": 210,
    "recent": [
      {
        "productId": 40,
        "name": "Ventolin Inhaler 100mcg",
        "lastBought": "2026-11-20T17:40:00+02:00"
      }
    ]
  }
}
```

| الحقل                | معناه                                                  |
| -------------------- | ------------------------------------------------------ |
| `openingBalance`     | الدين قبل `from`                                       |
| `lines.*.balance`    | الدين الجاري بعد السطر                                 |
| `lines.*.invoiceId`  | للفاتورة: رقمها لتنفتح. `null` لو الدين قديم من الدفتر |
| `lines.*.items`      | للبيع: عدد الأصناف. غير هيك `null`                     |
| `lines.*.actor`      | الاسم الأول لمين عمل السطر                             |
| `purchasesThisMonth` | **كل** مشترياته هالشهر، نقدي وآجل                      |
| `recent`             | آخر 5 أصناف مختلفة اشتراها، الأحدث أول                 |

> `purchasesThisMonth`: خدي مجموع `total` لفواتيره هالشهر. السطور `sale` اللي إلها فاتورة لا تعديها مرة تانية.

---

## التسديد

### شو بيصير بالشاشة

لوحة جانبية: المبلغ (أزرار سريعة: كل الدين، نصه)، والطريقة (نقدي أو بنكي). بعد الحفظ بينطبع وصل، وفي زر يبعت الوصل على واتساب.

### الطلب

```http
POST /api/customers/7/payments
```

```json
{ "amount": 50, "method": "cash" }
```

| الفحص                      | الخطأ                 |
| -------------------------- | --------------------- |
| المبلغ أكبر من صفر         | `amount` ← `positive` |
| المبلغ مش أكتر من الدين    | `amount` ← `tooMuch`  |
| `method`: `cash` أو `bank` |                       |

### الرد

201:

```json
{
  "data": {
    "receipt": "R-0042",
    "amount": 50,
    "balance": 130,
    "at": "2026-11-24T10:55:00+02:00"
  }
}
```

`balance` الدين بعد التسديد.

### شو بيصير جوا السيرفر

1. سطر `payment` دائن.
2. رقم الوصل: `R-` وبعده الرقم بـ 4 خانات.
3. لو `cash`: اربطيه بالوردية المفتوحة. هيك بيزيد النقدي المتوقع بالدرج (الوحدة 6).

```php
public function store(Request $request, Customer $customer)
{
    $debt = $customer->debt();
    $data = $request->validate([
        'amount' => ['required', 'numeric', 'gt:0', 'lte:'.($debt + 0.001)],
        'method' => ['required', 'in:cash,bank'],
    ], ['amount.gt' => 'positive', 'amount.lte' => 'tooMuch']);

    $entry = $customer->entries()->create([
        'kind' => 'payment',
        'method' => $data['method'],
        'reference' => CustomerEntry::nextReceipt(),
        'debit' => 0,
        'credit' => round($data['amount'], 2),
        'shift_id' => $data['method'] === 'cash' ? Shift::where('status', 'open')->value('id') : null,
        'user_id' => $request->user()->id,
    ]);

    return response()->json(['data' => [
        'receipt' => $entry->reference,
        'amount' => (float) $entry->credit,
        'balance' => $customer->debt(),
        'at' => $entry->created_at->toIso8601String(),
    ]], 201);
}
```

---

## الجداول

```php
Schema::create('customers', function (Blueprint $table) {
    $table->id();
    $table->foreignId('pharmacy_id')->constrained()->cascadeOnDelete();
    $table->string('name');
    $table->string('phone', 10)->default('');
    $table->boolean('credit_allowed')->default(false);
    $table->decimal('debt_limit', 12, 2)->default(0);
    $table->text('notes')->nullable();
    $table->timestamps();                          // created_at هو since

    $table->index(['pharmacy_id', 'phone']);
});

Schema::create('customer_entries', function (Blueprint $table) {
    $table->id();
    $table->foreignId('pharmacy_id')->constrained()->cascadeOnDelete();
    $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
    $table->enum('kind', ['opening', 'sale', 'payment', 'return']);
    $table->string('reference', 20)->default('');  // INV-… أو R-… أو RT-…
    $table->foreignId('invoice_id')->nullable()->constrained()->nullOnDelete();
    $table->enum('method', ['cash', 'bank'])->nullable();
    $table->unsignedSmallInteger('items')->nullable();
    $table->decimal('debit', 12, 2)->default(0);
    $table->decimal('credit', 12, 2)->default(0);
    $table->foreignId('shift_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignId('user_id')->constrained();
    $table->timestamps();

    $table->index(['customer_id', 'created_at']);
});
```

> الجوال الفاضي `''` مش `null`، والفحص الفريد بيتجاهله لأنه `nullable` بيوقف القواعد لما القيمة فاضية. بس الفهرس `unique` بالقاعدة نفسها ما بيقبل أكتر من `''`. فخلي الفهرس عادي (`index`) والفحص الفريد بالكود.

الريسورس:

```php
// app/Http/Resources/CustomerResource.php
public function toArray(Request $request): array
{
    $debt = $this->debt();
    $oldest = $debt > 0 ? $this->oldestDebtAt() : null;
    $days = $oldest ? (int) $oldest->startOfDay()->diffInDays(today()) : 0;

    return [
        'id' => $this->id,
        'name' => $this->name,
        'phone' => $this->phone,
        'debt' => $debt,
        'debtLimit' => (float) $this->debt_limit,
        'creditAllowed' => $this->credit_allowed,
        'notes' => (string) $this->notes,
        'since' => $this->created_at->toDateString(),
        'lastPurchase' => $this->invoices()->max('created_at')
            ? Carbon::parse($this->invoices()->max('created_at'))->toIso8601String()
            : null,
        'oldestDebt' => $oldest?->toIso8601String(),
        'debtDays' => $days,
        'debtAge' => match (true) {
            $debt <= 0 => 'none',
            $days > 30 => 'late',
            $days >= 14 => 'weeks',
            default => 'recent',
        },
    ];
}
```

---

## الروابط بملف لارافيل

```php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/customers/options', [CustomerController::class, 'options']);   // قبل {customer}
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::put('/customers/{customer}', [CustomerController::class, 'update']);  // الكاشير 403 جوا
    Route::get('/customers/{customer}/statement', CustomerStatementController::class);
    Route::post('/customers/{customer}/payments', [CustomerPaymentController::class, 'store']);
});
```

---

## اختبري حالك

- [ ] بيع آجل بيزيد دين الزبون بالقائمة وبالكشف بنفس الرقم
- [ ] تسديد بيقلل الدين، والوصل رقمه بيزيد
- [ ] تسديد نقدي بيزيد النقدي المتوقع بالوردية
- [ ] زبون بدين من 40 يوم بيطلع "متأخر" وأول القائمة
- [ ] بعد تسديد أقدم دين، عمر الدين بيصير من الدين اللي بعده
- [ ] زبون بالآجل بدون جوال بيعرض `requiredForCredit`
- [ ] الكاشير بيضيف زبون، والحد بيطلع حد الإعدادات مهما بعت
- [ ] الكاشير ما بيقدر يعدل (403)
- [ ] آخر سطر بالكشف رصيده = الدين بالقائمة
