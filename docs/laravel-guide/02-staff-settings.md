# الوحدة 2: الموظفين وسجل النشاط والإعدادات

كل الصفحات بهالوحدة للمديرة بس. السيرفر لازم يرفض أي دور تاني بـ 403 على كل تغيير. بس في قراءتين بيحتاجهم الكل: قائمة الموظفين والإعدادات (التفاصيل [تحت](#الروابط-بملف-لارافيل)).

## المحتويات

1. [الصفحات](#الصفحات)
2. [صفحة الموظفين](#صفحة-الموظفين)
3. [سجل النشاط](#سجل-النشاط)
4. [الإعدادات](#الإعدادات)
5. [شعار الصيدلية](#شعار-الصيدلية)
6. [النسخة الاحتياطية](#النسخة-الاحتياطية)
7. [الجداول](#الجداول)
8. [الروابط بملف لارافيل](#الروابط-بملف-لارافيل)
9. [اختبري حالك](#اختبري-حالك)

---

## الصفحات

| الصفحة     | الرابط            | ملف الصفحة                               |
| ---------- | ----------------- | ---------------------------------------- |
| الموظفين   | `/staff`          | `src/pages/staff/ui/StaffPage.tsx`       |
| سجل النشاط | `/staff/activity` | `src/pages/activity/ui/ActivityPage.tsx` |
| الإعدادات  | `/settings`       | `src/pages/settings/ui/SettingsPage.tsx` |

---

## صفحة الموظفين

### شو بيصير بالشاشة

- جدول بكل الموظفين: الاسم، الجوال، الدور، الخصم المسموح، آخر دخول، والحالة.
- زر "موظف جديد" بيفتح لوحة جانبية بالنموذج.
- لكل موظف: تعديل، إيقاف أو تفعيل، وكلمة مرور جديدة.
- لما ينضاف موظف أو تتغير كلمة مروره، الشاشة بتعرض كلمة مرور مؤقتة **مرة وحدة**، مع زر نسخ وزر بعت على واتساب.
- المديرة نفسها بتطلع بالجدول، بس ما بتقدر توقف حالها أو تعدل حالها من هون.

### الملفات

| شو                | وين                                          |
| ----------------- | -------------------------------------------- |
| الأنواع           | `src/entities/staff-member/model/types.ts`   |
| الطلبات           | `src/entities/staff-member/api/staff-api.ts` |
| قواعد النموذج     | `src/features/staff/manage/model/schema.ts`  |
| رد السيرفر الوهمي | `src/app/mocks/handlers/staff.ts`            |

### الروابط

| الطريقة | الرابط                           | الطلب                 | الرد                                         |
| ------- | -------------------------------- | --------------------- | -------------------------------------------- |
| GET     | `/api/staff`                     |                       | قائمة الموظفين                               |
| POST    | `/api/staff`                     | بيانات الموظف         | 201، الموظف ومعه `temporaryPassword`         |
| PUT     | `/api/staff/{id}`                | بيانات الموظف         | الموظف بعد التعديل                           |
| PATCH   | `/api/staff/{id}/status`         | `{ "active": false }` | الموظف بعد التغيير                           |
| POST    | `/api/staff/{id}/reset-password` |                       | `{ "data": { "temporaryPassword": "..." } }` |

### شكل الموظف

```json
{
  "id": 3,
  "name": "محمد العطار",
  "phone": "0598112233",
  "email": null,
  "role": "cashier",
  "discountLimit": 5,
  "permissions": {
    "sellOnCredit": false,
    "seePurchasePrice": false,
    "approveCounts": false
  },
  "active": true,
  "isOwner": false,
  "lastLoginAt": "2026-11-24T08:02:00+02:00"
}
```

| الحقل           | معناه                                                         |
| --------------- | ------------------------------------------------------------- |
| `role`          | للمديرة `manager`. أي موظف جديد إما `pharmacist` أو `cashier` |
| `discountLimit` | نسبة من 0 لـ 100. للمديرة `null`                              |
| `isOwner`       | `true` للمديرة صاحبة الصيدلية بس. الفرونت بيخبي أزرار التعديل |
| `lastLoginAt`   | `null` إذا ما دخل ولا مرة                                     |

### جسم الإضافة والتعديل

```json
{
  "name": "محمد العطار",
  "phone": "0598112233",
  "email": null,
  "role": "cashier",
  "discountLimit": 5,
  "permissions": {
    "sellOnCredit": false,
    "seePurchasePrice": false,
    "approveCounts": false
  }
}
```

| الحقل                          | قاعدة الفرونت             | قاعدة لارافيل                                         |
| ------------------------------ | ------------------------- | ----------------------------------------------------- |
| `name`                         | مطلوب                     | `required\|string\|max:120`                           |
| `phone`                        | جوال 059 أو 056           | `required\|regex:/^05[69]\d{7}$/\|unique:users,phone` |
| `email`                        | فاضي أو إيميل صحيح        | `nullable\|email`                                     |
| `role`                         | `pharmacist` أو `cashier` | `required\|in:pharmacist,cashier`                     |
| `discountLimit`                | من 0 لـ 100               | `required\|numeric\|between:0,100`                    |
| `permissions.sellOnCredit`     | منطقي                     | `required\|boolean`                                   |
| `permissions.seePurchasePrice` | منطقي                     | `required\|boolean`                                   |
| `permissions.approveCounts`    | منطقي                     | `required\|boolean`                                   |

> `approveCounts` إلها معنى للصيدلي بس. لو انبعتت `true` لكاشير، خزنيها `false`.

### الأخطاء

| الحالة | متى                                | الرد                                                |
| ------ | ---------------------------------- | --------------------------------------------------- |
| 422    | الجوال مستخدم                      | `{ "errors": { "phone": ["taken"] } }`              |
| 403    | محاولة تعديل أو إيقاف المديرة      | `{ "message": "The owner cannot be edited here." }` |
| 404    | الموظف مش موجود أو من صيدلية تانية |                                                     |

### كلمة المرور المؤقتة

السيرفر بيولدها، بيحفظ بصمتها بس، وبيرجعها **بالرد هاد بس**. ما في رابط بيرجعها بعدين.

```php
function temporary_password(): string
{
    // سهلة القراءة على التلفون: بدون حروف بتتلخبط زي O و0 وI و1
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $part = fn (int $n) => collect(range(1, $n))->map(fn () => $alphabet[random_int(0, strlen($alphabet) - 1)])->join('');

    return $part(2).'-'.$part(3).'-'.random_int(10, 99);
}
```

ولازم تجبري الموظف يغيرها أول ما يدخل. ضيفي عمود `must_change_password`، وارفضي أي طلب غير تغيير كلمة المرور لحد ما يغيرها. (هالشاشة لسا مش مبنية بالفرونت، فممكن تأجليها.)

### بلارافيل

```php
// app/Http/Requests/StaffRequest.php
class StaffRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge(['phone' => normalize_phone($this->input('phone'))]);
    }

    public function rules(): array
    {
        $id = $this->route('staff')?->id;

        return [
            'name' => ['required', 'string', 'max:120'],
            'phone' => ['required', 'regex:/^05[69]\d{7}$/', Rule::unique('users', 'phone')->ignore($id)],
            'email' => ['nullable', 'email'],
            'role' => ['required', 'in:pharmacist,cashier'],
            'discountLimit' => ['required', 'numeric', 'between:0,100'],
            'permissions.sellOnCredit' => ['required', 'boolean'],
            'permissions.seePurchasePrice' => ['required', 'boolean'],
            'permissions.approveCounts' => ['required', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return ['phone.unique' => 'taken', 'phone.regex' => 'invalid', '*.required' => 'required'];
    }

    public function toModel(): array
    {
        return [
            'name' => $this->input('name'),
            'phone' => $this->input('phone'),
            'email' => $this->input('email'),
            'role' => $this->input('role'),
            'discount_limit' => $this->input('discountLimit'),
            'can_sell_on_credit' => $this->boolean('permissions.sellOnCredit'),
            'can_see_purchase_price' => $this->boolean('permissions.seePurchasePrice'),
            'can_approve_counts' => $this->input('role') === 'pharmacist' && $this->boolean('permissions.approveCounts'),
        ];
    }
}
```

```php
// app/Http/Resources/StaffResource.php
public function toArray(Request $request): array
{
    $isManager = $this->role === 'manager';

    return [
        'id' => $this->id,
        'name' => $this->name,
        'phone' => $this->phone,
        'email' => $this->email,
        'role' => $this->role,
        'discountLimit' => $isManager ? null : (float) $this->discount_limit,
        'permissions' => [
            'sellOnCredit' => $isManager || $this->can_sell_on_credit,
            'seePurchasePrice' => $isManager || $this->can_see_purchase_price,
            'approveCounts' => $isManager || $this->can_approve_counts,
        ],
        'active' => $this->active,
        'isOwner' => $isManager,
        'lastLoginAt' => $this->last_active_at?->toIso8601String(),
    ];
}
```

```php
// app/Http/Controllers/StaffController.php
class StaffController extends Controller
{
    public function index()
    {
        // الموظفين موديل User، فالفلتر بالصيدلية لازم يكون صريح هون
        return StaffResource::collection(
            User::where('pharmacy_id', auth()->user()->pharmacy_id)->orderByRaw("role = 'manager' desc")->orderBy('name')->get()
        );
    }

    public function store(StaffRequest $request)
    {
        $password = temporary_password();
        $member = User::create($request->toModel() + [
            'pharmacy_id' => $request->user()->pharmacy_id,
            'password' => Hash::make($password),
            'active' => true,
        ]);
        activity_log('staffAdded', 'settings', ['name' => $member->name]);

        return (new StaffResource($member))
            ->additional(['data' => ['temporaryPassword' => $password]])
            ->response()->setStatusCode(201);
    }

    public function update(StaffRequest $request, User $staff)
    {
        $this->ensureSamePharmacy($staff);
        abort_if($staff->role === 'manager', 403, 'The owner cannot be edited here.');
        $staff->update($request->toModel());

        return new StaffResource($staff);
    }

    public function status(Request $request, User $staff)
    {
        $this->ensureSamePharmacy($staff);
        abort_if($staff->role === 'manager', 403, 'The owner cannot be stopped.');
        $staff->update(['active' => $request->validate(['active' => 'required|boolean'])['active']]);

        if (! $staff->active) {
            DB::table('sessions')->where('user_id', $staff->id)->delete();
            activity_log('staffStopped', 'sensitive', ['name' => $staff->name]);
        }

        return new StaffResource($staff);
    }

    public function resetPassword(User $staff)
    {
        $this->ensureSamePharmacy($staff);
        abort_if($staff->role === 'manager', 404);
        $password = temporary_password();
        $staff->update(['password' => Hash::make($password)]);

        return response()->json(['data' => ['temporaryPassword' => $password]]);
    }

    private function ensureSamePharmacy(User $staff): void
    {
        abort_unless($staff->pharmacy_id === auth()->user()->pharmacy_id, 404);
    }
}
```

> انتبهي لـ `additional`: بيدمج `temporaryPassword` جوا `data` جنب بيانات الموظف، وهاد الشكل اللي الفرونت بيستناه.
>
> وليش `ensureSamePharmacy`؟ لأنه موديل `User` ما فيه الفلتر العام (صاحبة المنصة كمان `User` وما إلها صيدلية). فلازم نفحص يدوي.

---

## سجل النشاط

### شو بيصير بالشاشة

قائمة بكل اللي صار بالصيدلية: مين عمل شو ومتى. فوقها فلاتر: الفترة (اليوم، الأسبوع، الشهر)، الموظف، النوع، "الحساس بس"، وبحث.

### الطلب

```http
GET /api/activity?period=week&actor=3&kind=sensitive&sensitive=1&search=ريفانين
```

| المعامل     | القيم                                              | إذا ما انبعت |
| ----------- | -------------------------------------------------- | ------------ |
| `period`    | `today`، `week` (آخر 7 أيام)، `month` (آخر 30 يوم) | `today`      |
| `actor`     | رقم الموظف                                         | كل الموظفين  |
| `kind`      | `sale`، `sensitive`، `stock`، `settings`، `login`  | كل الأنواع   |
| `sensitive` | `1`                                                | الكل         |
| `search`    | نص، بيدور بالقيم والتفاصيل                         | بدون بحث     |

### الرد

```json
{
  "data": [
    {
      "id": 812,
      "at": "2026-11-24T10:42:00+02:00",
      "actor": { "id": 3, "name": "محمد العطار" },
      "kind": "sale",
      "event": "discount",
      "params": { "amount": 12, "invoice": "INV-01482" },
      "detail": "خصم 10% بموافقة المديرة"
    }
  ]
}
```

**أهم شي هون:** السيرفر ما بيبعت جملة جاهزة. بيبعت **رمز الحدث** (`event`) و**القيم** (`params`)، والفرونت بيركب الجملة بلغة المستخدم:

```
discount   +  { amount: 12, invoice: "INV-01482" }
    ↓
"عمل خصم 12 ₪ على فاتورة INV-01482"
"Gave a 12 ₪ discount on invoice INV-01482"
```

الأحداث المعروفة والقيم اللي كل حدث بيحتاجها:

| الحدث             | النوع       | القيم                 |
| ----------------- | ----------- | --------------------- |
| `discount`        | `sale`      | `amount`، `invoice`   |
| `settingsChanged` | `settings`  | `field`، `from`، `to` |
| `bulkEdit`        | `stock`     | `count`               |
| `damage`          | `stock`     | `product`             |
| `returnApproved`  | `sale`      | `invoice`             |
| `countStarted`    | `stock`     | `section`             |
| `login`           | `login`     | ما في                 |
| `shiftOpened`     | `sale`      | `shift`، `amount`     |
| `staffAdded`      | `settings`  | `name`                |
| `staffStopped`    | `sensitive` | `name`                |

لو بدك حدث جديد، ضيفيه بالمكانين: هون بالسيرفر، وبملف الترجمة بالفرونت تحت:

```
activity.events
```

وبقائمة الأحداث بـ:

```
src/entities/activity/model/types.ts
```

### بلارافيل

```php
// app/Support/helpers.php
function activity_log(string $event, string $kind, array $params = [], ?string $detail = null): void
{
    $user = auth()->user();

    \App\Models\ActivityLog::create([
        'pharmacy_id' => $user->pharmacy_id,
        'user_id' => $user->id,
        'kind' => $kind,
        'event' => $event,
        'params' => $params,
        'detail' => $detail,
    ]);
}
```

```php
// app/Http/Controllers/ActivityController.php
public function index(Request $request)
{
    $from = match ($request->query('period', 'today')) {
        'week' => today()->subDays(6),
        'month' => today()->subDays(29),
        default => today(),
    };

    $logs = ActivityLog::with('user:id,name')
        ->where('created_at', '>=', $from)
        ->when($request->query('actor'), fn ($q, $id) => $q->where('user_id', $id))
        ->when($request->query('kind'), fn ($q, $kind) => $q->where('kind', $kind))
        ->when($request->boolean('sensitive'), fn ($q) => $q->where('kind', 'sensitive'))
        ->when($request->query('search'), fn ($q, $s) => $q->where(fn ($w) => $w
            ->where('params', 'like', "%{$s}%")->orWhere('detail', 'like', "%{$s}%")))
        ->latest()
        ->limit(500)
        ->get();

    return ActivityResource::collection($logs);
}
```

```php
// app/Http/Resources/ActivityResource.php
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'at' => $this->created_at->toIso8601String(),
        'actor' => ['id' => $this->user->id, 'name' => $this->user->name],
        'kind' => $this->kind,
        'event' => $this->event,
        'params' => (object) $this->params,
        'detail' => $this->detail,
    ];
}
```

> `(object) $this->params`: لو القيم فاضية، PHP بيرجع `[]` بدل `{}`. التحويل لكائن بيخليه دايماً `{}`، والفرونت بيستنى كائن.
>
> عن البحث بالعربي: الفرونت بيوحد الهمزات والتاء المربوطة قبل البحث (أ إ آ ← ا، ة ← ه). لو بدك نفس النتيجة بالسيرفر، خزني عمود بحث منظف، أو استخدمي ترتيب أحرف بيتجاهل الفروقات. الملف اللي بيعمل هالتوحيد بالفرونت: `src/shared/lib/arabic-search/`.

---

## الإعدادات

### شو بيصير بالشاشة

صفحة طويلة بأقسام: بيانات الصيدلية، البيع، المخزون، الطباعة، الباقة، النسخة الاحتياطية، والمظهر. فوق في شريط ثابت فيه زر حفظ واحد لكل الأقسام.

لما تضغطي حفظ، الفرونت بيبعت **طلبين ورا بعض**:

```http
PUT /api/pharmacy      ← بيانات الصيدلية (مشروح بالوحدة 1)
PUT /api/settings      ← باقي الأقسام
```

قسم المظهر (اللغة والنهاري والليلي) بينحفظ بالمتصفح بس، وما بيروح للسيرفر.

### الملفات

| شو            | وين                                                       |
| ------------- | --------------------------------------------------------- |
| الأنواع       | `src/entities/pharmacy/model/settings.ts`                 |
| الطلبات       | `src/entities/pharmacy/api/settings-api.ts`               |
| قواعد النموذج | `src/features/settings/edit-settings/model/schema.ts`     |
| النموذج       | `src/features/settings/edit-settings/ui/SettingsForm.tsx` |

### القراءة

```http
GET /api/settings
```

```json
{
  "data": {
    "sale": {
      "paymentMethods": { "cash": true, "bankApp": true, "credit": true },
      "bankAppNames": "بنك فلسطين، جوال باي",
      "defaultDebtLimit": 300,
      "returnDays": 14,
      "shiftsEnabled": true,
      "sellByUnit": true,
      "sellAtZero": false
    },
    "stock": {
      "expiryAlertDays": 90,
      "defaultMinStock": 5,
      "dailyDigest": true
    },
    "print": {
      "receiptSize": "80mm",
      "autoPrint": true,
      "footer": "شكراً لزيارتكم، دمتم بصحة.",
      "labelSize": "38x25"
    },
    "backup": {
      "lastBackupAt": "2026-11-24T01:00:00Z"
    }
  }
}
```

### الحفظ

```http
PUT /api/settings
```

نفس الشكل **بدون** `backup` (هاد للقراءة بس).

### معنى كل إعداد ووين بيأثر

| الإعداد                       | القاعدة            | معناه                             | مين بيستخدمه بالسيرفر        |
| ----------------------------- | ------------------ | --------------------------------- | ---------------------------- |
| `sale.paymentMethods.cash`    | منطقي              | الدفع نقدي مسموح                  | البيع (الوحدة 6)             |
| `sale.paymentMethods.bankApp` | منطقي              | الدفع بتطبيق بنكي مسموح           | البيع                        |
| `sale.paymentMethods.credit`  | منطقي              | البيع بالدين مسموح                | البيع                        |
| `sale.bankAppNames`           | نص                 | أسماء التطبيقات، بتطلع للكاشير    | ما في                        |
| `sale.defaultDebtLimit`       | 0 لـ 100000        | حد الدين لأي زبون جديد            | إضافة زبون (الوحدة 7)        |
| `sale.returnDays`             | 0 لـ 365           | كم يوم بعد البيع المرتجع مسموح    | المرتجعات (الوحدة 6)         |
| `sale.shiftsEnabled`          | منطقي              | لازم وردية مفتوحة عشان تبيع       | البيع                        |
| `sale.sellByUnit`             | منطقي              | البيع بالشريط والحبة مسموح        | البيع                        |
| `sale.sellAtZero`             | منطقي              | البيع لما المخزون صفر مسموح       | البيع                        |
| `stock.expiryAlertDays`       | 1 لـ 730           | كم يوم قبل الانتهاء بيطلع التنبيه | حالة الصنف، التنبيهات (3 و9) |
| `stock.defaultMinStock`       | 0 لـ 10000         | الحد الأدنى لأي صنف جديد          | إضافة صنف (الوحدة 3)         |
| `stock.dailyDigest`           | منطقي              | ملخص يومي على واتساب للمديرة      | مهمة مجدولة                  |
| `print.receiptSize`           | `80mm` `58mm` `A4` | حجم الإيصال                       | ما في، الفرونت بيطبع         |
| `print.autoPrint`             | منطقي              | اطبع الإيصال بعد كل بيع لحاله     | ما في                        |
| `print.footer`                | لحد 200 حرف        | سطر آخر الإيصال                   | ما في                        |
| `print.labelSize`             | `38x25` `50x30`    | حجم ملصق السعر                    | ما في                        |

> لاحظي: كتير إعدادات بتأثر على وحدات تانية. لما تبني البيع مثلاً، لازم الكونترولر يقرا `sellAtZero` و`shiftsEnabled` من هون. فخلي قراءة الإعدادات سهلة من أي مكان:
>
> ```php
> $settings = auth()->user()->pharmacy->settings;
> if (! $settings->sell_at_zero && $batchQuantity < $needed) { ... }
> ```

### بلارافيل

جدول بصف واحد لكل صيدلية. أعمدة عادية أسهل من عمود JSON، لأنك بتحتاجي تقري كل إعداد لحاله بالوحدات التانية:

```php
Schema::create('settings', function (Blueprint $table) {
    $table->id();
    $table->foreignId('pharmacy_id')->unique()->constrained()->cascadeOnDelete();
    // البيع
    $table->boolean('pay_cash')->default(true);
    $table->boolean('pay_bank_app')->default(false);
    $table->boolean('pay_credit')->default(false);
    $table->string('bank_app_names')->default('');
    $table->unsignedInteger('default_debt_limit')->default(300);
    $table->unsignedSmallInteger('return_days')->default(14);
    $table->boolean('shifts_enabled')->default(true);
    $table->boolean('sell_by_unit')->default(true);
    $table->boolean('sell_at_zero')->default(false);
    // المخزون
    $table->unsignedSmallInteger('expiry_alert_days')->default(90);
    $table->unsignedInteger('default_min_stock')->default(5);
    $table->boolean('daily_digest')->default(true);
    // الطباعة
    $table->enum('receipt_size', ['80mm', '58mm', 'A4'])->default('80mm');
    $table->boolean('auto_print')->default(true);
    $table->string('receipt_footer', 200)->default('');
    $table->enum('label_size', ['38x25', '50x30'])->default('38x25');
    // النسخة الاحتياطية
    $table->timestamp('last_backup_at')->nullable();
    $table->timestamps();
});
```

```php
// app/Http/Resources/SettingsResource.php
public function toArray(Request $request): array
{
    return [
        'sale' => [
            'paymentMethods' => [
                'cash' => $this->pay_cash,
                'bankApp' => $this->pay_bank_app,
                'credit' => $this->pay_credit,
            ],
            'bankAppNames' => $this->bank_app_names,
            'defaultDebtLimit' => $this->default_debt_limit,
            'returnDays' => $this->return_days,
            'shiftsEnabled' => $this->shifts_enabled,
            'sellByUnit' => $this->sell_by_unit,
            'sellAtZero' => $this->sell_at_zero,
        ],
        'stock' => [
            'expiryAlertDays' => $this->expiry_alert_days,
            'defaultMinStock' => $this->default_min_stock,
            'dailyDigest' => $this->daily_digest,
        ],
        'print' => [
            'receiptSize' => $this->receipt_size,
            'autoPrint' => $this->auto_print,
            'footer' => $this->receipt_footer,
            'labelSize' => $this->label_size,
        ],
        'backup' => [
            'lastBackupAt' => $this->last_backup_at?->toIso8601String(),
        ],
    ];
}
```

```php
// app/Http/Requests/UpdateSettingsRequest.php
public function rules(): array
{
    return [
        'sale.paymentMethods.cash' => ['required', 'boolean'],
        'sale.paymentMethods.bankApp' => ['required', 'boolean'],
        'sale.paymentMethods.credit' => ['required', 'boolean'],
        'sale.bankAppNames' => ['present', 'nullable', 'string', 'max:200'],
        'sale.defaultDebtLimit' => ['required', 'integer', 'between:0,100000'],
        'sale.returnDays' => ['required', 'integer', 'between:0,365'],
        'sale.shiftsEnabled' => ['required', 'boolean'],
        'sale.sellByUnit' => ['required', 'boolean'],
        'sale.sellAtZero' => ['required', 'boolean'],
        'stock.expiryAlertDays' => ['required', 'integer', 'between:1,730'],
        'stock.defaultMinStock' => ['required', 'integer', 'between:0,10000'],
        'stock.dailyDigest' => ['required', 'boolean'],
        'print.receiptSize' => ['required', 'in:80mm,58mm,A4'],
        'print.autoPrint' => ['required', 'boolean'],
        'print.footer' => ['present', 'nullable', 'string', 'max:200'],
        'print.labelSize' => ['required', 'in:38x25,50x30'],
    ];
}

public function toModel(): array
{
    return [
        'pay_cash' => $this->boolean('sale.paymentMethods.cash'),
        'pay_bank_app' => $this->boolean('sale.paymentMethods.bankApp'),
        'pay_credit' => $this->boolean('sale.paymentMethods.credit'),
        'bank_app_names' => (string) $this->input('sale.bankAppNames'),
        'default_debt_limit' => $this->integer('sale.defaultDebtLimit'),
        'return_days' => $this->integer('sale.returnDays'),
        'shifts_enabled' => $this->boolean('sale.shiftsEnabled'),
        'sell_by_unit' => $this->boolean('sale.sellByUnit'),
        'sell_at_zero' => $this->boolean('sale.sellAtZero'),
        'expiry_alert_days' => $this->integer('stock.expiryAlertDays'),
        'default_min_stock' => $this->integer('stock.defaultMinStock'),
        'daily_digest' => $this->boolean('stock.dailyDigest'),
        'receipt_size' => $this->input('print.receiptSize'),
        'auto_print' => $this->boolean('print.autoPrint'),
        'receipt_footer' => (string) $this->input('print.footer'),
        'label_size' => $this->input('print.labelSize'),
    ];
}
```

```php
// app/Http/Controllers/SettingsController.php
public function show(Request $request)
{
    return new SettingsResource($request->user()->pharmacy->settings);
}

public function update(UpdateSettingsRequest $request)
{
    $settings = $request->user()->pharmacy->settings;
    $settings->fill($request->toModel());

    // سطر بالسجل لكل إعداد مهم اتغير
    foreach (['expiry_alert_days' => 'مدة تنبيه الصلاحية', 'return_days' => 'مدة المرتجع', 'sell_at_zero' => 'البيع على صفر'] as $column => $label) {
        if ($settings->isDirty($column)) {
            activity_log('settingsChanged', 'settings', [
                'field' => $label,
                'from' => $settings->getOriginal($column),
                'to' => $settings->{$column},
            ]);
        }
    }

    $settings->save();

    return new SettingsResource($settings);
}
```

---

## شعار الصيدلية

بقسم بيانات الصيدلية، في مربع الشعار وزر "تغيير الشعار". الشعار **بينحفظ لحاله أول ما تختاري الصورة**، بدون ما يستنى زر الحفظ.

### الطلب

```http
POST /api/pharmacy/logo
Content-Type: multipart/form-data; boundary=...
```

حقل واحد اسمه `logo` فيه الصورة.

> الفرونت ما بيحط `Content-Type` بإيده هون. المتصفح بيحطه لحاله مع الفاصل. لو جربتي بـ Postman، اختاري form-data.

### القواعد

| القاعدة | القيمة             | رمز الخطأ  |
| ------- | ------------------ | ---------- |
| النوع   | PNG أو JPG أو WebP | `logoType` |
| الحجم   | لحد 1 ميغا         | `logoSize` |
| موجود   |                    | `required` |

الفرونت بيفحص نفس القواعد قبل ما يبعت، بس لازم السيرفر يفحص كمان.

### الرد

بيانات الصيدلية كاملة، و`logoUrl` فيه رابط الصورة الجديدة.

### بلارافيل

```php
public function logo(Request $request)
{
    $request->validate(
        ['logo' => ['required', 'file', 'mimes:png,jpg,jpeg,webp', 'max:1024']],
        ['logo.required' => 'required', 'logo.mimes' => 'logoType', 'logo.file' => 'logoType', 'logo.max' => 'logoSize'],
    );

    $pharmacy = $request->user()->pharmacy;
    $old = $pharmacy->logo_path;
    $pharmacy->update(['logo_path' => $request->file('logo')->store("logos/{$pharmacy->id}", 'public')]);
    if ($old) {
        Storage::disk('public')->delete($old);
    }

    return new PharmacyResource($pharmacy);
}
```

ولا تنسي:

```bash
php artisan storage:link
```

---

## النسخة الاحتياطية

القسم بيعرض "آخر نسخة: …" من `backup.lastBackupAt`، وزر "نزّل نسخة". الزر رابط عادي، مش طلب من أداة الطلب:

```http
GET /api/backup/export
```

المتصفح بيفتحه مباشرة، والكوكيز بتنبعت معه لحالها. فلازم الرد يكون ملف للتنزيل:

```php
public function export(Request $request)
{
    $pharmacy = $request->user()->pharmacy;
    $file = app(BackupService::class)->exportToZip($pharmacy);   // ملفات CSV للأصناف والزبائن والفواتير...

    $pharmacy->settings->update(['last_backup_at' => now()]);

    return response()->download($file, "pharmasmart-backup-{$pharmacy->id}-".today()->toDateString().'.zip')
        ->deleteFileAfterSend();
}
```

والنسخة اليومية التلقائية مهمة مجدولة:

```php
// routes/console.php
Schedule::job(new DailyBackup)->dailyAt('01:00');
```

---

## الجداول

```php
Schema::create('activity_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('pharmacy_id')->constrained()->cascadeOnDelete();
    $table->foreignId('user_id')->constrained();
    $table->enum('kind', ['sale', 'sensitive', 'stock', 'settings', 'login']);
    $table->string('event', 40);
    $table->json('params')->nullable();
    $table->string('detail')->nullable();
    $table->timestamp('created_at')->useCurrent();

    $table->index(['pharmacy_id', 'created_at']);
});
```

```php
// app/Models/ActivityLog.php
class ActivityLog extends Model
{
    use BelongsToPharmacy;

    public const UPDATED_AT = null;
    protected $guarded = [];
    protected $casts = ['params' => 'array'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```

جدول `settings` فوق، وجدول `users` بالوحدة 1.

---

## الروابط بملف لارافيل

```php
// القراءة بتلزم الكل:
// - قائمة الموظفين: المرتجعات (اختيار الموافق)، وفلتر الموظف بالفواتير
// - الإعدادات: نقطة البيع (طرق الدفع، البيع بالحبة) والمرتجعات (مدة الإرجاع) والملصقات
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/staff', [StaffController::class, 'index']);
    Route::get('/settings', [SettingsController::class, 'show']);
});

Route::middleware(['auth:sanctum', 'role:manager'])->group(function () {
    Route::post('/staff', [StaffController::class, 'store']);
    Route::put('/staff/{staff}', [StaffController::class, 'update']);
    Route::patch('/staff/{staff}/status', [StaffController::class, 'status']);
    Route::post('/staff/{staff}/reset-password', [StaffController::class, 'resetPassword']);

    Route::get('/activity', [ActivityController::class, 'index']);

    Route::put('/settings', [SettingsController::class, 'update']);
    Route::get('/backup/export', [BackupController::class, 'export']);
});
```

`{staff}` بيتحول لموديل `User` تلقائياً إذا عرفتيه:

```php
// app/Providers/AppServiceProvider.php
Route::model('staff', User::class);
```

---

## اختبري حالك

- [ ] إضافة موظف بتعرض كلمة مرور مؤقتة، والموظف بيقدر يدخل فيها
- [ ] إضافة موظف برقم مستخدم بتعرض الخطأ تحت الجوال
- [ ] إيقاف موظف بيطلعه من النظام فوراً، وما بيقدر يدخل
- [ ] الصيدلي والكاشير بيوصلهم 403 على كل هالروابط، إلا قراءة قائمة الموظفين
- [ ] سجل النشاط بيعرض سطر "ضاف الموظف…" بعد الإضافة
- [ ] تغيير مدة تنبيه الصلاحية بيطلع بالسجل بالقيمتين
- [ ] الحفظ بالإعدادات بيرجع نفس القيم بعد تحديث الصفحة
- [ ] رفع ملف PDF كشعار بيرجع `logoType`
- [ ] زر النسخة الاحتياطية بينزل ملف
