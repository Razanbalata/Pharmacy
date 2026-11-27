# دليل الربط مع لارافيل

هاد الدليل بيشرح المشروع من جهة الباك إند. لكل صفحة: مين بيفتحها، شو بتعرض، أي روابط بتطلب، شكل البيانات اللي بتنبعت وبترجع، قواعد الفحص، رموز الأخطاء، والكود اللي بتحتاجيه بلارافيل.

الفرق بينه وبين ملف العقد:

```
BACKEND_CONTRACT.md
```

العقد هو قائمة الروابط مختصرة. هاد الدليل هو الشرح الطويل مع الكود، عشان تبني عليه وإنتِ فاهمة ليش كل شي هيك.

## المحتويات

1. [الصورة الكبيرة](#الصورة-الكبيرة)
2. [رحلة طلب واحد من الصفحة للسيرفر](#رحلة-طلب-واحد-من-الصفحة-للسيرفر)
3. [وين ألاقي كل شي بالكود](#وين-ألاقي-كل-شي-بالكود)
4. [القواعد اللي بتمشي على كل الروابط](#القواعد-اللي-بتمشي-على-كل-الروابط)
5. [تجهيز لارافيل مرة وحدة](#تجهيز-لارافيل-مرة-وحدة)
6. [خريطة الجداول](#خريطة-الجداول)
7. [ترتيب البناء المقترح](#ترتيب-البناء-المقترح)
8. [كيف تبدلي من السيرفر الوهمي للارافيل](#كيف-تبدلي-من-السيرفر-الوهمي-للارافيل)
9. [ملفات الوحدات](#ملفات-الوحدات)

---

## الصورة الكبيرة

المشروع نظام لإدارة الصيدليات، بيشتغل لأكتر من صيدلية على نفس السيرفر. كل صيدلية إلها موظفينها وأصنافها ومبيعاتها، وما حدا بيشوف بيانات صيدلية تانية.

في نوعين مستخدمين:

| المستخدم     | وين بيشتغل              | شو بيشوف                                            |
| ------------ | ----------------------- | --------------------------------------------------- |
| موظف صيدلية  | كل الصفحات تحت `/`      | بيانات صيدليته بس، وحسب دوره                        |
| صاحبة المنصة | الصفحات تحت `/platform` | الصيدليات كلها، والطلبات، والاشتراكات. بدون أسرارهم |

موظف الصيدلية إله واحد من تلات أدوار:

| الدور   | القيمة بالكود | شو بيقدر يعمل                                                                   |
| ------- | ------------- | ------------------------------------------------------------------------------- |
| المديرة | `manager`     | كل شي                                                                           |
| الصيدلي | `pharmacist`  | البيع والأصناف والمخزون والمشتريات والتقارير. بدون المالية والموظفين والإعدادات |
| الكاشير | `cashier`     | البيع والفواتير والمرتجعات والزبائن، وبيشوف الأصناف بدون ما يعدلها              |

وفي صلاحيات إضافية المديرة بتعطيها لأي موظف:

| الصلاحية       | القيمة بالكود      | معناها                         |
| -------------- | ------------------ | ------------------------------ |
| البيع بالدين   | `sellOnCredit`     | يقدر يعمل فاتورة آجلة          |
| شوف سعر الشراء | `seePurchasePrice` | بيشوف التكلفة وهامش الربح      |
| اعتماد الجرد   | `approveCounts`    | للصيدلي بس: يعتمد فروقات الجرد |

الملف اللي فيه هالقواعد بالفرونت:

```
src/entities/session/model/permissions.ts
```

> السيرفر لازم يفحص الدور والصلاحية بكل رابط. الفرونت بيخبي الأزرار بس، وهاد مش حماية.

---

## رحلة طلب واحد من الصفحة للسيرفر

خلينا نتبع صفحة الزبائن من أولها لآخرها. نفس الطريق بالضبط بيتكرر بكل صفحة.

**1. المستخدمة بتفتح الرابط** `/customers`.

ملف الروابط بيحدد أي صفحة بتنفتح:

```
src/app/routes/routes.tsx
```

**2. الصفحة بتطلب البيانات.** الصفحة ما بتكلم السيرفر مباشرة. بتطلب "استعلام" جاهز من طبقة الكيانات:

```tsx
// src/pages/customers/list/ui/CustomersPage.tsx
const list = useQuery(customerQueries.list(filter, search))
```

**3. الاستعلام بيعرف الرابط والمفتاح.** كل كيان إله ملف بيجمع كل طلباته:

```ts
// src/entities/customer/api/customer-api.ts
export async function listCustomers(filter: CustomerFilter, search: string): Promise<CustomerList> {
  return http.get<CustomerList>('/api/customers', { query: { filter, search } })
}

export const customerQueries = {
  all: ['customers'] as const,
  list: (filter: CustomerFilter, search: string) =>
    queryOptions({
      queryKey: [...customerQueries.all, 'list', filter, search],
      queryFn: () => listCustomers(filter, search),
    }),
}
```

المفتاح `['customers', 'list', filter, search]` هو اسم النتيجة بالذاكرة. لما ينسجل تسديد جديد، الفرونت بيمسح كل شي بيبدأ بـ `customers` فبتنطلب من جديد. يعني إنتِ ما بتحتاجي تعملي شي بالسيرفر عشان الشاشة تتحدث.

**4. أداة الطلب بتجهز الطلب.** ملف واحد بيبعت كل الطلبات:

```
src/shared/api/http.ts
```

هو اللي بيحط الهيدرز، وبيبعت الكوكيز، وبيحول أي خطأ لشكل واحد. شو بيبعت بالضبط:

```http
GET /api/customers?filter=withDebt&search=محمد HTTP/1.1
Accept: application/json
X-Requested-With: XMLHttpRequest
Cookie: laravel_session=...; XSRF-TOKEN=...
```

ولو الطلب بيغير شي (POST أو PUT أو PATCH أو DELETE) بيضيف:

```http
Content-Type: application/json
X-XSRF-TOKEN: ...
```

**5. مين بيرد؟** هلق بالتطوير، في سيرفر وهمي شغال جوا المتصفح وبيرد بدل لارافيل:

```
src/app/mocks/handlers/customers.ts
```

هاد الملف مهم إلك كتير: هو فعلياً نسخة مبسطة من الكونترولر اللي لازم تكتبيه. فيه الفلترة والفحص وحساب الدين وأشكال الأخطاء. لما تبني أي رابط بلارافيل، افتحي الملف المقابل واتبعيه.

**6. لارافيل بيرد بنفس الشكل.** الرد لازم يطابق النوع اللي الفرونت مستنيه، وهو مكتوب بملف الأنواع:

```
src/entities/customer/model/types.ts
```

---

## وين ألاقي كل شي بالكود

المشروع مقسم طبقات. كل طبقة بتستخدم اللي تحتها بس.

| الطبقة   | المجلد          | شو فيها                                    | بتهمك بالباك إند؟          |
| -------- | --------------- | ------------------------------------------ | -------------------------- |
| التطبيق  | `src/app/`      | الروابط، القالب العام، والسيرفر الوهمي     | السيرفر الوهمي: نعم كتير   |
| الصفحات  | `src/pages/`    | كل شاشة كاملة                              | لتعرفي شو الشاشة بتعرض     |
| الأجزاء  | `src/widgets/`  | قطع كبيرة متكررة: السايدبار، الشريط العلوي | قليل                       |
| الأفعال  | `src/features/` | كل شي بيغير بيانات: إضافة، تعديل، بيع      | نعم: النماذج وقواعد الفحص  |
| الكيانات | `src/entities/` | الزبون، الصنف، الفاتورة… أنواعها وطلباتها  | نعم كتير: الأنواع والروابط |
| المشترك  | `src/shared/`   | أداة الطلب، الترجمة، الأزرار والحقول       | أداة الطلب بس              |

لكل كيان أو فعل، الملفات اللي بتهمك دايماً بنفس المكان:

| شو بدك تعرفي           | الملف                                          |
| ---------------------- | ---------------------------------------------- |
| شكل البيانات           | `src/entities/<name>/model/types.ts`           |
| الروابط اللي بتنطلب    | `src/entities/<name>/api/<name>-api.ts`        |
| قواعد فحص النموذج      | `src/features/<name>/<action>/model/schema.ts` |
| كيف السيرفر لازم يتصرف | `src/app/mocks/handlers/<area>.ts`             |
| بيانات تجريبية واقعية  | `src/app/mocks/<area>-data.ts`                 |

---

## القواعد اللي بتمشي على كل الروابط

### 1. أسماء الحقول بالجمل المتصلة

الفرونت بيستخدم أسماء زي `nameAr` و`minStock` و`planEndsAt`. لارافيل والقاعدة بيستخدموا أسماء بشرطة زي `name_ar`. التحويل بيصير بالريسورس، وبنموذج الطلب.

بالرد، الريسورس بيكتب الأسماء زي ما الفرونت بدو:

```php
// app/Http/Resources/ProductResource.php
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'nameAr' => $this->name_ar,
        'minStock' => (float) $this->min_stock,
    ];
}
```

وبالطلب، قواعد الفحص بتكون على أسماء الفرونت، وبعدين بنحولها قبل الحفظ:

```php
// app/Http/Requests/StoreProductRequest.php
public function rules(): array
{
    return [
        'name' => ['required', 'string', 'max:120'],
        'nameAr' => ['nullable', 'string', 'max:120'],
        'minStock' => ['required', 'numeric', 'min:0'],
    ];
}

public function toModel(): array
{
    return [
        'name' => $this->input('name'),
        'name_ar' => $this->input('nameAr'),
        'min_stock' => $this->input('minStock'),
    ];
}
```

> ليش ما بنحول الأسماء تلقائياً بميدلوير؟ لأنه بعض الحقول جواتها قوائم وكائنات، والتحويل التلقائي بيلخبط أسماء الأخطاء. التحويل اليدوي أوضح، وبتعرفي بالضبط شو داخل القاعدة.

### 2. الرد دايماً جوا `data`

كائن واحد:

```json
{ "data": { "id": 7, "name": "محمد" } }
```

قائمة بدون صفحات:

```json
{ "data": [{ "id": 1 }, { "id": 2 }] }
```

هاد الشكل اللي بيطلع من الريسورس بلارافيل تلقائياً:

```php
return new CustomerResource($customer);
return CustomerResource::collection($customers);
```

### 3. القوائم الطويلة بصفحات، وبشكل خاص

الفرونت **ما** بيستخدم شكل الصفحات الجاهز تبع لارافيل. بيستنى هاد:

```json
{
  "data": [{ "id": 1 }],
  "meta": { "total": 143, "page": 2, "perPage": 25 },
  "counts": { "all": 143, "debt": 12, "overdue": 3 }
}
```

`counts` موجودة بالقوائم اللي فوقها تبويبات، وبتعطي عدد كل تبويب حسب البحث الحالي.

اعملي دالة مساعدة وحدة واستخدميها بكل مكان:

```php
// app/Support/Paginated.php
namespace App\Support;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class Paginated
{
    public static function make(LengthAwarePaginator $page, string $resource, array $extra = []): array
    {
        return [
            'data' => $resource::collection($page->items()),
            'meta' => [
                'total' => $page->total(),
                'page' => $page->currentPage(),
                'perPage' => $page->perPage(),
            ],
            ...$extra,
        ];
    }
}
```

واستخدامها:

```php
$page = $query->paginate($request->integer('perPage', 25), page: $request->integer('page', 1));

return response()->json(Paginated::make($page, CustomerResource::class, [
    'counts' => $counts,
]));
```

### 4. الأخطاء رموز قصيرة، مش جمل

لما النموذج فيه غلط، الرد حالة 422 بهاد الشكل:

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "phone": ["taken"],
    "name": ["required"]
  }
}
```

لاحظي: جوا `errors` في **رمز** زي `taken`، مش جملة زي "رقم الجوال مستخدم". الفرونت بيترجم الرمز لعربي أو إنجليزي حسب لغة المستخدم. الملف اللي بيعمل هيك:

```
src/shared/lib/forms/server-errors.ts
```

بلارافيل، رجعي الرموز من دالة الرسائل:

```php
public function messages(): array
{
    return [
        'phone.unique' => 'taken',
        'phone.regex' => 'invalid',
        'name.required' => 'required',
    ];
}
```

الرموز المستخدمة بالمشروع:

| الرمز               | معناه                              |
| ------------------- | ---------------------------------- |
| `required`          | الحقل فاضي                         |
| `taken`             | القيمة مستخدمة (جوال، باركود، اسم) |
| `invalid`           | الشكل غلط (جوال، رمز تحقق)         |
| `credentials`       | الجوال أو كلمة المرور غلط          |
| `requiredForCredit` | البيع بالدين بدو زبون معه جوال     |
| `logoType`          | الشعار مش صورة مسموحة              |
| `logoSize`          | الشعار أكبر من 1 ميغا              |

وكل وحدة فيها رموزها الخاصة، مكتوبة بملفها.

### 5. حالات الرد وشو بيعمل الفرونت فيها

| الحالة   | معناها                           | شو بيعمل الفرونت                                                                                |
| -------- | -------------------------------- | ----------------------------------------------------------------------------------------------- |
| 200      | تمام                             | بيعرض                                                                                           |
| 201      | انضاف                            | بيعرض رسالة نجاح                                                                                |
| 204      | تمام وما في شي يرجع              | ما بيقرا الرد                                                                                   |
| 401, 419 | مش مسجل، أو الجلسة خلصت          | بيودي على صفحة الدخول                                                                           |
| 403      | مسجل بس دوره ما بيسمح            | رسالة خطأ. الفرونت أصلاً بيخبي الصفحات والأزرار المش مسموحة، فالـ 403 بتطلع لو في غلط بالصلاحيات |
| 404      | مش موجود، أو من صيدلية تانية     | صفحات التفاصيل (صنف، فاتورة، طلب) بتعرض "مش موجود"                                              |
| 409      | تعارض (مثلاً الوردية مفتوحة أصلاً) | رسالة خاصة بكل حالة                                                                             |
| 410      | انتهى (رابط تفعيل قديم)          | رسالة "الرابط انتهى"                                                                            |
| 422      | غلط بالنموذج                     | بيحط كل رمز تحت حقله                                                                            |
| 429      | محاولات كتير                     | بيستنى، وبيقرا `retryAfterMinutes` إذا موجود                                                    |

الملف اللي بيعرّف هالحالات:

```
src/shared/api/errors.ts
```

### 6. الأرقام والتواريخ

| النوع          | الشكل                         | مثال                          | بالقاعدة         |
| -------------- | ----------------------------- | ----------------------------- | ---------------- |
| مبلغ بالشيكل   | رقم عادي، مش نص               | `12.5`                        | `decimal(10, 2)` |
| كمية           | رقم، ممكن كسور (حبات من علبة) | `2.5`                         | `decimal(10, 3)` |
| تاريخ بدون وقت | `YYYY-MM-DD`                  | `"2026-12-12"`                | `date`           |
| تاريخ مع وقت   | ISO كامل مع المنطقة           | `"2026-11-24T09:15:00+02:00"` | `timestamp`      |
| نسبة           | رقم من 0 لـ 100               | `10`                          | `decimal(5, 2)`  |
| جوال           | 10 أرقام بتبدأ بـ 05          | `"0599920307"`                | `string(10)`     |

> انتبهي: لارافيل بيرجع الأعمدة العشرية كنص (`"12.50"`). لازم تحوليها لرقم بالريسورس: `(float) $this->price`. وإلا الحسابات بالفرونت بتطلع غلط.

للتواريخ مع وقت، خلي المنطقة الزمنية بالإعدادات:

```php
// config/app.php
'timezone' => 'Asia/Hebron',
```

وبالريسورس:

```php
'createdAt' => $this->created_at?->toIso8601String(),
'expiry' => $this->expiry?->toDateString(),
```

### 7. كل شي محصور بالصيدلية

أي جدول فيه بيانات صيدلية، فيه عمود `pharmacy_id`. وأي طلب بيرجع بيانات صيدلية المستخدم بس. الفرونت **ما** بيبعت رقم الصيدلية أبداً. السيرفر بياخده من المستخدم المسجل.

الطريقة الأسهل: ميزة مشتركة بتنضاف لكل موديل:

```php
// app/Models/Concerns/BelongsToPharmacy.php
namespace App\Models\Concerns;

use App\Models\Pharmacy;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToPharmacy
{
    protected static function bootBelongsToPharmacy(): void
    {
        static::addGlobalScope('pharmacy', function (Builder $query) {
            $user = auth()->user();
            if ($user && $user->pharmacy_id) {
                $query->where($query->qualifyColumn('pharmacy_id'), $user->pharmacy_id);
            }
        });

        static::creating(function ($model) {
            $model->pharmacy_id ??= auth()->user()?->pharmacy_id;
        });
    }

    public function pharmacy(): BelongsTo
    {
        return $this->belongsTo(Pharmacy::class);
    }
}
```

وبكل موديل:

```php
class Customer extends Model
{
    use BelongsToPharmacy;
}
```

هيك `Customer::find(5)` بيرجع الزبون بس إذا من صيدليتك، وإلا بيرجع لا شي، والرابط بيعطي 404. وهاد الصح: ما بنقول للمستخدم "هاد موجود بس مش إلك".

> انتبهي للفحوصات الفريدة. "رقم الجوال مستخدم" يعني مستخدم **بنفس الصيدلية**، مش بأي صيدلية:
>
> ```php
> Rule::unique('customers', 'phone')->where('pharmacy_id', $request->user()->pharmacy_id)
> ```

### 8. الأدوار بميدلوير

```php
// app/Http/Middleware/EnsureRole.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        abort_unless(in_array($request->user()?->role, $roles, true), 403);

        return $next($request);
    }
}
```

تسجيله:

```php
// bootstrap/app.php
->withMiddleware(function (Middleware $middleware) {
    $middleware->statefulApi();
    $middleware->alias(['role' => \App\Http\Middleware\EnsureRole::class]);
})
```

واستخدامه:

```php
Route::middleware(['auth:sanctum', 'role:manager'])->group(function () {
    Route::apiResource('staff', StaffController::class);
});
```

للصلاحيات الإضافية (البيع بالدين مثلاً)، افحصي جوا الكونترولر أو بـ Policy:

```php
abort_if($sale['paymentMethod'] === 'credit' && ! $user->canSellOnCredit(), 403);
```

### 9. الميدلوير اللي بيلف كل الروابط

| الاسم          | شو بيعمل                                                  | وين بيتشرح |
| -------------- | --------------------------------------------------------- | ---------- |
| `auth:sanctum` | لازم يكون مسجل                                            | هون        |
| `role:...`     | الدور من القائمة، وإلا 403                                | هون        |
| `pharmacy`     | المستخدم إله صيدلية. بيمنع صاحبة المنصة من روابط الصيدلية | الوحدة 11  |
| `active`       | الصيدلية الموقوفة بتقرا بس، وأي تغيير 403                 | الوحدة 11  |

```php
// routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', MeController::class);          // للكل، حتى صاحبة المنصة
    Route::post('/logout', [SessionController::class, 'destroy']);
});

Route::middleware(['auth:sanctum', 'pharmacy', 'active'])->group(function () {
    // باقي روابط الوحدات 1 لـ 10
});

Route::middleware(['auth:sanctum', 'role:platform_owner'])->prefix('platform')->group(function () {
    // روابط الوحدة 11
});
```

### 10. مين بيقرا شو: القراءات المشتركة

الصفحات بتقرا من وحدات غير وحدتها. لو حطيتي القراءة للمديرة بس، صفحة الكاشير رح تاخد 403 وتتعطل. هاي القراءات اللي لازم تكون مفتوحة لكل أدوار الصيدلية:

| الرابط                       | الوحدة | مين بيحتاجه غير المديرة                     |
| ---------------------------- | ------ | ------------------------------------------- |
| `GET /api/me`                | 1      | الكل                                        |
| `GET /api/settings`          | 2      | نقطة البيع، المرتجعات، الملصقات             |
| `GET /api/staff`             | 2      | المرتجعات (الموافق)، فلتر الكاشير بالفواتير |
| `GET /api/products` و`/{id}` | 3      | نقطة البيع، صفحة الأصناف للكاشير            |
| `GET /api/categories`        | 3      | فلتر الأصناف                                |
| `GET /api/ingredients`       | 3      | فلتر الأصناف                                |
| `GET /api/suppliers/options` | 4      | فلتر الأصناف                                |
| `GET /api/customers/options` | 7      | نقطة البيع                                  |
| `GET /api/shifts/current`    | 6      | نقطة البيع                                  |
| `GET /api/dashboard`         | 9      | لوحة الصيدلي والكاشير                       |

وجدول كامل بكل دور وكل منطقة:

```
src/entities/session/model/permissions.ts
```

### 11. سجل النشاط

كتير أفعال لازم تنكتب بسجل النشاط (مين حذف صنف، مين غير سعر، مين اعتمد جرد). الصفحة بالفرونت:

```
/staff/activity
```

اعملي دالة وحدة وناديها من كل كونترولر:

```php
activity_log('bulkEdit', 'stock', ['count' => 12]);
```

التفاصيل بملف الوحدة 2.

---

## تجهيز لارافيل مرة وحدة

### الحزم

```bash
composer create-project laravel/laravel pharmasmart-api
cd pharmasmart-api
php artisan install:api
```

الأمر الأخير بينزل Sanctum وبيعمل ملف الروابط:

```
routes/api.php
```

### الإعدادات بملف البيئة

```dotenv
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

SESSION_DRIVER=database
SESSION_DOMAIN=localhost
SANCTUM_STATEFUL_DOMAINS=localhost:5173

APP_TIMEZONE=Asia/Hebron
```

### السماح للفرونت بالطلب ومشاركة الكوكيز

```bash
php artisan config:publish cors
```

```php
// config/cors.php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:5173')],
'supports_credentials' => true,
```

### ربط الفرونت

بمشروع الفرونت، انسخي ملف المثال:

```bash
cp .env.example .env.local
```

وعدلي:

```dotenv
VITE_API_URL=http://localhost:8000
VITE_API_MOCKS=false
```

### الدخول بالجوال

الفرونت بيبعت `login` (جوال) و`password`. لارافيل بيدخل بالإيميل تلقائياً، فلازم تحددي العمود:

```php
// app/Http/Controllers/Auth/LoginController.php
public function store(LoginRequest $request)
{
    $phone = normalize_phone($request->input('login'));

    if (! Auth::attempt(['phone' => $phone, 'password' => $request->input('password'), 'active' => true], $request->boolean('remember'))) {
        RateLimiter::hit($request->throttleKey());

        return response()->json([
            'message' => 'Invalid credentials.',
            'errors' => ['login' => ['credentials']],
            'attemptsLeft' => $request->attemptsLeft(),
        ], 422);
    }

    $request->session()->regenerate();

    return new SessionUserResource($request->user());
}
```

التفاصيل الكاملة بملف الوحدة 1.

---

## خريطة الجداول

هاي كل الجداول اللي بيحتاجها المشروع، مع أهم الأعمدة. التفاصيل الكاملة (الهجرة والموديل) بملف كل وحدة.

```
pharmacies ─┬─ users (الموظفين)
            ├─ settings (صف واحد لكل صيدلية)
            ├─ categories
            ├─ ingredients
            ├─ products ─┬─ product_units
            │            └─ batches ──── stock_movements
            ├─ suppliers ─── supplier_ledger
            ├─ purchase_orders ─── purchase_order_items
            ├─ stock_counts ─── stock_count_lines
            ├─ damage_records
            ├─ shifts
            ├─ customers ─── customer_entries
            ├─ invoices ─── invoice_items ─── invoice_item_batches
            ├─ held_sales
            ├─ sale_returns ─── sale_return_items
            ├─ expenses
            ├─ activity_logs
            └─ assistant_conversations ─── assistant_messages

join_requests ─── activation_tokens   (طلبات الانضمام، قبل ما الصيدلية تنعمل)
password_reset_codes
imports                               (عشان التراجع عن الاستيراد)
alert_reads                           (مين قرا أي تنبيه، لكل مستخدم)
subscriptions                         (فترات الاشتراك لكل صيدلية)
subscription_events                   (سجل الاشتراك)
subscription_payments
plan_prices
catalog_entries                       (كتالوج الأدوية المشترك بين كل الصيدليات)
```

| الجدول                  | بالصيدلية؟             | الوحدة  |
| ----------------------- | ---------------------- | ------- |
| `pharmacies`            | هو نفسه                | 1       |
| `users`                 | نعم                    | 1، 2    |
| `join_requests`         | لا                     | 1       |
| `activation_tokens`     | لا                     | 1       |
| `password_reset_codes`  | لا                     | 1       |
| `settings`              | نعم                    | 2       |
| `activity_logs`         | نعم                    | 2       |
| `categories`            | نعم                    | 3       |
| `ingredients`           | نعم                    | 3       |
| `products`              | نعم                    | 3       |
| `product_units`         | عبر الصنف              | 3       |
| `batches`               | نعم                    | 3، 4، 5 |
| `catalog_entries`       | لا                     | 3       |
| `imports`               | نعم                    | 3       |
| `suppliers`             | نعم                    | 4       |
| `supplier_ledger`       | نعم                    | 4       |
| `purchase_orders`       | نعم                    | 4       |
| `purchase_order_items`  | عبر الطلب              | 4       |
| `stock_movements`       | نعم                    | 5       |
| `stock_counts`          | نعم                    | 5       |
| `stock_count_lines`     | عبر الجرد              | 5       |
| `damage_records`        | نعم                    | 5       |
| `shifts`                | نعم                    | 6، 8    |
| `invoices`              | نعم                    | 6       |
| `invoice_items`         | عبر الفاتورة           | 6       |
| `invoice_item_batches`  | عبر السطر              | 6       |
| `held_sales`            | نعم                    | 6       |
| `sale_returns`          | نعم                    | 6       |
| `sale_return_items`     | عبر المرتجع            | 6       |
| `customers`             | نعم                    | 7       |
| `customer_entries`      | نعم                    | 7       |
| `expenses`              | نعم                    | 8       |
| `alert_reads`           | عبر المستخدم           | 9       |
| `assistant_*`           | نعم                    | 10      |
| `subscriptions`         | نعم، بدون الفلتر العام | 11      |
| `subscription_events`   | نعم، بدون الفلتر العام | 11      |
| `subscription_payments` | نعم، بدون الفلتر العام | 11      |
| `plan_prices`           | لا                     | 11      |

---

## ترتيب البناء المقترح

كل خطوة بتعتمد على اللي قبلها. وبعد كل خطوة، شغلي الفرونت على لارافيل وجربي صفحاتها.

| الخطوة | شو تبني                                        | الصفحات اللي بتشتغل بعدها                       |
| ------ | ---------------------------------------------- | ----------------------------------------------- |
| 1      | الدخول، المستخدم الحالي، طلب الانضمام، التفعيل | الدخول، الانضمام، التفعيل، نسيت كلمة المرور     |
| 2      | الموظفين، الإعدادات، سجل النشاط                | الموظفين، السجل، الإعدادات                      |
| 3      | التصنيفات، المواد الفعالة، الأصناف، الدفعات    | الأصناف وكل صفحاتها                             |
| 4      | الموردين، طلبات الشراء، الاستلام               | المشتريات والموردين. وهون بيدخل أول مخزون حقيقي |
| 5      | الحركات، الجرد، التالف                         | المخزون                                         |
| 6      | الوردية، البيع، الفواتير، المرتجعات            | نقطة البيع والفواتير. هاي أهم خطوة              |
| 7      | الزبائن والديون والتسديد                       | الزبائن                                         |
| 8      | سجل الورديات والمصاريف                         | المالية                                         |
| 9      | التنبيهات ولوحة التحكم                         | لوحة التحكم والتنبيهات                          |
| 10     | التقارير والمساعد الذكي                        | التقارير والمساعد                               |
| 11     | لوحة صاحبة المنصة                              | صفحات `/platform`                               |

> نصيحة: ابني رابط واحد، وجربيه بالفرونت فوراً، وبعدين انتقلي للي بعده. لو بنيتي وحدة كاملة وبعدين جربتي، بتصير الأخطاء كتير مع بعض.

---

## كيف تبدلي من السيرفر الوهمي للارافيل

السيرفر الوهمي بيشتغل لما يكون:

```dotenv
VITE_API_MOCKS=true
```

لما تحطي `false`، كل الطلبات بتروح للارافيل. ما في نص ونص: إما كله وهمي أو كله حقيقي.

خلال البناء، لو بدك تشتغلي على وحدة وحدة، في طريقتين:

**الطريقة الأولى:** خلي الوهمي شغال، وجربي روابط لارافيل بـ Postman أو بـ Pest. لما تخلص الوحدة، بدلي وجربي بالفرونت.

**الطريقة التانية:** اعملي روابط لارافيل اللي لسا ما انبنت ترجع بيانات ثابتة مؤقتاً، بنفس الشكل اللي بالسيرفر الوهمي.

وللتأكد إنه الشكل مطابق، أسهل شي: افتحي أدوات المطور بالمتصفح، تبويب الشبكة، مع الوهمي شغال. شوفي الرد، وقارنيه برد لارافيل.

---

## ملفات الوحدات

| الوحدة | الملف                                              | الصفحات                                                                           |
| ------ | -------------------------------------------------- | --------------------------------------------------------------------------------- |
| 1      | [01-auth-onboarding.md](01-auth-onboarding.md)     | الدخول، الانضمام، التفعيل، نسيت كلمة المرور، التجهيز، البداية                     |
| 2      | [02-staff-settings.md](02-staff-settings.md)       | الموظفين، سجل النشاط، الإعدادات                                                   |
| 3      | [03-catalog.md](03-catalog.md)                     | الأصناف، تفاصيل صنف، إضافة وتعديل، الاستيراد، الملصقات، التصنيفات، المواد الفعالة |
| 4      | [04-purchases.md](04-purchases.md)                 | الموردين، طلبات الشراء، الاستلام                                                  |
| 5      | [05-stock.md](05-stock.md)                         | الحركات، الجرد، التالف                                                            |
| 6      | [06-sales.md](06-sales.md)                         | الوردية، نقطة البيع، الفواتير، المرتجعات                                          |
| 7      | [07-customers.md](07-customers.md)                 | الزبائن، تفاصيل زبون، التسديد                                                     |
| 8      | [08-finance.md](08-finance.md)                     | سجل الورديات، المصاريف                                                            |
| 9      | [09-dashboard-alerts.md](09-dashboard-alerts.md)   | لوحة التحكم، التنبيهات                                                            |
| 10     | [10-reports-assistant.md](10-reports-assistant.md) | التقارير، المساعد الذكي، التحليل                                                  |
| 11     | [11-platform.md](11-platform.md)                   | لوحة صاحبة المنصة                                                                 |
