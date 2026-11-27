# الوحدة 5: المخزون (الحركات والجرد والتالف)

المخزون نفسه هو الدفعات (الوحدة 3). هالوحدة عن تلات أشياء حواليه: سجل كل تغيير صار، الجرد لما العد بالرف بيختلف عن النظام، والتالف لما دوا بيطلع بدون بيع.

المديرة والصيدلي بيفتحوا الصفحات. اعتماد الجرد للمديرة، أو للصيدلي اللي معه `approveCounts`.

## المحتويات

1. [الصفحات](#الصفحات)
2. [القاعدة الذهبية](#القاعدة-الذهبية)
3. [سجل الحركات](#سجل-الحركات)
4. [التالف](#التالف)
5. [الجرد](#الجرد)
6. [الجداول](#الجداول)
7. [الروابط بملف لارافيل](#الروابط-بملف-لارافيل)
8. [اختبري حالك](#اختبري-حالك)

---

## الصفحات

| الصفحة      | الرابط             | ملف الصفحة                                       |
| ----------- | ------------------ | ------------------------------------------------ |
| سجل الحركات | `/stock/movements` | `src/pages/stock/movements/ui/MovementsPage.tsx` |
| الجرد       | `/stock/counts`    | `src/pages/stock/counts/ui/CountsPage.tsx`       |
| التالف      | `/stock/damage`    | `src/pages/stock/damage/ui/DamagePage.tsx`       |

| شو                | وين                                          |
| ----------------- | -------------------------------------------- |
| أنواع الحركات     | `src/entities/stock-movement/model/types.ts` |
| أنواع الجرد       | `src/entities/stock-count/model/types.ts`    |
| أنواع التالف      | `src/entities/damage-record/model/types.ts`  |
| رد السيرفر الوهمي | `src/app/mocks/handlers/stock.ts`            |

---

## القاعدة الذهبية

> **ولا مرة بتتغير كمية دفعة بدون ما تنكتب حركة.**

الحركات سجل بس، ما بتتعدل ولا بتنحذف. لو صار غلط، بنصلحه بحركة جديدة (جرد مثلاً). هيك دايماً بتقدري تعرفي ليش الكمية هيك.

| الحركة     | مين بيكتبها                   | الإشارة | المرجع      |
| ---------- | ----------------------------- | ------- | ----------- |
| `opening`  | صنف جديد برصيد أول (الوحدة 3) | +       | ما في       |
| `import`   | الاستيراد (الوحدة 3)          | +       | `IMP-9`     |
| `purchase` | الاستلام (الوحدة 4)           | +       | `PO-0014`   |
| `sale`     | البيع (الوحدة 6)              | −       | `INV-01482` |
| `return`   | المرتجع (الوحدة 6)            | +       | `INV-01482` |
| `damage`   | التالف (هون)                  | −       | ما في       |
| `count`    | اعتماد الجرد (هون)            | + أو −  | `جرد 24/11` |

---

## سجل الحركات

### شو بيصير بالشاشة

- تلات بطاقات فوق: كم دخل، كم طلع، وكم خسارة (تالف وجرد بالسالب).
- فلاتر: الفترة (يوم، أسبوع، شهر، 3 شهور)، الموظف، والنوع.
- جدول: الوقت، الصنف، الدفعة، النوع، الكمية بإشارتها، الرصيد بعدها، المرجع (بينفتح)، ومين.

### الطلب

```http
GET /api/stock/movements?days=7&actor=3&kind=sale
```

| المعامل | القيم                                                          | إذا ما انبعت |
| ------- | -------------------------------------------------------------- | ------------ |
| `days`  | `1` `7` `30` `90`                                              | 30           |
| `actor` | رقم الموظف                                                     | الكل         |
| `kind`  | `sale` `purchase` `return` `count` `damage` `opening` `import` | الكل         |

### الرد

```json
{
  "data": [
    {
      "id": 88213,
      "at": "2026-11-24T09:15:00+02:00",
      "product": { "id": 12, "name": "Augmentin 625mg 14 Tablets", "unit": "علبة" },
      "batch": "AUG-2611",
      "kind": "sale",
      "delta": -1,
      "balanceAfter": 3,
      "reference": "INV-01482",
      "link": { "type": "invoice", "id": 1482 },
      "actor": "محمد العطار"
    }
  ],
  "totals": { "in": 120, "out": 86.5, "losses": 4 }
}
```

| الحقل           | معناه                                                                           |
| --------------- | ------------------------------------------------------------------------------- |
| `delta`         | بأول وحدة. موجب دخول، سالب خروج                                                 |
| `balanceAfter`  | كمية **الدفعة** بعد الحركة مباشرة                                               |
| `link`          | عشان المرجع ينفتح. `type`: `invoice` `order` `count` `damage` `return` `import` |
| `totals.in`     | مجموع الموجب                                                                    |
| `totals.out`    | مجموع السالب، كرقم موجب                                                         |
| `totals.losses` | مجموع السالب من `damage` و`count` بس                                            |

> `totals` بتنحسب بفلتر الموظف والفترة، **بس مش بفلتر النوع**. هيك لما تختاري "بيع"، البطاقات بتضل تعرض الصورة الكاملة.

`link` لوين بيودي بالفرونت:

| `type`    | الصفحة                 |
| --------- | ---------------------- |
| `invoice` | `/sales/invoices/{id}` |
| `order`   | `/purchases/{id}`      |
| `count`   | `/stock/counts`        |
| `damage`  | `/stock/damage`        |
| `return`  | `/sales/returns`       |
| `import`  | ما بيفتح شي حالياً      |

### بلارافيل

```php
public function index(Request $request)
{
    $since = now()->subDays($request->integer('days', 30));

    $base = StockMovement::query()
        ->where('created_at', '>=', $since)
        ->when($request->query('actor'), fn ($q, $id) => $q->where('user_id', $id));

    $totals = (clone $base)->selectRaw("
        COALESCE(SUM(CASE WHEN delta > 0 THEN delta END), 0) as in_total,
        COALESCE(-SUM(CASE WHEN delta < 0 THEN delta END), 0) as out_total,
        COALESCE(-SUM(CASE WHEN delta < 0 AND kind IN ('damage','count') THEN delta END), 0) as losses
    ")->first();

    $list = $base
        ->when($request->query('kind'), fn ($q, $kind) => $q->where('kind', $kind))
        ->with(['product:id,name', 'product.firstUnit', 'batch:id,code', 'user:id,name'])
        ->latest()
        ->limit(1000)
        ->get();

    return response()->json([
        'data' => MovementResource::collection($list),
        'totals' => [
            'in' => (float) $totals->in_total,
            'out' => (float) $totals->out_total,
            'losses' => (float) $totals->losses,
        ],
    ]);
}
```

```php
// app/Http/Resources/MovementResource.php
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'at' => $this->created_at->toIso8601String(),
        'product' => [
            'id' => $this->product->id,
            'name' => $this->product->name,
            'unit' => $this->product->firstUnit?->name ?? '',
        ],
        'batch' => $this->batch?->code,
        'kind' => $this->kind,
        'delta' => (float) $this->delta,
        'balanceAfter' => $this->balance_after === null ? null : (float) $this->balance_after,
        'reference' => $this->reference,
        'link' => $this->link_type ? ['type' => $this->link_type, 'id' => $this->link_id] : null,
        'actor' => $this->user->name,
    ];
}
```

---

## التالف

### شو بيصير بالشاشة

- بطاقات: خسارة هالشهر (ومقارنة بالشهر الماضي)، عدد السجلات، وأكتر سبب.
- تنبيه: "في 3 دفعات منتهية لسا بالمخزون"، مع زر "سجلهم كلهم تالف".
- قائمة تالف هالشهر.
- زر "تسجيل تالف" بيفتح لوحة: الصنف، الدفعة، الكمية، السبب، ملاحظة.

### الروابط

| الطريقة | الرابط                      | الطلب         | الرد                                     |
| ------- | --------------------------- | ------------- | ---------------------------------------- |
| GET     | `/api/stock/damage`         |               | سجلات هالشهر والملخص                     |
| POST    | `/api/stock/damage`         | بيانات التالف | 201، السجل                               |
| POST    | `/api/stock/damage/expired` |               | `{ "data": { "count": 3, "loss": 96 } }` |

### القائمة

```json
{
  "data": [
    {
      "id": 21,
      "at": "2026-11-22T13:10:00+02:00",
      "product": { "id": 40, "name": "Ventolin Inhaler 100mcg", "unit": "عبوة" },
      "batch": "VEN-2510",
      "quantity": 1,
      "reason": "broken",
      "note": "وقع من الرف",
      "loss": 18.5,
      "actor": "رزان"
    }
  ],
  "summary": {
    "lossThisMonth": 142.5,
    "lossLastMonth": 210,
    "count": 6,
    "topReason": { "reason": "expired", "count": 3 },
    "expiredInStock": [
      {
        "productId": 51,
        "name": "Brufen Syrup 100ml",
        "unit": "عبوة",
        "batch": "BRU-2510",
        "expiry": "2026-10-31",
        "quantity": 2,
        "cost": 9
      }
    ]
  }
}
```

| الحقل            | معناه                                                 |
| ---------------- | ----------------------------------------------------- |
| `reason`         | `expired` `broken` `storage` `customerReturn` `other` |
| `loss`           | الكمية × تكلفة الدفعة                                 |
| `topReason`      | السبب الأكتر تكرار هالشهر، أو `null` إذا ما في سجلات  |
| `expiredInStock` | كل دفعة فيها كمية وتاريخها **قبل** اليوم              |

### التسجيل

```json
{
  "productId": 40,
  "batch": "VEN-2510",
  "quantity": 1,
  "reason": "broken",
  "note": "وقع من الرف"
}
```

| القاعدة                                    | الخطأ                                       |
| ------------------------------------------ | ------------------------------------------- |
| الدفعة موجودة للصنف                        |                                             |
| الكمية أكبر من صفر ومش أكتر من كمية الدفعة | `{ "errors": { "quantity": ["tooMuch"] } }` |

`batch` هون **رمز الدفعة** (`VEN-2510`)، مش رقمها. لأنه الفرونت بيعرض الدفعات برموزها.

### شو بيصير جوا السيرفر

1. الدفعة بتنقص.
2. سجل تالف بالخسارة.
3. حركة `damage` سالبة.
4. سطر بسجل النشاط: `damage`، نوعه `stock`، مع اسم الصنف.

"سجلهم كلهم" بيعمل نفس الشي لكل دفعة منتهية، بالسبب `expired` وبكل كميتها.

```php
// app/Services/WriteOff.php
class WriteOff
{
    public function record(Product $product, string $batchCode, float $quantity, string $reason, string $note = ''): DamageRecord
    {
        return DB::transaction(function () use ($product, $batchCode, $quantity, $reason, $note) {
            $batch = $product->batches()->where('code', $batchCode)->lockForUpdate()->first();

            if (! $batch || $quantity <= 0 || $quantity > (float) $batch->quantity) {
                throw ValidationException::withMessages(['quantity' => 'tooMuch']);
            }

            $record = DamageRecord::create([
                'product_id' => $product->id,
                'batch_id' => $batch->id,
                'quantity' => $quantity,
                'reason' => $reason,
                'note' => $note,
                'loss' => round($quantity * $batch->cost, 2),
                'user_id' => auth()->id(),
            ]);

            StockMovement::record($batch, -$quantity, 'damage', null, link: ['damage', $record->id]);
            activity_log('damage', 'stock', ['product' => $product->name]);

            return $record;
        });
    }

    public function allExpired(): array
    {
        $count = 0;
        $loss = 0;

        Batch::with('product')->where('quantity', '>', 0)->where('expiry', '<', today())->each(
            function (Batch $batch) use (&$count, &$loss) {
                $record = $this->record($batch->product, $batch->code, (float) $batch->quantity, 'expired');
                $count++;
                $loss += $record->loss;
            }
        );

        return ['count' => $count, 'loss' => round($loss, 2)];
    }
}
```

> `lockForUpdate` مهم: لو الكاشير باع من نفس الدفعة بنفس اللحظة، ما بيصير الرقم سالب.

---

## الجرد

### شو بيصير بالشاشة

- قائمة الجرودات: التصنيف (أو كل الصيدلية)، الحالة، مين بلش، عدد السطور، عدد الفروقات، وقيمة الفرق.
- "جرد جديد": تختاري تصنيف أو الكل. **جرد واحد بس ممكن يكون مفتوح**.
- بالجرد المفتوح: سطر لكل دفعة فيها كمية. لكل سطر: المتوقع (من النظام)، الفعلي (اللي عدّوه)، والسبب لو في فرق.
- البيع **ما بيوقف** وقت الجرد.
- "اعتماد": بيعدل المخزون لكل فرق. كل فرق لازم إله سبب.

### الروابط

| الطريقة | الرابط                           | الطلب        | الرد                              |
| ------- | -------------------------------- | ------------ | --------------------------------- |
| GET     | `/api/stock/counts`              |              | قائمة الجرودات، الأحدث أول        |
| GET     | `/api/stock/counts/{id}`         |              | الجرد بسطوره                      |
| POST    | `/api/stock/counts`              | `categoryId` | 201، أو 409 لو في جرد مفتوح       |
| PUT     | `/api/stock/counts/{id}/lines`   | `lines`      | الجرد بعد الحفظ، أو 409 لو مسكر   |
| POST    | `/api/stock/counts/{id}/approve` |              | الجرد معتمد، أو 403 أو 409 أو 422 |

### بدء جرد

```json
{ "categoryId": 2 }
```

أو `null` لكل الصيدلية. السطور بتنعمل لكل دفعة فيها كمية، من الأصناف الفعالة بهالتصنيف.

### شكل الجرد

```json
{
  "data": {
    "id": 5,
    "category": { "id": 2, "nameAr": "مضادات حيوية", "nameEn": "Antibiotics" },
    "status": "open",
    "startedAt": "2026-11-24T08:30:00+02:00",
    "startedBy": "رزان",
    "approvedAt": null,
    "approvedBy": null,
    "lines": [
      {
        "productId": 12,
        "name": "Augmentin 625mg 14 Tablets",
        "unit": "علبة",
        "batch": "AUG-2611",
        "expected": 3,
        "actual": 2,
        "reason": "unknown",
        "cost": 32
      }
    ]
  }
}
```

| الحقل      | معناه                                                                |
| ---------- | -------------------------------------------------------------------- |
| `expected` | كمية الدفعة **هلق**. مش وقت بدء الجرد. لو انباع شي وقت الجرد، بيتغير |
| `actual`   | اللي عدّوه، أو `null` لسا ما انعد                                     |
| `reason`   | `unknown` `unrecordedDamage` `entryError` `other`، أو `null`         |
| `cost`     | تكلفة الدفعة، عشان قيمة الفرق                                        |

> ليش `expected` هو الكمية الحالية؟ لأنه البيع شغال. لو عدّوا 2 الصبح وانباعت وحدة الضهر، المتوقع صار 2، والفرق صفر. لو خزنا رقم الصبح، كان طلع فرق غلط.

### حفظ العد

بيتحفظ كل شوي وهم بيعدوا:

```http
PUT /api/stock/counts/5/lines
```

```json
{
  "lines": [
    { "productId": 12, "batch": "AUG-2611", "actual": 2, "reason": "unknown" },
    { "productId": 15, "batch": "PAN-2702", "actual": 18, "reason": null }
  ]
}
```

بينبعت السطور اللي تغيرت بس. كل سطر بيتعرف بالصنف ورمز الدفعة مع بعض.

### القائمة

```json
{
  "data": [
    {
      "id": 5,
      "category": { "id": 2, "nameAr": "مضادات حيوية", "nameEn": "Antibiotics" },
      "status": "approved",
      "startedAt": "2026-11-24T08:30:00+02:00",
      "startedBy": "رزان",
      "approvedAt": "2026-11-24T11:02:00+02:00",
      "lineCount": 34,
      "differences": 3,
      "differenceValue": -64
    }
  ]
}
```

| الحقل             | للجرد المفتوح | للجرد المعتمد          |
| ----------------- | ------------- | ---------------------- |
| `differences`     | بينحسب هلق    | **محفوظ** وقت الاعتماد |
| `differenceValue` | بينحسب هلق    | **محفوظ** وقت الاعتماد |

`differenceValue` = مجموع (الفعلي − المتوقع) × التكلفة، للسطور اللي انعدت وفيها فرق. سالب يعني خسارة.

> ليش محفوظ بعد الاعتماد؟ لأنه بعد الاعتماد المتوقع صار = الفعلي، فلو حسبناه من جديد بيطلع صفر.

### الاعتماد

```http
POST /api/stock/counts/5/approve
```

| الحالة | متى                                           | الرد                                               |
| ------ | --------------------------------------------- | -------------------------------------------------- |
| 403    | المستخدم كاشير، أو صيدلي بدون `approveCounts` |                                                    |
| 409    | الجرد مش مفتوح                                |                                                    |
| 422    | سطر فيه فرق وما إله سبب                       | `{ "errors": { "lines.3.reason": ["required"] } }` |
| 200    | تمام                                          | الجرد معتمد                                        |

`lines.3` هو ترتيب السطر بالقائمة (من صفر)، عشان الفرونت يروح عليه.

شو بيصير جوا السيرفر:

```php
public function approve(Request $request, StockCount $count)
{
    $user = $request->user();
    abort_unless($user->role === 'manager' || ($user->role === 'pharmacist' && $user->can_approve_counts), 403);
    abort_unless($count->status === 'open', 409, 'Closed.');

    $lines = $count->lines()->with('batch')->orderBy('id')->get();

    foreach ($lines as $i => $line) {
        $differs = $line->actual !== null && (float) $line->actual !== (float) $line->batch->quantity;
        if ($differs && ! $line->reason) {
            throw ValidationException::withMessages(["lines.{$i}.reason" => 'required']);
        }
    }

    DB::transaction(function () use ($count, $lines, $user) {
        $differing = $lines->filter(fn ($l) => $l->actual !== null && (float) $l->actual !== (float) $l->batch->quantity);

        $count->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => $user->id,
            'line_count' => $lines->count(),
            'differences' => $differing->count(),
            'difference_value' => round($differing->sum(fn ($l) => ($l->actual - $l->batch->quantity) * $l->batch->cost), 2),
        ]);

        foreach ($differing as $line) {
            $delta = (float) $line->actual - (float) $line->batch->quantity;
            StockMovement::record($line->batch, $delta, 'count', 'جرد '.today()->format('d/m'), link: ['count', $count->id]);
        }
    });

    return new StockCountResource($count->fresh('lines.batch', 'lines.product'));
}
```

---

## الجداول

```php
Schema::create('stock_movements', function (Blueprint $table) {
    $table->id();
    $table->foreignId('pharmacy_id')->constrained()->cascadeOnDelete();
    $table->foreignId('product_id')->constrained()->cascadeOnDelete();
    $table->foreignId('batch_id')->nullable()->constrained()->nullOnDelete();
    $table->enum('kind', ['sale', 'purchase', 'return', 'count', 'damage', 'opening', 'import']);
    $table->decimal('delta', 12, 4);
    $table->decimal('balance_after', 12, 4)->nullable();
    $table->string('reference', 40)->nullable();
    $table->string('link_type', 20)->nullable();   // invoice, order, count, damage, return, import
    $table->unsignedBigInteger('link_id')->nullable();
    $table->foreignId('user_id')->constrained();
    $table->timestamp('created_at')->useCurrent();

    $table->index(['pharmacy_id', 'created_at']);
    $table->index(['product_id', 'created_at']);
});

Schema::create('damage_records', function (Blueprint $table) {
    $table->id();
    $table->foreignId('pharmacy_id')->constrained()->cascadeOnDelete();
    $table->foreignId('product_id')->constrained();
    $table->foreignId('batch_id')->constrained();
    $table->decimal('quantity', 12, 4);
    $table->enum('reason', ['expired', 'broken', 'storage', 'customerReturn', 'other']);
    $table->string('note')->default('');
    $table->decimal('loss', 12, 2);
    $table->foreignId('user_id')->constrained();
    $table->timestamps();
});

Schema::create('stock_counts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('pharmacy_id')->constrained()->cascadeOnDelete();
    $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
    $table->enum('status', ['open', 'approved'])->default('open');
    $table->foreignId('started_by')->constrained('users');
    $table->foreignId('approved_by')->nullable()->constrained('users');
    $table->timestamp('approved_at')->nullable();
    // بينحفظوا وقت الاعتماد بس
    $table->unsignedInteger('line_count')->nullable();
    $table->unsignedInteger('differences')->nullable();
    $table->decimal('difference_value', 12, 2)->nullable();
    $table->timestamps();
});

Schema::create('stock_count_lines', function (Blueprint $table) {
    $table->id();
    $table->foreignId('stock_count_id')->constrained()->cascadeOnDelete();
    $table->foreignId('product_id')->constrained();
    $table->foreignId('batch_id')->constrained();
    $table->decimal('actual', 12, 4)->nullable();
    $table->enum('reason', ['unknown', 'unrecordedDamage', 'entryError', 'other'])->nullable();
});
```

ونسخة كاملة من دالة الحركة، مع الرابط:

```php
// app/Models/StockMovement.php
class StockMovement extends Model
{
    use BelongsToPharmacy;

    public const UPDATED_AT = null;
    protected $guarded = [];

    public static function record(Batch $batch, float $delta, string $kind, ?string $reference = null, ?array $link = null, bool $adjust = true): self
    {
        if ($adjust) {
            $batch->increment('quantity', $delta);
        }

        return self::create([
            'product_id' => $batch->product_id,
            'batch_id' => $batch->id,
            'kind' => $kind,
            'delta' => $delta,
            'balance_after' => $batch->fresh()->quantity,
            'reference' => $reference,
            'link_type' => $link[0] ?? null,
            'link_id' => $link[1] ?? null,
            'user_id' => auth()->id(),
        ]);
    }
}
```

> بالشراء والرصيد الأول، الدفعة بتنعمل بكميتها، فناديها بـ `adjust: false` عشان ما تنزاد مرتين.

---

## الروابط بملف لارافيل

```php
Route::middleware(['auth:sanctum', 'role:manager,pharmacist'])->prefix('stock')->group(function () {
    Route::get('/movements', [MovementController::class, 'index']);

    Route::get('/damage', [DamageController::class, 'index']);
    Route::post('/damage', [DamageController::class, 'store']);
    Route::post('/damage/expired', [DamageController::class, 'expired']);

    Route::get('/counts', [StockCountController::class, 'index']);
    Route::post('/counts', [StockCountController::class, 'store']);
    Route::get('/counts/{count}', [StockCountController::class, 'show']);
    Route::put('/counts/{count}/lines', [StockCountController::class, 'lines']);
    Route::post('/counts/{count}/approve', [StockCountController::class, 'approve']);
});
```

---

## اختبري حالك

- [ ] كل بيع، شراء، تالف، جرد بيطلع سطر بالسجل
- [ ] `balanceAfter` بآخر حركة لدفعة = كمية الدفعة بتفاصيل الصنف
- [ ] فلتر "بيع" بيغير الجدول، والبطاقات بتضل نفسها
- [ ] تالف أكتر من كمية الدفعة بيرجع `tooMuch`
- [ ] "سجل المنتهي كله" بيفضي تنبيه الدفعات المنتهية
- [ ] جرد تاني وفي جرد مفتوح بيرجع 409
- [ ] بيع وقت الجرد بيغير `expected` للسطر
- [ ] اعتماد بدون سبب لفرق بيروح على السطر الصح
- [ ] صيدلي بدون صلاحية بياخد 403 على الاعتماد
- [ ] بعد الاعتماد، القائمة بتعرض نفس قيمة الفرق اللي كانت قبل
