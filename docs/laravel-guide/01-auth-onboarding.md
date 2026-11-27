# الوحدة 1: الدخول والانضمام وتجهيز الصيدلية

هاي أول وحدة لازم تنبني، لأنه بدونها ما في مستخدم، وبدون مستخدم ما في ولا صفحة بتفتح.

## المحتويات

1. [الصفحات](#الصفحات)
2. [القصة من أولها](#القصة-من-أولها)
3. [صفحة الدخول](#صفحة-الدخول)
4. [المستخدم الحالي](#المستخدم-الحالي)
5. [نسيت كلمة المرور](#نسيت-كلمة-المرور)
6. [طلب الانضمام](#طلب-الانضمام)
7. [التفعيل](#التفعيل)
8. [تجهيز الصيدلية](#تجهيز-الصيدلية)
9. [قائمة البداية](#قائمة-البداية)
10. [الجداول](#الجداول)
11. [الروابط بملف لارافيل](#الروابط-بملف-لارافيل)
12. [اختبري حالك](#اختبري-حالك)

---

## الصفحات

| الصفحة           | الرابط             | مين بيفتحها         | ملف الصفحة                                                 |
| ---------------- | ------------------ | ------------------- | ---------------------------------------------------------- |
| صفحة الزوار      | `/welcome`         | أي حد               | `src/pages/landing/ui/LandingPage.tsx`                     |
| الدخول           | `/login`           | أي حد               | `src/pages/auth/login/ui/LoginPage.tsx`                    |
| نسيت كلمة المرور | `/forgot-password` | أي حد               | `src/pages/auth/forgot-password/ui/ForgotPasswordPage.tsx` |
| طلب الانضمام     | `/join`            | أي حد               | `src/pages/auth/join/ui/JoinPage.tsx`                      |
| التفعيل          | `/activate/:token` | صاحب الرابط         | `src/pages/auth/activate/ui/ActivatePage.tsx`              |
| تجهيز الصيدلية   | `/setup`           | المديرة بعد التفعيل | `src/pages/setup/ui/SetupPage.tsx`                         |
| البداية          | `/getting-started` | المديرة             | `src/pages/getting-started/ui/GettingStartedPage.tsx`      |

صفحة الزوار ما بتطلب شي من السيرفر. كل الباقي بيطلب.

---

## القصة من أولها

هيك بتدخل صيدلية جديدة للنظام:

```
1. صاحبة الصيدلية بتعبي طلب الانضمام            POST /api/join-requests
2. صاحبة المنصة بتقبل الطلب                     POST /api/platform/join-requests/{id}/approve
3. السيرفر بيبعت رابط تفعيل على واتساب          (جوا لارافيل)
4. صاحبة الصيدلية بتفتح الرابط                  GET  /api/activation/{token}
5. بتختار كلمة مرور                             POST /api/activation/{token}
   ← هون بتنعمل الصيدلية والحساب، وبتبلش التجربة، وبتدخل تلقائياً
6. بتراجع بيانات الصيدلية وبتختار كيف تبدأ      PUT  /api/pharmacy
                                                POST /api/onboarding/start
7. بتشوف قائمة البداية لحد ما تخلصها أو تخفيها  GET  /api/onboarding
```

وبعدها، كل مرة بتدخل:

```
GET  /sanctum/csrf-cookie
POST /api/login
```

وكل مرة بتفتح التطبيق:

```
GET /api/me
```

---

## صفحة الدخول

### شو بيصير بالشاشة

1. المستخدم بيكتب الجوال وكلمة المرور، وبيختار "تذكرني" إذا بدو.
2. الفرونت بيطلب كوكي الحماية أول شي، وبعدين بيبعت الدخول.
3. إذا نجح، بيروح حسب دوره:

| الدور            | وين بيروح            |
| ---------------- | -------------------- |
| صاحبة المنصة     | `/platform/requests` |
| الكاشير          | `/sales/pos`         |
| المديرة والصيدلي | `/`                  |

الملف اللي بيقرر هالشي:

```
src/entities/session/model/landing.ts
```

### الملفات

| شو                | وين                                       |
| ----------------- | ----------------------------------------- |
| النموذج والفحص    | `src/features/auth/login/model/schema.ts` |
| الطلب             | `src/entities/session/api/session-api.ts` |
| رد السيرفر الوهمي | `src/app/mocks/handlers/session.ts`       |

### الطلب

```http
POST /api/login
```

```json
{
  "login": "0599920307",
  "password": "pharma123",
  "remember": true
}
```

| الحقل      | النوع | القاعدة                                                   |
| ---------- | ----- | --------------------------------------------------------- |
| `login`    | نص    | مطلوب. جوال، والمستخدم ممكن يكتبه بمسافات أو بأرقام عربية |
| `password` | نص    | مطلوب                                                     |
| `remember` | منطقي | إذا `true` الجلسة بتطول                                   |

> الجوال ممكن يوصل هيك: `٠٥٩٩ ٩٢٠-٣٠٧`. لازم السيرفر ينظفه قبل البحث: يحول الأرقام العربية، ويشيل المسافات والشرطات.

### الردود

**نجح** (200): نفس شكل المستخدم الحالي، [هون](#المستخدم-الحالي).

**الجوال أو كلمة المرور غلط** (422):

```json
{
  "message": "These credentials do not match our records.",
  "errors": { "login": ["credentials"] },
  "attemptsLeft": 3
}
```

`attemptsLeft` الفرونت بيعرضه: "باقيلك 3 محاولات".

**خمس محاولات غلط** (429):

```json
{
  "message": "Too many attempts.",
  "retryAfterMinutes": 15
}
```

### بلارافيل

دالة تنظيف الجوال، بتنستخدم بكل مكان فيه جوال:

```php
// app/Support/helpers.php   (وسجليها بـ composer.json تحت autoload.files)
function normalize_phone(?string $value): string
{
    $value = strtr((string) $value, [
        '٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4',
        '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9',
    ]);

    return preg_replace('/[\s-]/', '', $value);
}
```

نموذج الطلب مع حد المحاولات:

```php
// app/Http/Requests/Auth/LoginRequest.php
namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class LoginRequest extends FormRequest
{
    public const MAX_ATTEMPTS = 5;

    public function rules(): array
    {
        return [
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
            'remember' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return ['login.required' => 'required', 'password.required' => 'required'];
    }

    public function throttleKey(): string
    {
        return Str::transliterate(normalize_phone($this->input('login')).'|'.$this->ip());
    }

    public function attemptsLeft(): int
    {
        return max(0, self::MAX_ATTEMPTS - RateLimiter::attempts($this->throttleKey()));
    }
}
```

الكونترولر:

```php
// app/Http/Controllers/Auth/SessionController.php
namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\SessionUserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;

class SessionController extends Controller
{
    public function store(LoginRequest $request)
    {
        $key = $request->throttleKey();

        if (RateLimiter::tooManyAttempts($key, LoginRequest::MAX_ATTEMPTS)) {
            return response()->json([
                'message' => 'Too many attempts.',
                'retryAfterMinutes' => (int) ceil(RateLimiter::availableIn($key) / 60),
            ], 429);
        }

        $credentials = [
            'phone' => normalize_phone($request->input('login')),
            'password' => $request->input('password'),
            'active' => true,
        ];

        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            RateLimiter::hit($key, 15 * 60);

            return response()->json([
                'message' => 'These credentials do not match our records.',
                'errors' => ['login' => ['credentials']],
                'attemptsLeft' => $request->attemptsLeft(),
            ], 422);
        }

        RateLimiter::clear($key);
        $request->session()->regenerate();
        $request->user()->forceFill(['last_active_at' => now()])->save();

        return new SessionUserResource($request->user()->load('pharmacy'));
    }

    public function destroy(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }
}
```

### الخروج

```http
POST /api/logout
```

ما في جسم. الرد 204. الدالة `destroy` بنفس الكونترولر فوق: بتطلع، وبتلغي الجلسة، وبتعمل رمز حماية جديد.

> لاحظي `'active' => true` بالدخول: الموظف اللي المديرة وقفته ما بيقدر يدخل. وكمان الصيدلية الموقوفة من صاحبة المنصة (الوحدة 11): ضيفي فحص بعد الدخول إنه `pharmacy.status` مش `suspended`.

---

## المستخدم الحالي

أول طلب بكل فتحة للتطبيق. الفرونت بيعرف منه: مين داخل، دوره، صلاحياته، صيدليته، وكم باقي من التجربة.

```http
GET /api/me
```

إذا مش مسجل: 401، والفرونت بيودي على الدخول أو على صفحة الزوار.

### الشكل لموظف صيدلية

النوع بالفرونت:

```
src/entities/session/model/types.ts   →   CurrentUser
```

```json
{
  "data": {
    "id": 1,
    "name": "رزان",
    "phone": "0599920307",
    "role": "manager",
    "discountLimit": null,
    "permissions": {
      "sellOnCredit": true,
      "seePurchasePrice": true,
      "approveCounts": true
    },
    "pharmacy": {
      "id": 1,
      "name": "صيدلية الشفاء",
      "plan": "trial",
      "planEndsAt": "2026-12-12",
      "onboardingDone": false
    }
  }
}
```

| الحقل                     | معناه                                                                |
| ------------------------- | -------------------------------------------------------------------- |
| `role`                    | `manager` أو `pharmacist` أو `cashier`                               |
| `discountLimit`           | أعلى خصم بالمية على فاتورة وحدة. `null` يعني بدون حد (المديرة دايماً) |
| `permissions`             | الصلاحيات الإضافية. المديرة كلها `true`                              |
| `pharmacy.plan`           | `trial` أو `basic` أو `pro` أو `yearly`                              |
| `pharmacy.planEndsAt`     | آخر يوم بالتجربة أو الاشتراك. منه السايدبار بيكتب "باقي 16 يوم"      |
| `pharmacy.onboardingDone` | `false` لحد ما المديرة تخلص أو تخفي قائمة البداية                    |

### الشكل لصاحبة المنصة

ما إلها صيدلية ولا صلاحيات:

```json
{
  "data": { "id": 100, "name": "رزان بلاطة", "phone": "0590000000", "role": "platform_owner" }
}
```

### بلارافيل

```php
// app/Http/Resources/SessionUserResource.php
namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SessionUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $base = [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'role' => $this->role,
        ];

        if ($this->role === 'platform_owner') {
            return $base;
        }

        $isManager = $this->role === 'manager';
        $subscription = $this->pharmacy->currentSubscription;

        return $base + [
            'discountLimit' => $isManager ? null : (float) $this->discount_limit,
            'permissions' => [
                'sellOnCredit' => $isManager || $this->can_sell_on_credit,
                'seePurchasePrice' => $isManager || $this->can_see_purchase_price,
                'approveCounts' => $isManager || $this->can_approve_counts,
            ],
            'pharmacy' => [
                'id' => $this->pharmacy->id,
                'name' => $this->pharmacy->name,
                'plan' => $subscription?->plan ?? 'trial',
                'planEndsAt' => $subscription?->ends_at?->toDateString(),
                'onboardingDone' => (bool) $this->pharmacy->onboarding_dismissed_at,
            ],
        ];
    }
}
```

```php
// routes/api.php
Route::middleware('auth:sanctum')->get('/me', fn (Request $request) =>
    new SessionUserResource($request->user()->load('pharmacy.currentSubscription'))
);
```

---

## نسيت كلمة المرور

### شو بيصير بالشاشة

تلات خطوات بنفس الصفحة:

1. بيكتب الجوال، وبيختار واتساب أو رسالة.
2. بيكتب الكود (6 أرقام). في عداد قبل ما يقدر يطلب كود جديد.
3. بيكتب كلمة مرور جديدة مرتين.

الملف:

```
src/features/auth/reset-password/ui/ResetPasswordFlow.tsx
```

### الخطوة 1: إرسال الكود

```http
POST /api/password/otp
```

```json
{ "login": "0599920307", "channel": "whatsapp" }
```

الرد (202):

```json
{ "data": { "last": "307", "resendInSeconds": 45 } }
```

`last` هو آخر 3 أرقام، الشاشة بتكتب "بعتنالك كود على الرقم اللي بينتهي بـ 307".

> مهم للأمان: الرد **نفسه** سواء الرقم إله حساب أو لا. هيك ما حدا بيقدر يجرب أرقام ويعرف مين مسجل. يعني إذا الرقم مش موجود، رجعي نفس الرد وما تبعتي شي.

### الخطوة 2: فحص الكود

```http
POST /api/password/verify
```

```json
{ "login": "0599920307", "code": "482913" }
```

صح (200):

```json
{ "data": { "resetToken": "8f2c…" } }
```

غلط (422):

```json
{ "message": "Invalid code.", "errors": { "code": ["invalid"] } }
```

### الخطوة 3: كلمة المرور الجديدة

```http
POST /api/password/reset
```

```json
{ "resetToken": "8f2c…", "password": "newPass2026" }
```

الرد: 204. وبيطلع الحساب من كل الأجهزة التانية.

قاعدة كلمة المرور بكل المشروع: 8 أحرف على الأقل، وفيها رقم واحد على الأقل.

### بلارافيل

جدول للأكواد:

```php
Schema::create('password_reset_codes', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->string('code_hash');
    $table->string('reset_token_hash')->nullable();
    $table->unsignedTinyInteger('attempts')->default(0);
    $table->timestamp('expires_at');
    $table->timestamps();
});
```

الكونترولر:

```php
// app/Http/Controllers/Auth/PasswordResetController.php
public function sendCode(Request $request)
{
    $data = $request->validate([
        'login' => ['required', 'string'],
        'channel' => ['required', 'in:whatsapp,sms'],
    ]);

    $phone = normalize_phone($data['login']);
    $user = User::where('phone', $phone)->where('active', true)->first();

    if ($user) {
        $code = (string) random_int(100000, 999999);
        PasswordResetCode::where('user_id', $user->id)->delete();
        PasswordResetCode::create([
            'user_id' => $user->id,
            'code_hash' => Hash::make($code),
            'expires_at' => now()->addMinutes(10),
        ]);
        SendResetCode::dispatch($user, $code, $data['channel']);
    }

    return response()->json([
        'data' => ['last' => substr($phone, -3), 'resendInSeconds' => 45],
    ], 202);
}

public function verify(Request $request)
{
    $data = $request->validate(['login' => 'required', 'code' => ['required', 'digits:6']]);
    $user = User::where('phone', normalize_phone($data['login']))->first();
    $entry = $user ? PasswordResetCode::where('user_id', $user->id)->where('expires_at', '>', now())->first() : null;

    if (! $entry || $entry->attempts >= 5 || ! Hash::check($data['code'], $entry->code_hash)) {
        $entry?->increment('attempts');

        return response()->json(['message' => 'Invalid code.', 'errors' => ['code' => ['invalid']]], 422);
    }

    $token = Str::random(64);
    $entry->update(['reset_token_hash' => hash('sha256', $token)]);

    return response()->json(['data' => ['resetToken' => $token]]);
}

public function reset(Request $request)
{
    $data = $request->validate([
        'resetToken' => ['required', 'string'],
        'password' => ['required', 'string', 'min:8', 'regex:/\d/'],
    ]);

    $entry = PasswordResetCode::where('reset_token_hash', hash('sha256', $data['resetToken']))
        ->where('expires_at', '>', now())
        ->first();

    abort_unless($entry, 422, 'Invalid token.');

    $entry->user->update(['password' => Hash::make($data['password'])]);
    DB::table('sessions')->where('user_id', $entry->user_id)->delete();
    $entry->delete();

    return response()->noContent();
}
```

> `DB::table('sessions')` بيشتغل إذا `SESSION_DRIVER=database`. هيك بيطلع من كل الأجهزة.

---

## طلب الانضمام

### شو بيصير بالشاشة

نموذج عام، بدون حساب. بعد الإرسال الشاشة بتعرض رقم الطلب، مثل `REQ-0035`.

| شو                | وين                                                          |
| ----------------- | ------------------------------------------------------------ |
| النموذج والفحص    | `src/features/join/submit-request/model/schema.ts`           |
| الطلب             | `src/entities/platform/join-request/api/join-request-api.ts` |
| الأنواع           | `src/entities/platform/join-request/model/types.ts`          |
| رد السيرفر الوهمي | `src/app/mocks/handlers/join-requests.ts`                    |

### الطلب

```http
POST /api/join-requests
```

```json
{
  "pharmacyName": "صيدلية الرحمة",
  "ownerName": "هبة نصار",
  "city": "النصيرات",
  "phone": "0599402219",
  "licenseNumber": "PH-2025-0388"
}
```

| الحقل           | القاعدة بالفرونت                           | القاعدة بلارافيل                              |
| --------------- | ------------------------------------------ | --------------------------------------------- |
| `pharmacyName`  | مطلوب                                      | `required\|string\|max:120`                   |
| `ownerName`     | مطلوب                                      | `required\|string\|max:120`                   |
| `city`          | مطلوب، من قائمة المدن                      | `required\|string`                            |
| `phone`         | جوال يبدأ بـ 059 أو 056 وبعده 7 أرقام      | `required\|regex:/^05[69]\d{7}$/` بعد التنظيف |
| `licenseNumber` | مطلوب                                      | `required\|string\|max:60`                    |
| `terms`         | لازم يوافق. **ما بينبعت**، بينفحص بالفرونت | ما في                                         |

> صورة الترخيص: الحقل `hasLicensePhoto` موجود بالرد، بس النموذج لسا ما بيبعت صورة. لما تضيفيها، الطلب بيصير multipart، وأداة الطلب جاهزة لهاد (زي رفع الشعار).

### الردود

نجح (201):

```json
{ "data": { "reference": "REQ-0035" } }
```

الرقم إله طلب سابق مش مرفوض (422):

```json
{ "message": "The phone has already been taken.", "errors": { "phone": ["taken"] } }
```

### بلارافيل

```php
// app/Http/Requests/StoreJoinRequestRequest.php
class StoreJoinRequestRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge(['phone' => normalize_phone($this->input('phone'))]);
    }

    public function rules(): array
    {
        return [
            'pharmacyName' => ['required', 'string', 'max:120'],
            'ownerName' => ['required', 'string', 'max:120'],
            'city' => ['required', 'string', 'max:60'],
            'phone' => [
                'required', 'regex:/^05[69]\d{7}$/',
                Rule::unique('join_requests', 'phone')->whereNot('status', 'rejected'),
                Rule::unique('users', 'phone'),
            ],
            'licenseNumber' => ['required', 'string', 'max:60'],
        ];
    }

    public function messages(): array
    {
        return [
            '*.required' => 'required',
            'phone.regex' => 'invalid',
            'phone.unique' => 'taken',
        ];
    }
}
```

```php
// app/Http/Controllers/JoinRequestController.php
public function store(StoreJoinRequestRequest $request)
{
    $joinRequest = JoinRequest::create([
        'pharmacy_name' => $request->input('pharmacyName'),
        'owner_name' => $request->input('ownerName'),
        'city' => $request->input('city'),
        'phone' => $request->input('phone'),
        'license_number' => $request->input('licenseNumber'),
        'status' => 'new',
    ]);

    return response()->json(['data' => ['reference' => $joinRequest->reference]], 201);
}
```

رقم الطلب بيتحسب من الرقم التسلسلي:

```php
// app/Models/JoinRequest.php
public function getReferenceAttribute(): string
{
    return 'REQ-'.str_pad((string) $this->id, 4, '0', STR_PAD_LEFT);
}
```

---

## التفعيل

### شو بيصير بالشاشة

صاحبة الصيدلية بتفتح الرابط من واتساب. الصفحة بتعرض اسم الصيدلية واسمها ورقمها، وبتطلب كلمة مرور (وإيميل اختياري). إذا الرابط انتهى، بتعرض زر "ابعتلي رابط جديد".

### الروابط

| الطريقة | الرابط                           | الرد                                          |
| ------- | -------------------------------- | --------------------------------------------- |
| GET     | `/api/activation/{token}`        | البيانات، أو 410 لو انتهى، أو 404 لو مش موجود |
| POST    | `/api/activation/{token}/resend` | 202، وبيبعت رابط جديد                         |
| POST    | `/api/activation/{token}`        | 204، وبيعمل الحساب وبيدخّلها                   |

رد الفحص:

```json
{ "data": { "pharmacyName": "صيدلية الرحمة", "ownerName": "هبة نصار", "phone": "0599402219" } }
```

جسم التفعيل:

```json
{ "password": "rahma2026", "email": "heba@example.com" }
```

`email` ممكن ما ينبعت، أو ينبعت فاضي.

### شو لازم يصير جوا السيرفر لما تتفعل

هاي أهم لحظة بالوحدة. كلها لازم تصير بعملية وحدة، يعني يا بتنجح كلها يا ما بيصير شي:

```php
// app/Http/Controllers/ActivationController.php
public function store(Request $request, string $token)
{
    $data = $request->validate([
        'password' => ['required', 'string', 'min:8', 'regex:/\d/'],
        'email' => ['nullable', 'email'],
    ], ['password.*' => 'password', 'email.email' => 'email']);

    $activation = ActivationToken::where('token_hash', hash('sha256', $token))->first();
    abort_unless($activation && $activation->expires_at->isFuture() && ! $activation->used_at, 410);

    $user = DB::transaction(function () use ($activation, $data) {
        $joinRequest = $activation->joinRequest;

        $pharmacy = Pharmacy::create([
            'name' => $joinRequest->pharmacy_name,
            'city' => $joinRequest->city,
            'phone' => $joinRequest->phone,
            'license_number' => $joinRequest->license_number,
            'currency' => 'ILS',
            'status' => 'active',
        ]);

        $pharmacy->subscriptions()->create([
            'plan' => 'trial',
            'starts_at' => today(),
            'ends_at' => today()->addDays(30),
        ]);
        $pharmacy->subscriptionEvents()->createMany([
            ['kind' => 'joined', 'params' => []],
            ['kind' => 'trialStarted', 'params' => ['days' => 30]],
        ]);

        $pharmacy->settings()->create(Settings::defaults());

        $user = $pharmacy->users()->create([
            'name' => $joinRequest->owner_name,
            'phone' => $joinRequest->phone,
            'email' => $data['email'] ?? null,
            'password' => Hash::make($data['password']),
            'role' => 'manager',
            'active' => true,
        ]);

        $joinRequest->update(['status' => 'activated', 'pharmacy_id' => $pharmacy->id]);
        $activation->update(['used_at' => now()]);

        return $user;
    });

    Auth::login($user);
    $request->session()->regenerate();

    return response()->noContent();
}
```

| القاعدة                           | ليش                                 |
| --------------------------------- | ----------------------------------- |
| الرابط صالح 48 ساعة               | عشان ما يضل رابط قديم شغال          |
| لمرة وحدة                         | بعد الاستخدام بيصير 410             |
| التجربة 30 يوم من لحظة التفعيل    | مش من لحظة الطلب                    |
| بنحفظ بصمة الرابط، مش الرابط نفسه | لو انسرقت القاعدة، الروابط ما بتنفع |

إنشاء الرابط (بيصير لما صاحبة المنصة تقبل، بالوحدة 11):

```php
$token = Str::random(48);
ActivationToken::create([
    'join_request_id' => $joinRequest->id,
    'token_hash' => hash('sha256', $token),
    'expires_at' => now()->addHours(48),
]);
$link = config('app.frontend_url')."/activate/{$token}";
SendWhatsApp::dispatch($joinRequest->phone, __('messages.activation', ['link' => $link]));
```

---

## تجهيز الصيدلية

### شو بيصير بالشاشة

أول مرة بعد التفعيل. الصفحة معبّاة من طلب الانضمام. المديرة بتراجع الاسم والمدينة والعنوان والهاتف والترخيص، وبتختار كيف تبدأ:

| الطريقة  | القيمة    | لوين بتروح بعدها                 |
| -------- | --------- | -------------------------------- |
| من إكسل  | `excel`   | صفحة الاستيراد                   |
| الكتالوج | `catalog` | الأصناف مع نافذة الكتالوج مفتوحة |
| تجريبي   | `sample`  | البداية، مع أصناف تجريبية جاهزة  |
| فاضي     | `empty`   | البداية                          |

الملف:

```
src/features/pharmacy/setup-pharmacy/ui/SetupPharmacyForm.tsx
```

### الروابط بالترتيب

```http
GET /api/pharmacy
GET /api/cities
PUT /api/pharmacy
POST /api/onboarding/start
```

بيانات الصيدلية:

```json
{
  "data": {
    "id": 1,
    "name": "صيدلية الشفاء",
    "city": "غزة",
    "address": "الرمال · شارع عمر المختار",
    "phone": "0599123456",
    "licenseNumber": "PH-2026-0147",
    "currency": "ILS",
    "logoUrl": null
  }
}
```

المدن:

```json
{ "data": ["غزة", "خان يونس", "دير البلح", "..."] }
```

الحفظ (نفس الحقول بدون `id` و`logoUrl`):

```json
{
  "name": "صيدلية الشفاء",
  "city": "غزة",
  "address": "الرمال · شارع عمر المختار",
  "phone": "0599123456",
  "licenseNumber": "PH-2026-0147",
  "currency": "ILS"
}
```

| الحقل           | القاعدة                                |
| --------------- | -------------------------------------- |
| `name`          | مطلوب                                  |
| `city`          | مطلوب                                  |
| `address`       | مطلوب                                  |
| `phone`         | مطلوب. جوال أو أرضي (08 وبعده 7 أرقام) |
| `licenseNumber` | اختياري                                |
| `currency`      | `ILS` بس حالياً                         |

طريقة البدء:

```json
{ "method": "sample" }
```

الرد: 204. لو `sample`، لارافيل لازم يعبي أصناف تجريبية بالصيدلية (بتلاقي أمثلة واقعية بالملف `src/app/mocks/catalog-data.ts`).

نفس رابط `PUT /api/pharmacy` بتستخدمه صفحة الإعدادات كمان (الوحدة 2). ورفع الشعار مشروح هناك.

### بلارافيل

```php
// app/Http/Resources/PharmacyResource.php
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'city' => $this->city,
        'address' => (string) $this->address,
        'phone' => $this->phone,
        'licenseNumber' => (string) $this->license_number,
        'currency' => $this->currency,
        'logoUrl' => $this->logo_path ? Storage::disk('public')->url($this->logo_path) : null,
    ];
}
```

```php
// app/Http/Controllers/PharmacyController.php
public function show(Request $request)
{
    return new PharmacyResource($request->user()->pharmacy);
}

public function update(UpdatePharmacyRequest $request)
{
    $pharmacy = $request->user()->pharmacy;
    $pharmacy->update([
        'name' => $request->input('name'),
        'city' => $request->input('city'),
        'address' => $request->input('address'),
        'phone' => normalize_phone($request->input('phone')),
        'license_number' => $request->input('licenseNumber'),
        'currency' => $request->input('currency'),
    ]);

    return new PharmacyResource($pharmacy);
}
```

---

## قائمة البداية

### شو بيصير بالشاشة

قائمة بست خطوات، وكل خطوة إلها زر بيودي للصفحة المناسبة. المديرة بتقدر تخفيها بأي وقت.

### الروابط

```http
GET  /api/onboarding
POST /api/onboarding/dismiss
```

الرد:

```json
{
  "data": {
    "steps": [
      { "key": "account", "done": true },
      { "key": "profile", "done": true },
      { "key": "products", "done": false },
      { "key": "openingStock", "done": false },
      { "key": "staff", "done": false },
      { "key": "payments", "done": false }
    ],
    "dismissed": false
  }
}
```

الإخفاء: 204، وبعدها `onboardingDone` بالمستخدم الحالي بيصير `true`.

### متى كل خطوة بتخلص

السيرفر هو اللي بيقرر، من البيانات الحقيقية. ما في حقل بينحفظ لكل خطوة. السيرفر الوهمي بيعلّم خطوة الأصناف بس (لما تختاري تجريبي). هاد اقتراح للقاعدة الكاملة:

| الخطوة         | بتخلص لما                                                        |
| -------------- | ---------------------------------------------------------------- |
| `account`      | دايماً، لأنها فعّلت الحساب                                         |
| `profile`      | الصيدلية إلها عنوان وهاتف                                        |
| `products`     | في صنف واحد على الأقل                                            |
| `openingStock` | في دفعة مخزون وحدة على الأقل                                     |
| `staff`        | في موظف تاني غير المديرة                                         |
| `payments`     | في طريقة دفع مفعلة غير النقدي بالإعدادات (`bankApp` أو `credit`) |

```php
// app/Http/Controllers/OnboardingController.php
public function show(Request $request)
{
    $pharmacy = $request->user()->pharmacy;

    $steps = [
        'account' => true,
        'profile' => filled($pharmacy->address) && filled($pharmacy->phone),
        'products' => Product::exists(),
        'openingStock' => Batch::exists(),
        'staff' => User::where('role', '!=', 'manager')->exists(),
        'payments' => $pharmacy->settings->pay_bank_app || $pharmacy->settings->pay_credit,
    ];

    return response()->json(['data' => [
        'steps' => collect($steps)->map(fn ($done, $key) => ['key' => $key, 'done' => $done])->values(),
        'dismissed' => (bool) $pharmacy->onboarding_dismissed_at,
    ]]);
}

public function dismiss(Request $request)
{
    $request->user()->pharmacy->update(['onboarding_dismissed_at' => now()]);

    return response()->noContent();
}
```

> `Product::exists()` بيفحص صيدلية المستخدم بس، بسبب الفلتر العام اللي شرحناه بالملف الرئيسي.

---

## الجداول

```php
Schema::create('pharmacies', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('city');
    $table->string('address')->nullable();
    $table->string('phone', 10);
    $table->string('license_number')->nullable();
    $table->string('currency', 3)->default('ILS');
    $table->string('logo_path')->nullable();
    $table->string('district')->default('');        // الحي، بيطلع بلوحة صاحبة المنصة
    $table->enum('status', ['active', 'suspended'])->default('active');   // الباقة بجدول الاشتراكات (الوحدة 11)
    $table->enum('support_access', ['none', 'requested', 'granted'])->default('none');
    $table->timestamp('onboarding_dismissed_at')->nullable();
    $table->timestamps();
});

Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->foreignId('pharmacy_id')->nullable()->constrained()->cascadeOnDelete();
    $table->string('name');
    $table->string('phone', 10)->unique();
    $table->string('email')->nullable();
    $table->string('password');
    $table->enum('role', ['platform_owner', 'manager', 'pharmacist', 'cashier']);
    $table->boolean('active')->default(true);
    $table->decimal('discount_limit', 5, 2)->default(0);
    $table->boolean('can_sell_on_credit')->default(false);
    $table->boolean('can_see_purchase_price')->default(false);
    $table->boolean('can_approve_counts')->default(false);
    $table->timestamp('last_active_at')->nullable();
    $table->rememberToken();
    $table->timestamps();
});

Schema::create('join_requests', function (Blueprint $table) {
    $table->id();
    $table->foreignId('pharmacy_id')->nullable()->constrained()->nullOnDelete();
    $table->string('pharmacy_name');
    $table->string('owner_name');
    $table->string('city');
    $table->string('phone', 10)->index();
    $table->string('license_number');
    $table->string('license_photo_path')->nullable();
    $table->enum('status', ['new', 'approved', 'activated', 'rejected'])->default('new');
    $table->string('rejection_reason')->nullable();
    $table->timestamps();
});

Schema::create('activation_tokens', function (Blueprint $table) {
    $table->id();
    $table->foreignId('join_request_id')->constrained()->cascadeOnDelete();
    $table->string('token_hash', 64)->unique();
    $table->timestamp('expires_at');
    $table->timestamp('used_at')->nullable();
    $table->timestamps();
});
```

> `phone` بجدول المستخدمين فريد على كل النظام، مش بس بالصيدلية، لأنه هو اللي بندخل فيه. فالموظف ما بيقدر يكون بصيدليتين بنفس الرقم.

---

## الروابط بملف لارافيل

```php
// routes/api.php

// عامة
Route::post('/login', [SessionController::class, 'store']);
Route::post('/password/otp', [PasswordResetController::class, 'sendCode'])->middleware('throttle:5,1');
Route::post('/password/verify', [PasswordResetController::class, 'verify']);
Route::post('/password/reset', [PasswordResetController::class, 'reset']);
Route::post('/join-requests', [JoinRequestController::class, 'store'])->middleware('throttle:5,1');
Route::get('/activation/{token}', [ActivationController::class, 'show']);
Route::post('/activation/{token}/resend', [ActivationController::class, 'resend'])->middleware('throttle:3,1');
Route::post('/activation/{token}', [ActivationController::class, 'store']);
Route::get('/cities', fn () => ['data' => config('pharmasmart.cities')]);

// مسجل
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', MeController::class);
    Route::post('/logout', [SessionController::class, 'destroy']);

    Route::middleware('role:manager')->group(function () {
        Route::get('/pharmacy', [PharmacyController::class, 'show']);
        Route::put('/pharmacy', [PharmacyController::class, 'update']);
        Route::post('/pharmacy/logo', [PharmacyController::class, 'logo']);
        Route::get('/onboarding', [OnboardingController::class, 'show']);
        Route::post('/onboarding/start', [OnboardingController::class, 'start']);
        Route::post('/onboarding/dismiss', [OnboardingController::class, 'dismiss']);
    });
});
```

> `GET /api/pharmacy` بيحتاجه كمان الصيدلي والكاشير؟ لا، الإيصال بياخد الاسم من المستخدم الحالي. بس لو احتجتيه لطباعة الفاتورة، افتحي القراءة لكل الأدوار وخلي الحفظ للمديرة.

---

## اختبري حالك

بعد ما تبني الوحدة، هاد اللي لازم يشتغل بالفرونت:

- [ ] الدخول برقم مكتوب بأرقام عربية ومسافات
- [ ] كلمة مرور غلط بتعرض "باقيلك 4 محاولات"
- [ ] بعد 5 محاولات بتعرض "استني 15 دقيقة"
- [ ] تحديث الصفحة بعد الدخول بيضل داخل
- [ ] الكاشير بيروح لنقطة البيع مباشرة
- [ ] الخروج بيرجع لصفحة الدخول، وزر الرجوع ما بيرجع للتطبيق
- [ ] رقم مش مسجل بنسيت كلمة المرور بيعطي نفس الرد
- [ ] طلب انضمام برقم مستخدم بيعرض الخطأ تحت حقل الجوال
- [ ] رابط تفعيل قديم بيعرض زر "رابط جديد"
- [ ] بعد التفعيل بيدخل مباشرة على صفحة التجهيز
- [ ] السايدبار بيعرض "تجربة مجانية · باقي 30 يوم"
