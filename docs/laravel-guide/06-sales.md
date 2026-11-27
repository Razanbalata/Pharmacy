# الوحدة 6: البيع (الوردية ونقطة البيع والفواتير والمرتجعات)

أهم وحدة بالمشروع. هون الفلوس بتدخل، والمخزون بيطلع. أي غلط هون بيبين بالدرج آخر اليوم.

## المحتويات

1. [الصفحات ومين بيفتحها](#الصفحات-ومين-بيفتحها)
2. [القصة من أولها](#القصة-من-أولها)
3. [الوردية](#الوردية)
4. [نقطة البيع: شو بتطلب قبل البيع](#نقطة-البيع-شو-بتطلب-قبل-البيع)
5. [البيع](#البيع)
6. [الفواتير المعلقة](#الفواتير-المعلقة)
7. [قائمة الفواتير](#قائمة-الفواتير)
8. [تفاصيل فاتورة](#تفاصيل-فاتورة)
9. [المرتجعات](#المرتجعات)
10. [البيع بدون نت](#البيع-بدون-نت)
11. [الجداول](#الجداول)
12. [الروابط بملف لارافيل](#الروابط-بملف-لارافيل)
13. [اختبري حالك](#اختبري-حالك)

---

## الصفحات ومين بيفتحها

كل الأدوار بتفتح كل صفحات البيع.

| الصفحة        | الرابط                | ملف الصفحة                                                |
| ------------- | --------------------- | --------------------------------------------------------- |
| الوردية       | `/sales/shift`        | `src/pages/sales/shift/ui/ShiftPage.tsx`                  |
| نقطة البيع    | `/sales/pos`          | `src/pages/sales/pos/ui/PosPage.tsx`                      |
| الفواتير      | `/sales/invoices`     | `src/pages/sales/invoices/ui/InvoicesPage.tsx`            |
| تفاصيل فاتورة | `/sales/invoices/:id` | `src/pages/sales/invoice-detail/ui/InvoiceDetailPage.tsx` |
| المرتجعات     | `/sales/returns`      | `src/pages/sales/returns/ui/ReturnsPage.tsx`              |

| شو                    | وين                                       |
| --------------------- | ----------------------------------------- |
| أنواع الوردية         | `src/entities/shift/model/types.ts`       |
| أنواع الفاتورة والبيع | `src/entities/invoice/model/types.ts`     |
| أنواع المرتجع         | `src/entities/sale-return/model/types.ts` |
| السلة (بالمتصفح)      | `src/entities/cart/model/cart.ts`         |
| رد السيرفر الوهمي     | `src/app/mocks/handlers/sales.ts`         |

---

## القصة من أولها

```
1. الكاشير بيفتح الوردية ويعد الدرج            POST /api/shifts
2. بيبحث عن الأصناف ويضيفها للسلة              GET  /api/products?search=...
   (السلة كلها بالمتصفح، السيرفر ما بيعرف عنها)
3. لو جه زبون تاني، بيعلق الفاتورة             POST /api/sales/held
4. بيدفع الزبون                                POST /api/sales
   ← بيطلع من الدفعات الأقرب انتهاء
   ← حركات مخزون sale
   ← لو آجل، بيزيد دين الزبون
5. آخر الوردية بيعد الدرج ويسكر                 POST /api/shifts/current/close
```

> السلة مش بالسيرفر. السيرفر بيشوف الفاتورة بس لما تندفع. يعني ما في "فاتورة مفتوحة" بالقاعدة، إلا المعلقة.

---

## الوردية

### الفكرة

الوردية هي فترة شغل كاشير على الدرج. بتبلش بعد النقدي اللي بالدرج، وبتنتهي بعده مرة تانية. الفرق بين المتوقع والمعدود هو العجز أو الزيادة.

**وردية وحدة بس مفتوحة بالصيدلية بنفس الوقت**، لأنه في درج واحد.

### شو بيصير بالشاشة

- ما في وردية: نموذج "افتح وردية" بالنقدي. جنبه "آخر وردية سكرت بـ 250 ₪"، عشان يقارن.
- في وردية: ملخص الوردية سطر سطر لحد النقدي المتوقع. وزر "سكّر الوردية".

### الروابط

| الطريقة | الرابط                        | الطلب                    | الرد                                   |
| ------- | ----------------------------- | ------------------------ | -------------------------------------- |
| GET     | `/api/shifts/current`         |                          | الوردية المفتوحة أو `null`، وآخر نقدي  |
| POST    | `/api/shifts`                 | `{ "openingCash": 250 }` | 201، الوردية. أو 409 لو في وحدة مفتوحة |
| GET     | `/api/shifts/current/summary` |                          | الملخص. أو 404 لو ما في وردية          |
| POST    | `/api/shifts/current/close`   | `countedCash`، `note`    | النتيجة. أو 409 أو 422                 |

### الوردية الحالية

```json
{
  "data": {
    "shift": {
      "id": 41,
      "number": 41,
      "cashier": { "id": 3, "name": "محمد العطار" },
      "openedAt": "2026-11-24T08:00:00+02:00",
      "closedAt": null,
      "openingCash": 250,
      "status": "open"
    },
    "lastClosingCash": 250
  }
}
```

`lastClosingCash` هو النقدي اللي انعد بآخر وردية انسكرت. `null` إذا ما في.

### الملخص

```json
{
  "data": {
    "shift": { "...": "نفس فوق" },
    "invoiceCount": 38,
    "cashSales": 1240.5,
    "bankSales": 310,
    "creditSales": 85,
    "cashRefunds": 22,
    "supplierPayments": 300,
    "debtPayments": 60,
    "expenses": 45,
    "expectedCash": 1183.5,
    "heldCount": 1
  }
}
```

**معادلة النقدي المتوقع**، وهاي أهم معادلة بالوحدة:

```
expectedCash = openingCash
             + cashSales          النقدي من الفواتير
             + debtPayments       زبائن سددوا ديونهم نقدي بالوردية
             − cashRefunds        مرتجعات رجعنا فلوسها نقدي
             − supplierPayments   تسديدات للموردين من الدرج (الوحدة 4)
             − expenses           مصاريف من الدرج (الوحدة 8)
```

| السطر              | من وين                                            |
| ------------------ | ------------------------------------------------- |
| `cashSales`        | مجموع `payment.cash` لفواتير هالوردية             |
| `bankSales`        | مجموع `payment.bank`                              |
| `creditSales`      | مجموع `payment.credit`                            |
| `cashRefunds`      | مرتجعات بهالوردية طريقتها `cash`                  |
| `supplierPayments` | تسديدات موردين نقدي `fromDrawer` مربوطة بهالوردية |
| `debtPayments`     | تسديدات زبائن نقدي بهالوردية (الوحدة 7)           |
| `expenses`         | مصاريف مصدرها الدرج بهالوردية (الوحدة 8)          |
| `heldCount`        | الفواتير المعلقة. الوردية ما بتتسكر وفيها معلق    |

> عشان هالمعادلة تشتغل، كل جدول فيه فلوس بتطلع أو بتدخل الدرج لازم فيه `shift_id`: الفواتير، المرتجعات، دفتر المورد، دفتر الزبون، والمصاريف. هيك الملخص طلب بسيط لكل جدول.

### الإغلاق

```json
{ "countedCash": 1180, "note": "نقص 3.5 فكة" }
```

| الحالة | متى                  | الرد                                     |
| ------ | -------------------- | ---------------------------------------- |
| 404    | ما في وردية مفتوحة   |                                          |
| 409    | في فواتير معلقة      | `{ "message": "Held invoices." }`        |
| 422    | في فرق وما في ملاحظة | `{ "errors": { "note": ["required"] } }` |
| 200    | تمام                 | النتيجة                                  |

```json
{
  "data": {
    "shift": { "...": "status صار closed" },
    "expectedCash": 1183.5,
    "countedCash": 1180,
    "difference": -3.5
  }
}
```

`difference` = المعدود − المتوقع. سالب يعني عجز.

**احفظي `expectedCash` بالوردية وقت الإغلاق.** سجل الورديات (الوحدة 8) بيعرضه، ولو حسبتيه بعدين ممكن يتغير.

### بلارافيل

```php
// app/Services/ShiftSummary.php
class ShiftSummary
{
    public function for(Shift $shift): array
    {
        $invoices = Invoice::where('shift_id', $shift->id);
        $cashSales = (float) (clone $invoices)->sum('paid_cash');

        $cashRefunds = (float) SaleReturn::where('shift_id', $shift->id)->where('refund', 'cash')->sum('amount');
        $supplierPayments = (float) SupplierLedger::where('shift_id', $shift->id)->where('kind', 'payment')->sum('amount');
        $debtPayments = (float) CustomerEntry::where('shift_id', $shift->id)->where('kind', 'payment')->where('method', 'cash')->sum('credit');
        $expenses = (float) Expense::where('shift_id', $shift->id)->where('source', 'drawer')->sum('amount');

        return [
            'shift' => new ShiftResource($shift),
            'invoiceCount' => (clone $invoices)->count(),
            'cashSales' => $cashSales,
            'bankSales' => (float) (clone $invoices)->sum('paid_bank'),
            'creditSales' => (float) (clone $invoices)->sum('paid_credit'),
            'cashRefunds' => $cashRefunds,
            'supplierPayments' => $supplierPayments,
            'debtPayments' => $debtPayments,
            'expenses' => $expenses,
            'expectedCash' => round($shift->opening_cash + $cashSales + $debtPayments - $cashRefunds - $supplierPayments - $expenses, 2),
            'heldCount' => HeldSale::count(),
        ];
    }
}
```

```php
// app/Http/Controllers/ShiftController.php
public function store(Request $request)
{
    $data = $request->validate(['openingCash' => ['required', 'numeric', 'min:0']], ['openingCash.*' => 'invalid']);

    return DB::transaction(function () use ($data, $request) {
        // القفل بيمنع كاشيرين يفتحوا بنفس اللحظة
        abort_if(Shift::where('status', 'open')->lockForUpdate()->exists(), 409, 'A shift is open.');

        $shift = Shift::create([
            'number' => (Shift::max('number') ?? 0) + 1,
            'user_id' => $request->user()->id,
            'opening_cash' => $data['openingCash'],
            'status' => 'open',
            'opened_at' => now(),
        ]);
        activity_log('shiftOpened', 'sale', ['shift' => $shift->number, 'amount' => $shift->opening_cash]);

        return (new ShiftResource($shift))->response()->setStatusCode(201);
    });
}

public function close(Request $request, ShiftSummary $summary)
{
    $shift = Shift::where('status', 'open')->firstOrFail();
    abort_if(HeldSale::exists(), 409, 'Held invoices.');

    $data = $request->validate(['countedCash' => ['required', 'numeric', 'min:0'], 'note' => ['present', 'nullable', 'string', 'max:300']]);
    $expected = $summary->for($shift)['expectedCash'];
    $difference = round($data['countedCash'] - $expected, 2);

    if ($difference != 0 && blank($data['note'])) {
        throw ValidationException::withMessages(['note' => 'required']);
    }

    $shift->update([
        'status' => 'closed',
        'closed_at' => now(),
        'expected_cash' => $expected,
        'counted_cash' => $data['countedCash'],
        'note' => trim((string) $data['note']),
    ]);

    return response()->json(['data' => [
        'shift' => new ShiftResource($shift),
        'expectedCash' => $expected,
        'countedCash' => (float) $data['countedCash'],
        'difference' => $difference,
    ]]);
}
```

---

## نقطة البيع: شو بتطلب قبل البيع

الشاشة نفسها ما إلها رابط خاص. بتستخدم روابط من وحدات تانية:

| شو                     | الرابط                                   | الوحدة |
| ---------------------- | ---------------------------------------- | ------ |
| هل في وردية؟           | `GET /api/shifts/current`                | هون    |
| البحث عن صنف           | `GET /api/products?search=...&perPage=8` | 3      |
| تفاصيل الصنف (الوحدات) | `GET /api/products/{id}`                 | 3      |
| البدائل لو خلص         | من تفاصيل الصنف، `alternatives`          | 3      |
| البحث عن زبون          | `GET /api/customers/options?search=...`  | 7      |
| إضافة زبون سريع        | `POST /api/customers`                    | 7      |
| الإعدادات (طرق الدفع)  | `GET /api/settings`                      | 2      |
| الفواتير المعلقة       | `GET /api/sales/held`                    | هون    |

قارئ الباركود بيكتب الرقم بحقل البحث وبيضغط Enter. الفرونت بيبحث فيه، ولو لقى صنف واحد بالباركود بالضبط، بيضيفه للسلة مباشرة. يعني لازم البحث يرجع الصنف لما الباركود مطابق **بالكامل**.

---

## البيع

### شو بيصير بالشاشة

السلة: لكل سطر الصنف، الوحدة (علبة، شريط…)، والكمية. تحت: الخصم، الزبون، وطريقة الدفع.

طرق الدفع:

| الطريقة    | القيمة   | شو بيعبي الكاشير                              |
| ---------- | -------- | --------------------------------------------- |
| نقدي       | `cash`   | كم استلم من الزبون، والشاشة بتحسب الباقي      |
| تطبيق بنكي | `bank`   | ولا شي                                        |
| آجل        | `credit` | لازم زبون                                     |
| مختلط      | `mixed`  | كم نقدي، كم بنكي، كم آجل، ومجموعهم = الإجمالي |

### الطلب

```http
POST /api/sales
```

```json
{
  "lines": [
    { "productId": 12, "unitIndex": 0, "quantity": 1 },
    { "productId": 15, "unitIndex": 1, "quantity": 2 }
  ],
  "discount": 3,
  "customerId": 7,
  "payment": {
    "method": "mixed",
    "cash": 40,
    "bank": 0,
    "credit": 25,
    "received": 50
  },
  "overLimitApproved": false
}
```

| الحقل                      | معناه                                                  |
| -------------------------- | ------------------------------------------------------ |
| `lines.*.unitIndex`        | ترتيب الوحدة بقائمة وحدات الصنف. 0 = أول وحدة (العلبة) |
| `lines.*.quantity`         | **بهالوحدة**. 2 شريط = `unitIndex: 1, quantity: 2`     |
| `discount`                 | مبلغ بالشيكل على الفاتورة كلها                         |
| `customerId`               | الزبون، أو `null`                                      |
| `payment.cash/bank/credit` | كم من كل طريقة. مجموعهم لازم = الإجمالي                |
| `payment.received`         | كم سلّم الزبون نقدي (للباقي)                            |
| `overLimitApproved`        | المديرة وافقت إنه الزبون يتجاوز حد دينه                |

> **السعر ما بينبعت.** السيرفر بياخد السعر من وحدة الصنف. هيك ما حدا بيقدر يغير السعر من المتصفح.

### الفحوصات، بالترتيب

**كل الفحوصات قبل أي تغيير.** لو سطر واحد فشل، ولا شي بيتغير.

| #   | الفحص                                                     | الرد                                |
| --- | --------------------------------------------------------- | ----------------------------------- |
| 1   | في وردية مفتوحة (إذا `shiftsEnabled`)                     | 409 `No open shift.`                |
| 2   | في سطر واحد على الأقل                                     | 422 `lines` ← `required`            |
| 3   | الصنف موجود وفعال، والوحدة موجودة ومفعلة، والكمية > 0     | 422 `lines.N.productId` ← `invalid` |
| 4   | الكمية متوفرة بدفعات **مش منتهية** (إلا إذا `sellAtZero`) | 422 `lines.N.quantity` ← `stock`    |
| 5   | الخصم مش أكبر من المجموع                                  | 422 `discount` ← `tooMuch`          |
| 6   | الخصم مش أكتر من `discountLimit` للمستخدم (بالمية)        | 422 `discount` ← `overLimit`        |
| 7   | `cash + bank + credit` = الإجمالي                         | 422 `payment` ← `mismatch`          |
| 8   | لو نقدي، `received` ≥ `cash`                              | 422 `payment.received` ← `short`    |
| 9   | لو في آجل: في زبون                                        | 422 `customerId` ← `required`       |
| 10  | لو في آجل: الزبون مسموحله بالدين                          | 422 `customerId` ← `noCredit`       |
| 11  | لو في آجل: المستخدم معه `sellOnCredit`                    | 403                                 |
| 12  | لو الدين + الآجل > حد الزبون، وما في `overLimitApproved`  | 422 `payment.credit` ← `overLimit`  |
| 13  | لو `overLimitApproved` والمستخدم مش مديرة                 | 403                                 |
| 14  | طريقة الدفع مفعلة بالإعدادات                              | 422 `payment` ← `methodOff`         |

> رقم 11 و14 مش بالسيرفر الوهمي، بس لازمين بالحقيقي. الفرونت بيخبي الأزرار، بس السيرفر لازم يمنع.

### الحساب

```
سعر السطر   = سعر الوحدة × الكمية
subtotal   = مجموع أسعار السطور
total      = subtotal − discount
change     = max(0, received − cash)
```

### كم بيطلع من المخزون

الكمية بالمخزون بأول وحدة. فلازم نحول:

```
factor(unitIndex) = حاصل ضرب perParent لكل وحدة من 1 لـ unitIndex

علبة فيها 2 شريط، والشريط 7 حبات:
  factor(0) = 1      ← علبة
  factor(1) = 2      ← شريط
  factor(2) = 2 × 7  ← حبة = 14

بالعلب = الكمية ÷ factor
  2 شريط = 2 ÷ 2  = 1 علبة
  3 حبات = 3 ÷ 14 = 0.2143 علبة
```

وبعدين بنوزعها على الدفعات، **الأقرب انتهاء أول**، بس الدفعات اللي لسا ما انتهت:

```
مطلوب 5 علب
دفعة A ← تنتهي 2026-12 ← فيها 3   ← خدنا 3، باقي 2
دفعة B ← تنتهي 2027-03 ← فيها 18  ← خدنا 2، خلصنا
```

لكل دفعة انخدم منها: حركة `sale` سالبة.

### الرد

201، الفاتورة كاملة بشكل [التفاصيل](#تفاصيل-فاتورة).

رقم الفاتورة: `INV-` وبعده الرقم بـ 6 خانات.

### بلارافيل

```php
// app/Services/SaleService.php
class SaleService
{
    public function create(array $input, User $user): Invoice
    {
        $settings = $user->pharmacy->settings;

        return DB::transaction(function () use ($input, $user, $settings) {
            $shift = Shift::where('status', 'open')->lockForUpdate()->first();
            abort_if($settings->shifts_enabled && ! $shift, 409, 'No open shift.');

            // 1. افحصي كل السطور واحجزي الدفعات
            $plan = [];
            foreach ($input['lines'] as $i => $line) {
                $product = Product::with('units')->find($line['productId']);
                $unit = $product?->units[$line['unitIndex']] ?? null;

                if (! $product?->active || ! $unit?->enabled || $line['quantity'] <= 0) {
                    throw ValidationException::withMessages(["lines.{$i}.productId" => 'invalid']);
                }

                $base = $line['quantity'] / $product->unitFactor($line['unitIndex']);
                $batches = $product->batches()
                    ->where('quantity', '>', 0)
                    ->whereDate('expiry', '>=', today())
                    ->orderBy('expiry')
                    ->lockForUpdate()
                    ->get();

                if (! $settings->sell_at_zero && $base > $batches->sum('quantity') + 1e-9) {
                    throw ValidationException::withMessages(["lines.{$i}.quantity" => 'stock']);
                }

                $plan[] = compact('product', 'unit', 'line', 'base', 'batches');
            }

            // 2. الحساب والدفع
            $subtotal = round(collect($plan)->sum(fn ($p) => $p['unit']->price * $p['line']['quantity']), 2);
            $discount = round(max(0, $input['discount']), 2);
            if ($discount > $subtotal) throw ValidationException::withMessages(['discount' => 'tooMuch']);
            if ($user->role !== 'manager' && $discount > $subtotal * $user->discount_limit / 100 + 1e-9) {
                throw ValidationException::withMessages(['discount' => 'overLimit']);
            }
            $total = round($subtotal - $discount, 2);

            $pay = $input['payment'];
            if (round($pay['cash'] + $pay['bank'] + $pay['credit'], 2) != $total) {
                throw ValidationException::withMessages(['payment' => 'mismatch']);
            }
            if ($pay['method'] === 'cash' && $pay['received'] < $pay['cash']) {
                throw ValidationException::withMessages(['payment.received' => 'short']);
            }

            $customer = $input['customerId'] ? Customer::find($input['customerId']) : null;
            if ($pay['credit'] > 0) {
                $this->checkCredit($customer, $pay['credit'], $input['overLimitApproved'], $user);
            }

            // 3. الحفظ
            $invoice = Invoice::create([
                'shift_id' => $shift?->id,
                'customer_id' => $customer?->id,
                'user_id' => $user->id,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'total' => $total,
                'method' => $pay['method'],
                'paid_cash' => $pay['cash'],
                'paid_bank' => $pay['bank'],
                'paid_credit' => $pay['credit'],
                'received' => $pay['received'],
                'change' => round(max(0, $pay['received'] - $pay['cash']), 2),
                'status' => 'completed',
                'client_id' => $input['clientId'] ?? null,
            ]);
            $invoice->update(['number' => 'INV-'.str_pad($invoice->id, 6, '0', STR_PAD_LEFT)]);

            foreach ($plan as $p) {
                $factor = $p['product']->unitFactor($p['line']['unitIndex']);
                $item = $invoice->items()->create([
                    'product_id' => $p['product']->id,
                    'name' => $p['product']->name,
                    'unit_index' => $p['line']['unitIndex'],
                    'unit_name' => $p['unit']->name,
                    'unit_factor' => $factor,
                    'quantity' => $p['line']['quantity'],
                    'price' => $p['unit']->price,
                    'total' => round($p['unit']->price * $p['line']['quantity'], 2),
                ]);

                // FEFO: الأقرب انتهاء أول
                $left = $p['base'];
                foreach ($p['batches'] as $batch) {
                    if ($left <= 1e-9) break;
                    $take = min((float) $batch->quantity, $left);
                    $item->batches()->create(['batch_id' => $batch->id, 'quantity' => $take, 'cost' => $batch->cost]);
                    StockMovement::record($batch, -$take, 'sale', $invoice->number, link: ['invoice', $invoice->id]);
                    $left -= $take;
                }
            }

            if ($pay['credit'] > 0) {
                $customer->entries()->create([
                    'kind' => 'sale', 'invoice_id' => $invoice->id, 'reference' => $invoice->number,
                    'debit' => $pay['credit'], 'credit' => 0, 'items' => count($plan), 'user_id' => $user->id,
                ]);
            }

            if ($discount > 0) {
                activity_log('discount', 'sale', ['amount' => $discount, 'invoice' => $invoice->number]);
            }

            return $invoice;
        });
    }

    private function checkCredit(?Customer $customer, float $credit, bool $approved, User $user): void
    {
        if (! $customer) throw ValidationException::withMessages(['customerId' => 'required']);
        if (! $customer->credit_allowed) throw ValidationException::withMessages(['customerId' => 'noCredit']);
        abort_unless($user->role === 'manager' || $user->can_sell_on_credit, 403);

        if ($customer->debt() + $credit > $customer->debt_limit) {
            if (! $approved) throw ValidationException::withMessages(['payment.credit' => 'overLimit']);
            abort_unless($user->role === 'manager', 403);
        }
    }
}
```

```php
// app/Models/Product.php
public function unitFactor(int $unitIndex): float
{
    $factor = 1;
    foreach ($this->units->slice(1, $unitIndex) as $unit) {
        $factor *= $unit->per_parent ?: 1;
    }

    return $factor;
}
```

> `lockForUpdate` على الدفعات بيمنع كاشيرين يبيعوا آخر علبة بنفس اللحظة. التاني بيستنى لحد ما الأول يخلص، وبعدين بيلاقي الكمية صفر.

---

## الفواتير المعلقة

لما الكاشير بده يخدم زبون تاني قبل ما الأول يدفع، بيعلق السلة. **المعلق ما بياخد من المخزون**.

| الطريقة | الرابط                 | الطلب | الرد         |
| ------- | ---------------------- | ----- | ------------ |
| GET     | `/api/sales/held`      |       | القائمة      |
| POST    | `/api/sales/held`      | السلة | 201، المعلقة |
| DELETE  | `/api/sales/held/{id}` |       | 204          |

```json
{
  "label": "أبو محمد · بستنى الوصفة",
  "customerId": 7,
  "discount": 0,
  "lines": [
    { "productId": 12, "unitIndex": 0, "quantity": 1, "name": "Augmentin 625mg 14 Tablets" }
  ],
  "total": 45
}
```

الرد:

```json
{
  "data": {
    "id": 3,
    "label": "أبو محمد · بستنى الوصفة",
    "at": "2026-11-24T10:12:00+02:00",
    "cashier": "محمد العطار",
    "customer": { "id": 7, "name": "أبو محمد" },
    "discount": 0,
    "lines": [
      { "productId": 12, "unitIndex": 0, "quantity": 1, "name": "Augmentin 625mg 14 Tablets" }
    ],
    "total": 45
  }
}
```

لما يرجع للمعلقة، الفرونت بيحطها بالسلة وبيمسحها من السيرفر (`DELETE`). وبعدين البيع عادي.

> الأبسط: خزني `lines` كـ JSON بعمود واحد. ما في داعي لجدول سطور، لأنه المعلق مؤقت وما بيأثر على شي.

---

## قائمة الفواتير

### الطلب

```http
GET /api/invoices?period=week&cashier=3&method=credit&status=completed&search=أبو محمد&page=1
```

| المعامل   | القيم                                                          | إذا ما انبعت |
| --------- | -------------------------------------------------------------- | ------------ |
| `period`  | `today` `yesterday` `week` (آخر 7 أيام) `month` (الشهر الحالي) | `today`      |
| `cashier` | رقم الموظف                                                     | الكل         |
| `method`  | `cash` `bank` `credit` `mixed`                                 | الكل         |
| `status`  | `completed` `partlyReturned` `returned`                        | الكل         |
| `search`  | رقم الفاتورة أو اسم الزبون                                     | بدون         |
| `page`    | رقم. الصفحة 25 فاتورة                                          | 1            |

### الرد

```json
{
  "data": [
    {
      "id": 1482,
      "number": "INV-001482",
      "at": "2026-11-24T10:42:00+02:00",
      "customer": "أبو محمد",
      "cashier": "محمد العطار",
      "lineCount": 3,
      "method": "mixed",
      "total": 65,
      "status": "completed"
    }
  ],
  "meta": { "total": 214, "page": 1, "perPage": 25 },
  "totals": { "count": 214, "total": 9840.5, "cash": 6210, "bank": 2400.5, "credit": 1230 }
}
```

`totals` لكل الفواتير المفلترة، مش للصفحة بس.

> **الكاشير بيشوف فواتيره بس؟** السيرفر الوهمي بيعرض الكل. قرار إلك: لو بدك، فلتري تلقائياً بـ `user_id` للكاشير.

---

## تفاصيل فاتورة

```http
GET /api/invoices/1482
GET /api/invoices/lookup?number=INV-001482
```

الرابط التاني للمرتجعات: الكاشير بيكتب رقم الإيصال (أو جزء منه زي `1482`). بلارافيل، شيلي كل شي مش رقم وابحثي بالرقم.

```json
{
  "data": {
    "id": 1482,
    "number": "INV-001482",
    "at": "2026-11-24T10:42:00+02:00",
    "shiftNumber": 41,
    "customer": { "id": 7, "name": "أبو محمد", "phone": "0599222333" },
    "cashier": "محمد العطار",
    "lines": [
      {
        "productId": 12,
        "name": "Augmentin 625mg 14 Tablets",
        "batch": "AUG-2611",
        "unit": "علبة",
        "quantity": 1,
        "price": 45,
        "total": 45,
        "returned": 0
      }
    ],
    "subtotal": 68,
    "discount": 3,
    "total": 65,
    "payment": {
      "method": "mixed",
      "cash": 40,
      "bank": 0,
      "credit": 25,
      "received": 50,
      "change": 10
    },
    "status": "completed",
    "profit": 18.4,
    "log": [{ "at": "2026-11-24T10:42:00+02:00", "text": "أنشأها محمد العطار" }]
  }
}
```

| الحقل              | معناه                                                            |
| ------------------ | ---------------------------------------------------------------- |
| `lines.*.batch`    | أول دفعة انخدم منها. لو السطر انخدم من دفعتين، الأولى بس         |
| `lines.*.unit`     | اسم الوحدة وقت البيع (محفوظ، مش من الصنف)                        |
| `lines.*.price`    | السعر وقت البيع (محفوظ)                                          |
| `lines.*.returned` | كم رجع منه، بنفس الوحدة                                          |
| `profit`           | الإجمالي − مجموع التكلفة. `null` لو المستخدم ما بيشوف التكلفة    |
| `log`              | سجل الفاتورة: الإنشاء، والمرتجعات. نص جاهز                       |
| `status`           | `completed`، `partlyReturned` لو رجع شي، `returned` لو رجع كل شي |

التكلفة لكل سطر: مجموع (الكمية من كل دفعة × تكلفة الدفعة). عشان هيك بنخزن `invoice_item_batches`.

---

## المرتجعات

### شو بيصير بالشاشة

1. الكاشير بيكتب رقم الفاتورة.
2. بتطلع سطورها، ولكل سطر كم ممكن يرجع (المباع − اللي رجع قبل).
3. لكل سطر: الكمية، السبب، ووين بيروح (للرف أو تالف).
4. طريقة رجوع الفلوس: نقدي، بنكي، أو من الدين.
5. **لازم صيدلي أو مديرة يوافق**. الكاشير بيختار مين وافق من قائمة الموظفين (الصيادلة والمديرة الفعالين).

> قائمة الموافقين جاية من `GET /api/staff`. هاد الرابط بالوحدة 2 للمديرة بس، فالكاشير رح ياخد 403. الحل: افتحي **القراءة** بس لكل الأدوار، وخلي الإضافة والتعديل للمديرة.
>
> وكمان: الفرونت بيبعت `approverId` بس، بدون أي إثبات إنه الموافق فعلاً وافق. الأأمن بالحقيقي إنه الموافق يكتب كلمة مروره أو رمز، والسيرفر يفحصه. هاد مش مبني بالفرونت لسا.

### الطلب

```http
POST /api/returns
```

```json
{
  "invoiceId": 1482,
  "lines": [
    {
      "productId": 12,
      "batch": "AUG-2611",
      "quantity": 1,
      "reason": "notNeeded",
      "destination": "stock"
    }
  ],
  "refund": "cash",
  "approverId": 1
}
```

| الحقل                 | القيم                                                   |
| --------------------- | ------------------------------------------------------- |
| `lines.*.reason`      | `notNeeded` `wrongItem` `damaged` `sideEffects` `other` |
| `lines.*.destination` | `stock` (يرجع للرف) أو `damage` (تالف)                  |
| `refund`              | `cash` (من الدرج) `bank` `debt` (ينقص من دين الزبون)    |

### الفحوصات

| الفحص                                          | الرد                               |
| ---------------------------------------------- | ---------------------------------- |
| الفاتورة موجودة                                | 404                                |
| مر أقل من `returnDays` يوم على البيع           | 422 `invoiceId` ← `tooOld`         |
| الموافق موجود، فعال، ومش كاشير                 | 422 `approverId` ← `invalid`       |
| في سطر بكمية > 0                               | 422 `lines` ← `required`           |
| كمية كل سطر ≤ المباع − اللي رجع قبل            | 422 `lines.N.quantity` ← `tooMuch` |
| لو `debt`: الفاتورة إلها زبون                  | 422 `refund` ← `noCustomer`        |
| لو `debt`: المبلغ مش أكتر من دين الزبون الحالي | 422 `refund` ← `moreThanDebt`      |

### المبلغ

الخصم بيتوزع على السطور بالنسبة:

```
share  = total ÷ subtotal         (لو الفاتورة فيها خصم، share أقل من 1)
amount = مجموع (سعر الوحدة × الكمية الراجعة × share)
```

مثال: فاتورة 68 بخصم 3، يعني 65. `share = 0.956`. رجع سطر سعره 45 ← المبلغ 43.01.

### شو بيصير جوا السيرفر

1. `returned` بسطر الفاتورة بيزيد.
2. الكمية بتتحول لأول وحدة (بنفس `unit_factor` المحفوظ بالسطر).
3. بترجع **لنفس الدفعة** اللي انباعت منها: حركة `return` موجبة.
4. لو `damage`: حركة `damage` سالبة فوراً، وسجل تالف سببه `customerReturn`.
5. لو `debt`: سطر بدفتر الزبون بيقلل دينه.
6. لو `cash`: المرتجع مربوط بالوردية المفتوحة، فبينقص من النقدي المتوقع.
7. حالة الفاتورة: `returned` لو كل السطور رجعت كاملة، وإلا `partlyReturned`.
8. سطر بسجل الفاتورة: "مرتجع RT-0013 بـ 43.01 ₪ · وافق رزان".
9. سطر بسجل النشاط: `returnApproved`.

### الرد

201:

```json
{
  "data": {
    "id": 13,
    "number": "RT-0013",
    "invoiceNumber": "INV-001482",
    "amount": 43.01,
    "refund": "cash"
  }
}
```

---

## البيع بدون نت

الفرونت فيه "صندوق صادر": لو النت قطع، الفواتير بتنحفظ بالمتصفح وبتنبعت لما يرجع. الشرح الكامل:

```
src/shared/lib/offline/README.md
```

اللي لازم السيرفر يعمله: **ما يسجل نفس الفاتورة مرتين**. لو النت رجع وقطع بنص الإرسال، ممكن الفاتورة توصل مرتين.

الحل: كل فاتورة إلها رقم بيعمله المتصفح (`clientId`). السيرفر بيخزنه بعمود فريد، ولو وصل نفس الرقم مرة تانية، بيرجع الفاتورة الموجودة بدل ما يعمل جديدة:

```php
if ($clientId = $request->input('clientId')) {
    if ($existing = Invoice::where('client_id', $clientId)->first()) {
        return new InvoiceResource($existing);
    }
}
```

> الفرونت لسا ما بيبعت `clientId` بالبيع. بس ضيفي العمود من هلق، عشان لما تكمل ميزة البيع بدون نت ما تحتاجي تغيري القاعدة.

---

## الجداول

```php
Schema::create('shifts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('pharmacy_id')->constrained()->cascadeOnDelete();
    $table->unsignedInteger('number');
    $table->foreignId('user_id')->constrained();
    $table->enum('status', ['open', 'closed'])->default('open');
    $table->decimal('opening_cash', 12, 2);
    $table->decimal('expected_cash', 12, 2)->nullable();
    $table->decimal('counted_cash', 12, 2)->nullable();
    $table->string('note', 300)->default('');
    $table->timestamp('opened_at');
    $table->timestamp('closed_at')->nullable();
    $table->timestamps();

    $table->unique(['pharmacy_id', 'number']);
});

Schema::create('invoices', function (Blueprint $table) {
    $table->id();
    $table->foreignId('pharmacy_id')->constrained()->cascadeOnDelete();
    $table->string('number', 20)->nullable();
    $table->foreignId('shift_id')->nullable()->constrained();
    $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignId('user_id')->constrained();
    $table->decimal('subtotal', 12, 2);
    $table->decimal('discount', 12, 2)->default(0);
    $table->decimal('total', 12, 2);
    $table->enum('method', ['cash', 'bank', 'credit', 'mixed']);
    $table->decimal('paid_cash', 12, 2)->default(0);
    $table->decimal('paid_bank', 12, 2)->default(0);
    $table->decimal('paid_credit', 12, 2)->default(0);
    $table->decimal('received', 12, 2)->default(0);
    $table->decimal('change', 12, 2)->default(0);
    $table->enum('status', ['completed', 'partlyReturned', 'returned'])->default('completed');
    $table->uuid('client_id')->nullable()->unique();
    $table->timestamps();

    $table->index(['pharmacy_id', 'created_at']);
});

Schema::create('invoice_items', function (Blueprint $table) {
    $table->id();
    $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
    $table->foreignId('product_id')->constrained();
    $table->string('name');                       // محفوظ وقت البيع
    $table->unsignedTinyInteger('unit_index');
    $table->string('unit_name', 20);              // محفوظ وقت البيع
    $table->decimal('unit_factor', 12, 4);        // كم من أول وحدة بالوحدة الوحدة
    $table->decimal('quantity', 12, 4);           // بوحدة البيع
    $table->decimal('price', 10, 2);              // محفوظ وقت البيع
    $table->decimal('total', 12, 2);
    $table->decimal('returned', 12, 4)->default(0);
});

Schema::create('invoice_item_batches', function (Blueprint $table) {
    $table->id();
    $table->foreignId('invoice_item_id')->constrained()->cascadeOnDelete();
    $table->foreignId('batch_id')->constrained();
    $table->decimal('quantity', 12, 4);           // بأول وحدة
    $table->decimal('cost', 10, 2);               // تكلفة أول وحدة وقت البيع
});

Schema::create('held_sales', function (Blueprint $table) {
    $table->id();
    $table->foreignId('pharmacy_id')->constrained()->cascadeOnDelete();
    $table->foreignId('user_id')->constrained();
    $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
    $table->string('label', 80);
    $table->decimal('discount', 12, 2)->default(0);
    $table->json('lines');
    $table->decimal('total', 12, 2);
    $table->timestamps();
});

Schema::create('sale_returns', function (Blueprint $table) {
    $table->id();
    $table->foreignId('pharmacy_id')->constrained()->cascadeOnDelete();
    $table->string('number', 20)->nullable();
    $table->foreignId('invoice_id')->constrained();
    $table->foreignId('shift_id')->nullable()->constrained();
    $table->foreignId('user_id')->constrained();
    $table->foreignId('approved_by')->constrained('users');
    $table->decimal('amount', 12, 2);
    $table->enum('refund', ['cash', 'bank', 'debt']);
    $table->timestamps();
});

Schema::create('sale_return_items', function (Blueprint $table) {
    $table->id();
    $table->foreignId('sale_return_id')->constrained()->cascadeOnDelete();
    $table->foreignId('invoice_item_id')->constrained();
    $table->foreignId('batch_id')->constrained();
    $table->decimal('quantity', 12, 4);           // بوحدة البيع
    $table->enum('reason', ['notNeeded', 'wrongItem', 'damaged', 'sideEffects', 'other']);
    $table->enum('destination', ['stock', 'damage']);
});
```

> ليش بنخزن الاسم والوحدة والسعر بسطر الفاتورة؟ لأنه لو الصنف تغير اسمه أو سعره بكرا، الفاتورة القديمة لازم تضل زي ما انطبعت.

---

## الروابط بملف لارافيل

```php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/shifts/current', [ShiftController::class, 'current']);
    Route::post('/shifts', [ShiftController::class, 'store']);
    Route::get('/shifts/current/summary', [ShiftController::class, 'summary']);
    Route::post('/shifts/current/close', [ShiftController::class, 'close']);

    Route::post('/sales', [SaleController::class, 'store']);
    Route::get('/sales/held', [HeldSaleController::class, 'index']);
    Route::post('/sales/held', [HeldSaleController::class, 'store']);
    Route::delete('/sales/held/{held}', [HeldSaleController::class, 'destroy']);

    Route::get('/invoices', [InvoiceController::class, 'index']);
    Route::get('/invoices/lookup', [InvoiceController::class, 'lookup']);   // قبل {invoice}
    Route::get('/invoices/{invoice}', [InvoiceController::class, 'show']);

    Route::post('/returns', [ReturnController::class, 'store']);
});
```

---

## اختبري حالك

- [ ] بيع بدون وردية بيرجع 409، والشاشة بتعرض "افتح وردية"
- [ ] بيع شريط من علبة فيها شريطين بينقص الكمية 0.5
- [ ] البيع بياخد من الدفعة الأقرب انتهاء، والدفعة المنتهية ما بتنباع
- [ ] كمية أكتر من المخزون بتعرض الخطأ على السطر الصح
- [ ] خصم أكبر من حد الكاشير بيرجع `overLimit`
- [ ] آجل لزبون فوق حده بيطلب موافقة المديرة
- [ ] كاشيرين بيبيعوا آخر علبة بنفس اللحظة: واحد بس بينجح
- [ ] ملخص الوردية: النقدي المتوقع مطابق للحساب اليدوي
- [ ] إغلاق بفرق بدون ملاحظة بيرجع 422، وفي معلق بيرجع 409
- [ ] مرتجع لفاتورة فيها خصم بيرجع المبلغ بعد الخصم
- [ ] مرتجع لتالف بيكتب حركتين: return وdamage
- [ ] مرتجع بعد مدة الإرجاع بيرجع `tooOld`
