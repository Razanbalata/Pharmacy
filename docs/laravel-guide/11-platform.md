# الوحدة 11: لوحة صاحبة المنصة

صاحبة المنصة (إنتِ) بتشوف كل الصيدليات، وبتقبل الطلبات، وبتدير الاشتراكات. **بس ما بتشوف أسرار الصيدليات**: كم صنف وكم فاتورة اليوم آه، بس كم باعت وكم ربحت ومين زبائنها لا.

كل الروابط هون لصاحبة المنصة بس (`role = platform_owner`). أي حد تاني: 403.

## المحتويات

1. [الصفحات](#الصفحات)
2. [شغلة مهمة: الفلتر العام](#شغلة-مهمة-الفلتر-العام)
3. [طلبات الانضمام](#طلبات-الانضمام)
4. [الصيدليات](#الصيدليات)
5. [تفاصيل صيدلية والأفعال](#تفاصيل-صيدلية-والأفعال)
6. [الاشتراكات والمدفوعات](#الاشتراكات-والمدفوعات)
7. [شو بيصير للصيدلية الموقوفة](#شو-بيصير-للصيدلية-الموقوفة)
8. [الجداول](#الجداول)
9. [الروابط بملف لارافيل](#الروابط-بملف-لارافيل)
10. [اختبري حالك](#اختبري-حالك)

---

## الصفحات

| الصفحة         | الرابط                     | ملف الصفحة                                                       |
| -------------- | -------------------------- | ---------------------------------------------------------------- |
| طلبات الانضمام | `/platform/requests`       | `src/pages/platform/requests/ui/PlatformRequestsPage.tsx`        |
| الصيدليات      | `/platform/pharmacies`     | `src/pages/platform/pharmacies/ui/PlatformPharmaciesPage.tsx`    |
| تفاصيل صيدلية  | `/platform/pharmacies/:id` | `src/pages/platform/pharmacy-detail/ui/PlatformPharmacyPage.tsx` |
| الاشتراكات     | `/platform/billing`        | `src/pages/platform/billing/ui/PlatformBillingPage.tsx`          |

| شو                | وين                                                       |
| ----------------- | --------------------------------------------------------- |
| أنواع الطلبات     | `src/entities/platform/join-request/model/types.ts`       |
| أنواع الصيدليات   | `src/entities/platform/pharmacy/model/types.ts`           |
| أنواع الاشتراكات  | `src/entities/platform/subscription/model/types.ts`       |
| رد السيرفر الوهمي | `src/app/mocks/handlers/join-requests.ts` و `platform.ts` |

---

## شغلة مهمة: الفلتر العام

صاحبة المنصة ما إلها `pharmacy_id`. فالفلتر العام اللي شرحناه بالملف الرئيسي ما بيشتغل عليها (لأنه بيفلتر بس لما في `pharmacy_id`). هاد منيح هون، لأنها لازم تشوف الكل.

بس انتبهي: **لو نسيتي `role:platform_owner` على أي رابط تاني**، صاحبة المنصة رح تشوف بيانات كل الصيدليات مخلوطة. عشان هيك:

1. كل روابط المنصة تحت مجموعة وحدة بالميدلوير.
2. صاحبة المنصة ما بتفتح ولا رابط من روابط الصيدلية. اعملي ميدلوير بيرفضها:

```php
// app/Http/Middleware/EnsurePharmacyUser.php
public function handle(Request $request, Closure $next)
{
    abort_unless($request->user()?->pharmacy_id, 403);

    return $next($request);
}
```

وحطيه على كل روابط الصيدلية:

```php
Route::middleware(['auth:sanctum', 'pharmacy'])->group(function () {
    // كل روابط الوحدات 1 لـ 10
});
```

وبروابط المنصة، لما بدك تعدي جوا صيدلية (عدد أصنافها مثلاً)، استخدمي:

```php
Product::withoutGlobalScope('pharmacy')->where('pharmacy_id', $pharmacy->id)->count();
```

---

## طلبات الانضمام

### شو بيصير بالشاشة

قائمة الطلبات بتبويبات (جديد، منقبل، مفعّل، مرفوض). لكل طلب: الصيدلية، المالكة، المدينة، الجوال، الترخيص، وصورة الترخيص لو في. أزرار: قبول، رفض بسبب. وزر "صيدلية جديدة" لإضافة يدوية (بعد مكالمة مثلاً).

### الروابط

| الطريقة | الرابط                                     | الطلب                 | الرد                  |
| ------- | ------------------------------------------ | --------------------- | --------------------- |
| GET     | `/api/platform/join-requests?status=new`   |                       | القائمة               |
| POST    | `/api/platform/join-requests`              | حقول طلب الانضمام     | 201، طلب منقبل مباشرة |
| POST    | `/api/platform/join-requests/{id}/approve` |                       | الطلب بعد القبول      |
| POST    | `/api/platform/join-requests/{id}/reject`  | `{ "reason": "..." }` | الطلب بعد الرفض       |

`status`: `new` `approved` `activated` `rejected`، أو ما ينبعت للكل.

شكل الطلب:

```json
{
  "id": 34,
  "reference": "REQ-0034",
  "pharmacyName": "صيدلية الرحمة",
  "ownerName": "هبة نصار",
  "city": "النصيرات",
  "phone": "0599402219",
  "licenseNumber": "PH-2025-0388",
  "status": "new",
  "hasLicensePhoto": true,
  "rejectionReason": null,
  "createdAt": "2026-11-24T08:40:00+02:00"
}
```

### شو بيصير جوا السيرفر

| الفعل       | شو بيصير                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------- |
| قبول        | الحالة `approved`، رابط تفعيل جديد (48 ساعة)، وبينبعت على واتساب (الوحدة 1)               |
| رفض         | الحالة `rejected`، السبب بينحفظ، وبينبعت للمالكة على واتساب                               |
| إضافة يدوية | نفس فحوصات طلب الانضمام (الجوال مستخدم ← `taken`)، والحالة `approved` مباشرة، ورابط تفعيل |

قبول طلب مش `new`؟ رجعي 409.

```php
public function approve(JoinRequest $joinRequest)
{
    abort_unless($joinRequest->status === 'new', 409);

    DB::transaction(function () use ($joinRequest) {
        $joinRequest->update(['status' => 'approved']);
        app(ActivationLinks::class)->sendFor($joinRequest);   // الكود بالوحدة 1
    });

    return new JoinRequestResource($joinRequest);
}
```

---

## الصيدليات

### شو بيصير بالشاشة

- بطاقات: كم مدفوعة، كم بالتجربة، كم بتخلص هالأسبوع، كم موقوفة.
- تبويبات: الكل، تجربة، مدفوعة، موقوفة. وفلتر المدينة، وبحث.
- جدول: الصيدلية، المالكة، الباقة، متى بتخلص، الاستخدام (أصناف، موظفين، فواتير اليوم)، وآخر نشاط.

### الطلب

```http
GET /api/platform/pharmacies?filter=trial&city=غزة&search=الشفاء
```

| `filter`    | بيعرض                          |
| ----------- | ------------------------------ |
| `all`       | الكل                           |
| `trial`     | الفعالة اللي باقتها `trial`    |
| `paid`      | الفعالة اللي باقتها مش `trial` |
| `suspended` | الموقوفة                       |

البحث باسم الصيدلية أو المالكة أو الجوال.

### الرد

```json
{
  "data": [
    {
      "id": 1,
      "name": "صيدلية الشفاء",
      "owner": "رزان",
      "phone": "0599123456",
      "city": "غزة",
      "district": "الرمال",
      "license": "PH-2026-0147",
      "plan": "trial",
      "status": "active",
      "endsAt": "2026-12-12",
      "products": 143,
      "staff": { "total": 4, "active": 3 },
      "invoicesToday": 38,
      "lastActiveAt": "2026-11-24T10:42:00+02:00",
      "onboardingDone": false,
      "registeredAt": "2026-11-12",
      "supportAccess": "none"
    }
  ],
  "summary": {
    "paid": 12,
    "trial": 5,
    "endingThisWeek": 2,
    "suspended": 1,
    "counts": { "all": 18, "trial": 5, "paid": 12, "suspended": 1 },
    "cities": ["خان يونس", "دير البلح", "غزة"]
  }
}
```

| الحقل            | من وين                                     |
| ---------------- | ------------------------------------------ |
| `owner`          | اسم المديرة بالصيدلية                      |
| `plan`, `endsAt` | من آخر اشتراك                              |
| `products`       | عدد الأصناف                                |
| `staff`          | عدد الموظفين كلهم، والفعالين               |
| `invoicesToday`  | عدد فواتير اليوم. **عدد بس، مش مبلغ**      |
| `lastActiveAt`   | آخر `last_active_at` لأي موظف فيها         |
| `registeredAt`   | تاريخ إنشاء الصيدلية                       |
| `endingThisWeek` | الفعالة اللي `endsAt` خلال 7 أيام من اليوم |
| `cities`         | المدن الموجودة، مرتبة، لقائمة الفلتر       |

**الترتيب:** الموقوفة آخر شي. والباقي: اللي بتخلص أقرب أول.

> `lastActiveAt` بيحتاج تحديث `last_active_at` بكل طلب. تحديثه بكل طلب تقيل، فحدثيه مرة كل 5 دقايق بميدلوير:
>
> ```php
> if (! $user->last_active_at || $user->last_active_at->lt(now()->subMinutes(5))) {
>     $user->forceFill(['last_active_at' => now()])->saveQuietly();
> }
> ```

---

## تفاصيل صيدلية والأفعال

```http
GET /api/platform/pharmacies/1
```

كل حقول القائمة، ومعهم `history`: سجل الاشتراك، الأقدم أول، وآخر سطر دايماً `ends` (متى بتخلص الباقة الحالية).

```json
"history": [
  { "kind": "joined", "at": "2026-11-12T09:00:00+02:00", "params": {} },
  { "kind": "trialStarted", "at": "2026-11-12T09:00:00+02:00", "params": { "days": 30 } },
  { "kind": "trialExtended", "at": "2026-11-20T11:00:00+02:00", "params": { "days": 7, "by": "رزان بلاطة" } },
  { "kind": "ends", "at": "2026-12-19T00:00:00Z", "params": { "plan": "trial" } }
]
```

| `kind`             | `params`                               |
| ------------------ | -------------------------------------- |
| `joined`           | ما في                                  |
| `trialStarted`     | `days`                                 |
| `trialExtended`    | `days`، `by`                           |
| `planChanged`      | `plan`، `until`، `by`                  |
| `paymentConfirmed` | `plan`، `until`                        |
| `paymentRejected`  | `reason`                               |
| `suspended`        | `reason`، `by`                         |
| `resumed`          | `by`                                   |
| `supportRequested` | `by`                                   |
| `ends`             | `plan`. **ما بينخزن**، بينضاف وقت الرد |

زي سجل النشاط: السيرفر بيبعت النوع والقيم، والفرونت بيكتب الجملة.

### الأفعال

كل فعل بيرجع التفاصيل كاملة بعده، وبيضيف سطر بالسجل.

| الطريقة | الرابط                                         | الطلب                            | القاعدة                                                       |
| ------- | ---------------------------------------------- | -------------------------------- | ------------------------------------------------------------- |
| POST    | `/api/platform/pharmacies/{id}/extend-trial`   | `{ "days": 7 }`                  | الباقة `trial` (غير هيك `plan` ← `notTrial`). `days`: 7 أو 14 |
| POST    | `/api/platform/pharmacies/{id}/plan`           | `{ "plan": "pro", "months": 3 }` | `plan`: `basic` `pro` `yearly`. `months`: من 1 لـ 24          |
| POST    | `/api/platform/pharmacies/{id}/suspend`        | `{ "reason": "ما دفعت" }`        | `reason` مطلوب                                                |
| POST    | `/api/platform/pharmacies/{id}/resume`         |                                  |                                                               |
| POST    | `/api/platform/pharmacies/{id}/support-access` |                                  | `supportAccess` بيصير `requested`                             |

**من وين بيبلش التمديد:**

| الفعل         | لو الباقة الحالية لسا ما خلصت                   | لو خلصت  |
| ------------- | ----------------------------------------------- | -------- |
| تمديد التجربة | من `endsAt`                                     | من اليوم |
| تغيير الباقة  | من `endsAt` **إذا مدفوعة**، ومن اليوم إذا تجربة | من اليوم |

يعني ما حدا بيخسر أيام دفعها.

**طلب الدخول للدعم:** صاحبة المنصة ما بتدخل على صيدلية بدون إذن. الطلب بيكتب سطر بسجل نشاط الصيدلية، والمديرة بتوافق أو لا. (شاشة الموافقة عند المديرة لسا مش مبنية بالفرونت.)

```php
public function plan(Request $request, Pharmacy $pharmacy)
{
    $data = $request->validate([
        'plan' => ['required', 'in:basic,pro,yearly'],
        'months' => ['required', 'integer', 'between:1,24'],
    ], ['plan.*' => 'invalid', 'months.*' => 'invalid']);

    $current = $pharmacy->currentSubscription;
    $from = $current && $current->plan !== 'trial' && $current->ends_at->isFuture() ? $current->ends_at : today();
    $until = $from->copy()->addMonthsNoOverflow($data['months']);

    DB::transaction(function () use ($pharmacy, $data, $from, $until, $request) {
        $pharmacy->subscriptions()->create(['plan' => $data['plan'], 'starts_at' => $from, 'ends_at' => $until]);
        $pharmacy->update(['status' => 'active']);
        $pharmacy->subscriptionEvents()->create([
            'kind' => 'planChanged',
            'params' => ['plan' => $data['plan'], 'until' => $until->toDateString(), 'by' => $request->user()->name],
        ]);
    });

    return new PlatformPharmacyDetailResource($pharmacy->fresh());
}
```

---

## الاشتراكات والمدفوعات

### الفكرة

الدفع **يدوي**: الصيدلية بتحول المصاري (بنك، جوال باي)، وبتبعت صورة الوصل. صاحبة المنصة بتفحصه وبتأكد، والباقة بتبلش.

### شو بيصير بالشاشة

- بطاقات الباقات: سعر كل باقة (بتنعدل)، وكم صيدلية عليها.
- جدول المدفوعات: التاريخ، الصيدلية، الباقة، المبلغ، الطريقة، الوصل، والحالة. للمعلق: تأكيد أو رفض بسبب.

### الروابط

| الطريقة | الرابط                                | الطلب                 | الرد                                |
| ------- | ------------------------------------- | --------------------- | ----------------------------------- |
| GET     | `/api/platform/billing`               |                       | الباقات والمدفوعات                  |
| PUT     | `/api/platform/plans/{plan}`          | `{ "price": 60 }`     | 204. السعر أكبر من صفر (`positive`) |
| POST    | `/api/platform/payments/{id}/confirm` |                       | الدفعة، أو 409 لو انراجعت قبل       |
| POST    | `/api/platform/payments/{id}/reject`  | `{ "reason": "..." }` | الدفعة، أو 409                      |

```json
{
  "data": {
    "plans": [
      { "key": "basic", "price": 40, "per": "month", "pharmacies": 6 },
      { "key": "pro", "price": 60, "per": "month", "pharmacies": 5 },
      { "key": "yearly", "price": null, "per": "year", "pharmacies": 1 }
    ],
    "payments": [
      {
        "id": 9,
        "date": "2026-11-23",
        "pharmacy": { "id": 3, "name": "صيدلية النور" },
        "plan": "pro",
        "amount": 60,
        "method": "بنك فلسطين",
        "receiptUrl": "https://.../receipts/9.jpg",
        "status": "pending",
        "rejectionReason": null
      }
    ],
    "pending": 2
  }
}
```

| الحقل                | معناه                                                         |
| -------------------- | ------------------------------------------------------------- |
| `plans.*.price`      | `null` لحد ما تحطي سعر                                        |
| `plans.*.per`        | `year` للسنوية، `month` للباقي                                |
| `plans.*.pharmacies` | الصيدليات **الفعالة** على هالباقة                             |
| `payments`           | الأحدث أول                                                    |
| `payments.*.amount`  | ممكن `null` لو الصيدلية ما كتبت. وقت التأكيد بياخد سعر الباقة |
| `pending`            | عدد المعلق                                                    |

### التأكيد

1. الحالة `confirmed`.
2. اشتراك جديد: شهر للشهرية، 12 شهر للسنوية. بيبلش من `endsAt` لو مدفوعة ولسا ما خلصت، وإلا من اليوم.
3. الصيدلية بترجع `active` لو كانت موقوفة.
4. سطر `paymentConfirmed` بسجلها.

### الرفض

1. الحالة `rejected`، والسبب بينحفظ.
2. سطر `paymentRejected` بسجلها.
3. بينبعت السبب للصيدلية على واتساب.

> **وين الصيدلية بتبعت الدفعة؟** هاد الجزء (شاشة "ادفع" عند المديرة، ورفع صورة الوصل) لسا مش مبني بالفرونت. لما تبنيه، رابط زي `POST /api/subscription/payments` بملف `receipt`، زي رفع الشعار بالوحدة 2.

---

## شو بيصير للصيدلية الموقوفة

الإيقاف **ما بيمسح شي**. الصيدلية بتصير **قراءة بس**.

```php
// app/Http/Middleware/EnsurePharmacyActive.php
public function handle(Request $request, Closure $next)
{
    $pharmacy = $request->user()?->pharmacy;

    if ($pharmacy && $pharmacy->status === 'suspended' && ! $request->isMethod('GET')) {
        return response()->json(['message' => 'The pharmacy is suspended.'], 403);
    }

    return $next($request);
}
```

ونفس الشي لما الباقة تخلص وما تتجدد. قرار إلك: يا بتوقفيها تلقائياً بمهمة مجدولة، يا بتعطيها كم يوم سماح.

```php
// routes/console.php
Schedule::call(function () {
    Pharmacy::where('status', 'active')
        ->whereHas('currentSubscription', fn ($q) => $q->where('ends_at', '<', today()->subDays(3)))
        ->each(function (Pharmacy $pharmacy) {
            $pharmacy->update(['status' => 'suspended']);
            $pharmacy->subscriptionEvents()->create(['kind' => 'suspended', 'params' => ['reason' => 'انتهت الباقة', 'by' => 'النظام']]);
        });
})->dailyAt('02:00');
```

---

## الجداول

```php
Schema::create('subscriptions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('pharmacy_id')->constrained()->cascadeOnDelete();
    $table->enum('plan', ['trial', 'basic', 'pro', 'yearly']);
    $table->date('starts_at');
    $table->date('ends_at');
    $table->timestamps();
});

Schema::create('subscription_events', function (Blueprint $table) {
    $table->id();
    $table->foreignId('pharmacy_id')->constrained()->cascadeOnDelete();
    $table->enum('kind', ['joined', 'trialStarted', 'trialExtended', 'planChanged', 'paymentConfirmed', 'paymentRejected', 'suspended', 'resumed', 'supportRequested']);
    $table->json('params')->nullable();
    $table->timestamp('created_at')->useCurrent();
});

Schema::create('subscription_payments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('pharmacy_id')->constrained()->cascadeOnDelete();
    $table->date('date');
    $table->enum('plan', ['basic', 'pro', 'yearly']);
    $table->decimal('amount', 10, 2)->nullable();
    $table->string('method', 60);
    $table->string('receipt_path')->nullable();
    $table->enum('status', ['pending', 'confirmed', 'rejected'])->default('pending');
    $table->string('rejection_reason')->nullable();
    $table->foreignId('reviewed_by')->nullable()->constrained('users');
    $table->timestamps();
});

Schema::create('plan_prices', function (Blueprint $table) {
    $table->enum('plan', ['basic', 'pro', 'yearly'])->primary();
    $table->decimal('price', 10, 2)->nullable();
    $table->timestamps();
});
```

> هالجداول **بدون** الفلتر العام تبع الصيدلية بالموديل، لأنه صاحبة المنصة هي اللي بتقراها. لو الصيدلية نفسها احتاجت تقرا اشتراكها، فلتري يدوي بـ `pharmacy_id`.

علاقة الاشتراك الحالي:

```php
// app/Models/Pharmacy.php
public function currentSubscription(): HasOne
{
    return $this->hasOne(Subscription::class)->latestOfMany('ends_at');
}
```

---

## الروابط بملف لارافيل

```php
Route::middleware(['auth:sanctum', 'role:platform_owner'])->prefix('platform')->group(function () {
    Route::get('/join-requests', [PlatformJoinRequestController::class, 'index']);
    Route::post('/join-requests', [PlatformJoinRequestController::class, 'store']);
    Route::post('/join-requests/{joinRequest}/approve', [PlatformJoinRequestController::class, 'approve']);
    Route::post('/join-requests/{joinRequest}/reject', [PlatformJoinRequestController::class, 'reject']);

    Route::get('/pharmacies', [PlatformPharmacyController::class, 'index']);
    Route::get('/pharmacies/{pharmacy}', [PlatformPharmacyController::class, 'show']);
    Route::post('/pharmacies/{pharmacy}/extend-trial', [PlatformPharmacyController::class, 'extendTrial']);
    Route::post('/pharmacies/{pharmacy}/plan', [PlatformPharmacyController::class, 'plan']);
    Route::post('/pharmacies/{pharmacy}/suspend', [PlatformPharmacyController::class, 'suspend']);
    Route::post('/pharmacies/{pharmacy}/resume', [PlatformPharmacyController::class, 'resume']);
    Route::post('/pharmacies/{pharmacy}/support-access', [PlatformPharmacyController::class, 'supportAccess']);

    Route::get('/billing', [BillingController::class, 'index']);
    Route::put('/plans/{plan}', [BillingController::class, 'price'])->whereIn('plan', ['basic', 'pro', 'yearly']);
    Route::post('/payments/{payment}/confirm', [BillingController::class, 'confirm']);
    Route::post('/payments/{payment}/reject', [BillingController::class, 'reject']);
});
```

صاحبة المنصة نفسها بتنعمل مرة وحدة بأمر:

```php
// database/seeders/PlatformOwnerSeeder.php
User::firstOrCreate(['phone' => '0590000000'], [
    'name' => 'رزان بلاطة',
    'password' => Hash::make(env('PLATFORM_OWNER_PASSWORD')),
    'role' => 'platform_owner',
    'pharmacy_id' => null,
]);
```

> كلمة المرور من ملف البيئة، مش مكتوبة بالكود.

---

## اختبري حالك

- [ ] صاحبة المنصة بتدخل وبتروح على `/platform/requests`
- [ ] مديرة صيدلية بتاخد 403 على أي رابط `/platform`
- [ ] صاحبة المنصة بتاخد 403 على `/api/products` وأي رابط صيدلية
- [ ] قبول طلب بيبعت رابط تفعيل، والتفعيل بيعمل الصيدلية
- [ ] إضافة يدوية برقم مستخدم بتعرض `taken`
- [ ] تمديد تجربة لصيدلية مدفوعة بيرجع `notTrial`
- [ ] تغيير الباقة لصيدلية مدفوعة لسا ما خلصت بيبلش من آخر يوم إلها
- [ ] تأكيد دفعة مرتين: التانية 409
- [ ] الصيدلية الموقوفة بتقرا عادي، بس أي بيع أو تعديل 403
- [ ] قائمة الصيدليات ما فيها ولا مبلغ مبيعات
