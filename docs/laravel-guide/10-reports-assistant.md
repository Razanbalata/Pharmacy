# الوحدة 10: التقارير والمساعد الذكي

التقارير قراءة وحساب بس، زي لوحة التحكم. والمساعد بيستخدم نفس حسابات التقارير، بس بيجاوب بكلام.

المديرة والصيدلي بيفتحوا الصفحتين. تقرير الربح للمديرة بس.

## المحتويات

1. [الصفحات](#الصفحات)
2. [الفترات](#الفترات)
3. [تقرير المبيعات](#تقرير-المبيعات)
4. [تقرير الربح](#تقرير-الربح)
5. [تقرير المخزون](#تقرير-المخزون)
6. [تقرير الديون](#تقرير-الديون)
7. [المساعد الذكي: المحادثات](#المساعد-الذكي-المحادثات)
8. [شكل الجواب](#شكل-الجواب)
9. [التحليل الذكي](#التحليل-الذكي)
10. [بناء المساعد بلارافيل](#بناء-المساعد-بلارافيل)
11. [الجداول](#الجداول)
12. [الروابط بملف لارافيل](#الروابط-بملف-لارافيل)
13. [اختبري حالك](#اختبري-حالك)

---

## الصفحات

| الصفحة        | الرابط                                      | ملف الصفحة                                 |
| ------------- | ------------------------------------------- | ------------------------------------------ |
| التقارير      | `/reports`                                  | `src/pages/reports/ui/ReportsPage.tsx`     |
| المساعد الذكي | `/assistant`                                | `src/pages/assistant/ui/AssistantPage.tsx` |
| التحليل الذكي | لوحة جانبية بلوحة التحكم والتقارير والمساعد | `src/widgets/smart-analysis/`              |

| شو                | وين                                                  |
| ----------------- | ---------------------------------------------------- |
| أنواع التقارير    | `src/pages/reports/model/types.ts`                   |
| طلبات التقارير    | `src/pages/reports/api/reports-api.ts`               |
| أنواع المساعد     | `src/pages/assistant/model/types.ts`                 |
| أنواع التحليل     | `src/widgets/smart-analysis/model/types.ts`          |
| رد السيرفر الوهمي | `src/app/mocks/handlers/reports.ts` و `assistant.ts` |

الطباعة والحفظ كـ PDF بيصيروا بالفرونت. ما في رابط تصدير للتقارير بالسيرفر.

---

## الفترات

تقريري المبيعات والربح بياخدوا `period`، وبيرجعوا الفترة ومعها فترة **بنفس الطول قبلها** للمقارنة.

| `period`    | من               | لـ    | المقارنة                          |
| ----------- | ---------------- | ----- | --------------------------------- |
| `today`     | اليوم            | اليوم | مبارح                             |
| `week`      | قبل 6 أيام       | اليوم | الـ 7 أيام اللي قبلهم             |
| `month`     | أول الشهر        | اليوم | أول الشهر الماضي لنفس اليوم منه   |
| `lastMonth` | أول الشهر الماضي | آخره  | الشهر اللي قبله كامل              |
| `year`      | أول السنة        | اليوم | أول السنة الماضية لنفس اليوم منها |

إذا ما انبعت: `month`.

كل تقرير فيه فترة بيرجع:

```json
{
  "period": "month",
  "from": "2026-11-01",
  "to": "2026-11-24",
  "compareFrom": "2026-10-01",
  "compareTo": "2026-10-24"
}
```

```php
// app/Support/ReportRange.php
final class ReportRange
{
    public static function of(string $period): array
    {
        $today = today();

        [$from, $to, $cFrom, $cTo] = match ($period) {
            'today' => [$today, $today, $today->copy()->subDay(), $today->copy()->subDay()],
            'week' => [$today->copy()->subDays(6), $today, $today->copy()->subDays(13), $today->copy()->subDays(7)],
            'lastMonth' => [
                $today->copy()->subMonthNoOverflow()->startOfMonth(), $today->copy()->subMonthNoOverflow()->endOfMonth(),
                $today->copy()->subMonthsNoOverflow(2)->startOfMonth(), $today->copy()->subMonthsNoOverflow(2)->endOfMonth(),
            ],
            'year' => [$today->copy()->startOfYear(), $today, $today->copy()->subYear()->startOfYear(), $today->copy()->subYear()],
            default => [
                $today->copy()->startOfMonth(), $today,
                $today->copy()->subMonthNoOverflow()->startOfMonth(), $today->copy()->subMonthNoOverflow(),
            ],
        };

        return [
            'period' => in_array($period, ['today', 'week', 'month', 'lastMonth', 'year']) ? $period : 'month',
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'compareFrom' => $cFrom->toDateString(),
            'compareTo' => $cTo->toDateString(),
        ];
    }
}
```

---

## تقرير المبيعات

```http
GET /api/reports/sales?period=month
```

```json
{
  "data": {
    "period": "month",
    "from": "2026-11-01",
    "to": "2026-11-24",
    "compareFrom": "2026-10-01",
    "compareTo": "2026-10-24",
    "sales": 38420.5,
    "invoices": 912,
    "average": 42.13,
    "returns": 310,
    "previous": { "sales": 35100, "invoices": 870, "average": 40.34 },
    "series": {
      "unit": "day",
      "points": [{ "date": "2026-11-01", "total": 1520 }]
    },
    "byMethod": { "cash": 26100, "bank": 8420.5, "credit": 3900 },
    "byStaff": [{ "id": 3, "name": "محمد العطار", "total": 20400, "invoices": 480 }],
    "top": [
      { "productId": 15, "name": "Panadol Extra", "quantity": 210, "unit": "علبة", "total": 3780 }
    ]
  }
}
```

| الحقل      | الحساب                                                                         |
| ---------- | ------------------------------------------------------------------------------ |
| `sales`    | مجموع `total` للفواتير بالفترة                                                 |
| `invoices` | عددهم                                                                          |
| `average`  | `sales ÷ invoices`، أو 0                                                       |
| `returns`  | مجموع مبالغ المرتجعات بالفترة                                                  |
| `previous` | نفس الأرقام لفترة المقارنة                                                     |
| `series`   | نقطة لكل يوم بالفترة. للسنة: نقطة لكل شهر لحد الشهر الحالي، `date` = `YYYY-MM` |
| `byMethod` | مجموع `paid_cash` و`paid_bank` و`paid_credit`                                  |
| `byStaff`  | لكل كاشير: مجموعه وعدد فواتيره، من الأكبر                                      |
| `top`      | أكبر 5 (صنف + وحدة) بقيمة المبيع                                               |

> السيرفر الوهمي فيه "ورديات قديمة محفوظة كمجاميع" (`archived`)، عشان يكون في بيانات لسنة كاملة. بلارافيل ما بتحتاجيها: عندك الفواتير كلها.

---

## تقرير الربح

**للمديرة بس.** غيرها: 403.

```http
GET /api/reports/profit?period=month
```

```json
{
  "data": {
    "period": "month",
    "from": "2026-11-01",
    "to": "2026-11-24",
    "compareFrom": "2026-10-01",
    "compareTo": "2026-10-24",
    "sales": 38420.5,
    "cost": 27100,
    "gross": 11320.5,
    "expenses": 2380,
    "damage": 142.5,
    "net": 8798,
    "grossMargin": 29.5,
    "netMargin": 22.9,
    "previousNetMargin": 21.4,
    "byCategory": [{ "id": 2, "name": "مضادات حيوية", "sales": 9200, "profit": 2410 }],
    "lowMargin": [{ "productId": 33, "name": "Glucophage 500mg", "margin": 14 }]
  }
}
```

```
gross        = sales − cost
net          = gross − expenses − damage
grossMargin  = gross ÷ sales × 100     (لخانة عشرية وحدة)
netMargin    = net ÷ sales × 100
```

| الحقل                   | الحساب                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| `cost`                  | مجموع تكلفة الفواتير بالفترة (من `invoice_item_batches`)                                 |
| `expenses`              | مجموع المصاريف بالفترة (بتاريخ المصروف)                                                  |
| `damage`                | مجموع خسارة التالف بالفترة                                                               |
| `previousNetMargin`     | `netMargin` لفترة المقارنة، أو `null` لو ما في مبيعات فيها                               |
| `byCategory`            | لكل تصنيف: المبيع والربح، من الأكبر ربح. صنف بدون تصنيف: `id: null`، `name: ""`          |
| `byCategory.*.archived` | للسيرفر الوهمي بس. بلارافيل ما بتحتاجيه                                                  |
| `lowMargin`             | الأصناف الفعالة اللي ربحها أقل من 22%: (سعر أول وحدة − تكلفة آخر دفعة) ÷ السعر، من الأقل |

---

## تقرير المخزون

بدون فترة. صورة المخزون هلق.

```http
GET /api/reports/stock
```

```json
{
  "data": {
    "valueAtCost": 84200,
    "valueAtPrice": 118900,
    "damageThisMonth": 142.5,
    "stagnant": { "count": 14, "value": 3200 },
    "expired": { "batches": 2, "value": 36 },
    "within30": { "count": 3, "value": 410 },
    "within90": { "count": 5, "value": 880 },
    "nearest": [
      {
        "productId": 12,
        "name": "Augmentin 625mg",
        "batch": "AUG-2611",
        "expiry": "2026-12-20",
        "quantity": 3,
        "unit": "علبة",
        "value": 96
      }
    ],
    "byCategory": [{ "name": "مضادات حيوية", "value": 21400 }]
  }
}
```

| الحقل          | الحساب                                                             |
| -------------- | ------------------------------------------------------------------ |
| `valueAtCost`  | مجموع (كمية × تكلفة) لكل دفعة فيها كمية، بالأصناف الفعالة          |
| `valueAtPrice` | مجموع (كمية × سعر أول وحدة)                                        |
| `stagnant`     | أصناف فيها كمية، وما انباع منها شي آخر 60 يوم. عددها وقيمة دفعاتها |
| `expired`      | دفعات تاريخها قبل اليوم: عددها (دفعات) وقيمتها                     |
| `within30`     | دفعات بتنتهي خلال 30 يوم: عدد **الأصناف** وقيمتها                  |
| `within90`     | دفعات بتنتهي **بعد 30 ولحد 90** يوم. مش متداخلة مع اللي فوق        |
| `nearest`      | أقرب 5 دفعات من الـ 90 يوم، بقيمتها بالتكلفة                       |
| `byCategory`   | قيمة المخزون بالتكلفة لكل تصنيف، من الأكبر                         |

---

## تقرير الديون

بدون فترة.

```http
GET /api/reports/debts
```

```json
{
  "data": {
    "customers": { "total": 4820.5, "recent": 1200, "weeks": 1710.5, "late": 1910 },
    "top": [{ "customerId": 7, "name": "أبو محمد", "debt": 480, "days": 43, "late": true }],
    "reminders": [{ "customerId": 7, "name": "أبو محمد", "phone": "0599222333", "debt": 480 }],
    "collectedThisMonth": 2340,
    "suppliers": {
      "total": 4210.75,
      "list": [{ "supplierId": 1, "name": "شركة القدس للأدوية", "balance": 1840.5 }]
    }
  }
}
```

| الحقل                         | الحساب                                           |
| ----------------------------- | ------------------------------------------------ |
| `customers.recent/weeks/late` | مجموع الديون حسب عمر الدين (الوحدة 7)            |
| `top`                         | أول 4: المتأخرين أول، بعدين الأكبر دين           |
| `reminders`                   | المتأخرين اللي إلهم جوال، لزر "ذكّرهم على واتساب" |
| `collectedThisMonth`          | تسديدات الزبائن هالشهر                           |
| `suppliers`                   | الموردين اللي إلهم رصيد أكبر من صفر، من الأكبر   |

---

## المساعد الذكي: المحادثات

### شو بيصير بالشاشة

قائمة محادثات على الجنب، والمحادثة بالنص. المستخدم بيسأل بكلامه ("شو لازم أطلب هالأسبوع؟")، والجواب بيطلع نص وجداول وأعمدة وأزرار. في أسئلة جاهزة تحت.

### الروابط

| الطريقة | الرابط                                          | الطلب              | الرد                |
| ------- | ----------------------------------------------- | ------------------ | ------------------- |
| GET     | `/api/assistant/conversations`                  |                    | القائمة، الأحدث أول |
| POST    | `/api/assistant/conversations`                  |                    | 201، محادثة فاضية   |
| GET     | `/api/assistant/conversations/{id}?language=ar` |                    | المحادثة برسائلها   |
| POST    | `/api/assistant/conversations/{id}/messages`    | `text`، `language` | 201، رسالة الجواب   |
| GET     | `/api/assistant/analysis?language=ar`           |                    | التحليل             |

القائمة:

```json
{ "data": [{ "id": 4, "title": "شو لازم أطلب هالأسبوع؟", "at": "2026-11-24T09:30:00+02:00" }] }
```

المحادثة:

```json
{
  "data": {
    "id": 4,
    "title": "شو لازم أطلب هالأسبوع؟",
    "at": "2026-11-24T09:30:00+02:00",
    "messages": [
      {
        "id": 11,
        "role": "user",
        "at": "2026-11-24T09:30:00+02:00",
        "text": "شو لازم أطلب هالأسبوع؟"
      },
      { "id": 12, "role": "assistant", "at": "2026-11-24T09:30:04+02:00", "blocks": ["..."] }
    ]
  }
}
```

السؤال:

```json
{ "text": "مين أكتر زبون مديون؟", "language": "ar" }
```

| القاعدة                  | الخطأ                    |
| ------------------------ | ------------------------ |
| `text` مش فاضي           | `text` ← `required`      |
| `language`: `ar` أو `en` | لو غير هيك، اعتبريه `ar` |

الرد (201): **رسالة الجواب بس**، مش المحادثة كلها:

```json
{ "data": { "id": 14, "role": "assistant", "at": "2026-11-24T09:41:02+02:00", "blocks": ["..."] } }
```

**العنوان:** أول سؤال بالمحادثة، أول 40 حرف (وبعدها `…` لو أطول). و`at` بيصير وقت آخر رسالة.

---

## شكل الجواب

الجواب **قائمة قطع**، كل قطعة نوع من أربعة:

```json
"blocks": [
  { "type": "text", "text": "في 4 أصناف لازم تنطلب. أهمها Ventolin، باقي منه علبة وحدة." },
  {
    "type": "table",
    "columns": ["الصنف", "المخزون", "بيخلص خلال", "اطلبي"],
    "rows": [
      ["Ventolin Inhaler", 1, "يومين", 9],
      ["Augmentin 625mg", 3, "5 أيام", 7]
    ]
  },
  {
    "type": "bars",
    "items": [
      { "label": "محمد", "value": 20400 },
      { "label": "سارة", "value": 18020 }
    ]
  },
  {
    "type": "actions",
    "items": [
      { "kind": "order", "id": 17, "label": "PO-0017" },
      { "kind": "report", "tab": "stock" },
      { "kind": "products", "tab": "low" },
      { "kind": "customer", "id": 7, "label": "أبو محمد" },
      { "kind": "customers" }
    ]
  }
]
```

| القطعة    | شو بتعرض                     |
| --------- | ---------------------------- |
| `text`    | فقرة                         |
| `table`   | جدول صغير. الخلايا نص أو رقم |
| `bars`    | أعمدة أفقية للمقارنة         |
| `actions` | أزرار تحت الجواب             |

الأزرار، والفرونت بيعرف لوين بيودي كل واحد:

| `kind`      | الحقول                                  | لوين                |
| ----------- | --------------------------------------- | ------------------- |
| `order`     | `id`، `label`                           | `/purchases/{id}`   |
| `report`    | `tab`: `sales` `profit` `stock` `debts` | `/reports?tab=...`  |
| `products`  | `tab`: `low` `soon`                     | `/products?tab=...` |
| `customer`  | `id`، `label`                           | `/customers/{id}`   |
| `customers` | ما في                                   | `/customers`        |

الملف اللي بيحول الزر لرابط:

```
src/widgets/smart-analysis/model/use-action-link.ts
```

> **النص بلغة `language`.** هون السيرفر هو اللي بيكتب الجمل، مش الفرونت، لأنه الجواب كلام حر. فلازم يحترم اللغة اللي انبعتت.

---

## التحليل الذكي

لوحة جانبية بتنفتح من لوحة التحكم والتقارير والمساعد. حكم عام، نقاط قليلة لكل وحدة زر، وملخص.

```http
GET /api/assistant/analysis?language=ar
```

```json
{
  "data": {
    "at": "2026-11-24T09:00:00+02:00",
    "status": "attention",
    "headline": "الشهر ماشي منيح، بس في 3 أشياء لازم تنحل هالأسبوع.",
    "items": [
      {
        "tag": "urgent",
        "title": "Ventolin قرب يخلص",
        "text": "باقي علبة وحدة، وبينباع منه تقريباً علبتين بالأسبوع.",
        "action": { "kind": "products", "tab": "low" }
      },
      {
        "tag": "week",
        "title": "6 زبائن متأخرين",
        "text": "مجموع ديونهم 1910 ₪، أقدمهم من 43 يوم.",
        "action": { "kind": "customers" }
      },
      {
        "tag": "chance",
        "title": "أصناف راكدة",
        "text": "14 صنف ما انباع منهم شي من شهرين، قيمتهم 3200 ₪.",
        "action": { "kind": "report", "tab": "stock" }
      }
    ],
    "summary": "المبيعات هالشهر لحد اليوم 38,420 ₪، وصافي الربح 8,798 ₪. أعلى يوم كان 21/11 بـ 2,140 ₪."
  }
}
```

| الحقل    | القيم                                                               |
| -------- | ------------------------------------------------------------------- |
| `status` | `good` (كله تمام)، `attention` (في شي لازم ينتبه)، `bad` (في مشكلة) |
| `tag`    | `urgent` (هلق)، `week` (هالأسبوع)، `chance` (فرصة)                  |

الفرونت بيحفظ التحليل بالذاكرة حسب اللغة، فما بينطلب كل مرة.

---

## بناء المساعد بلارافيل

في طريقتين. ابدئي بالأولى، وانتقلي للتانية لما تشتغل.

### الطريقة الأولى: كلمات مفتاحية (زي السيرفر الوهمي)

السيرفر الوهمي بيدور بالسؤال على كلمات، وبيختار جواب جاهز:

| الكلمات                                        | الجواب            |
| ---------------------------------------------- | ----------------- |
| اطلب، طلبيه، نواقص، ناقص، يخلص، order، restock | شو لازم ينطلب     |
| ربح، ارباح، profit                             | الربح             |
| راكد، stagnant، not selling، slow              | الأصناف الراكدة   |
| مديون، متاخر، دين، ديون، debt، owes، late      | الزبائن المديونين |
| قارن، موظف، staff، compare                     | مبيعات الموظفين   |
| ينتهي، انتهاء، صلاحيه، expir                   | اللي بينتهي قريب  |

ولكل جواب دالة بتبني القطع من خدمات التقارير. انسخي الدوال من:

```
src/app/mocks/handlers/assistant.ts
```

### الطريقة التانية: نموذج ذكاء اصطناعي مع أدوات

النموذج (Gemini أو Groq مثلاً) بيفهم السؤال، وبيطلب "أداة" من عندك، وإنتِ بتشغليها وبترجعيله الأرقام، وهو بيكتب الجواب بشكل القطع.

**الأدوات** هي نفس دوال التقارير:

| الأداة              | بترجع                       |
| ------------------- | --------------------------- |
| `get_sales_report`  | تقرير المبيعات لفترة        |
| `get_profit_report` | تقرير الربح (للمديرة بس!)   |
| `get_stock_report`  | تقرير المخزون               |
| `get_debts_report`  | تقرير الديون                |
| `get_restock_list`  | الطلبات المقترحة (الوحدة 4) |

```php
// app/Services/Assistant/AssistantService.php
class AssistantService
{
    public function answer(string $question, string $language, User $user): array
    {
        $tools = $this->toolsFor($user);   // بدون الربح لغير المديرة

        $messages = [
            ['role' => 'system', 'content' => $this->systemPrompt($language)],
            ['role' => 'user', 'content' => $question],
        ];

        // دورة: النموذج بيطلب أداة ← بنشغلها ← بنرجعله النتيجة ← لحد ما يجاوب
        for ($round = 0; $round < 4; $round++) {
            $reply = $this->llm->chat($messages, $tools);

            if (! $reply->toolCalls) {
                return $this->toBlocks($reply->content);
            }

            foreach ($reply->toolCalls as $call) {
                $messages[] = ['role' => 'tool', 'name' => $call->name,
                    'content' => json_encode($this->run($call->name, $call->arguments, $user))];
            }
        }

        return [['type' => 'text', 'text' => $language === 'ar' ? 'ما قدرت أجاوب هلق.' : 'I could not answer now.']];
    }

    private function systemPrompt(string $language): string
    {
        return <<<TXT
        You are the assistant of a pharmacy in Gaza. Answer in {$language} ("ar" means Palestinian Arabic, short and clear).
        Use only numbers that the tools return. Never invent a number.
        Reply with JSON only: {"blocks": [...]}, where each block is one of:
          {"type":"text","text":"..."}
          {"type":"table","columns":["..."],"rows":[["...", 1]]}
          {"type":"bars","items":[{"label":"...","value":1}]}
          {"type":"actions","items":[{"kind":"order","id":1,"label":"PO-0001"} | {"kind":"report","tab":"sales|profit|stock|debts"} | {"kind":"products","tab":"low|soon"} | {"kind":"customer","id":1,"label":"..."} | {"kind":"customers"}]}
        TXT;
    }

    /** يتأكد إنه الرد بالشكل الصح، وإلا بيرجعه نص عادي */
    private function toBlocks(string $content): array
    {
        $data = json_decode($content, true);
        $allowed = ['text', 'table', 'bars', 'actions'];
        $blocks = collect($data['blocks'] ?? [])->filter(fn ($b) => in_array($b['type'] ?? null, $allowed))->values()->all();

        return $blocks ?: [['type' => 'text', 'text' => trim($content)]];
    }
}
```

> **أمان مهم:** الأدوات بتشتغل بصلاحيات المستخدم اللي سأل. لا تعطي النموذج أداة الربح لما الصيدلي يسأل، حتى لو طلبها. والفلتر العام تبع الصيدلية شغال جوا الأدوات لحاله، لأنه `auth()->user()` نفسه.
>
> **التكلفة:** كل سؤال بيستهلك من الحصة. خزني الجواب، وحطي حد أسئلة لكل صيدلية باليوم:
>
> ```php
> RateLimiter::attempt("assistant:{$pharmacyId}", 100, fn () => ..., 86400);
> ```

التحليل نفس الفكرة: أداة وحدة بتجمع التقارير الأربعة، والنموذج بيرجع `status` و`headline` و`items` و`summary`. وخزني التحليل ساعة بالكاش لكل صيدلية ولغة، لأنه ما بيتغير كل دقيقة:

```php
Cache::remember("analysis:{$pharmacyId}:{$language}", 3600, fn () => $assistant->analysis($language, $user));
```

---

## الجداول

```php
Schema::create('assistant_conversations', function (Blueprint $table) {
    $table->id();
    $table->foreignId('pharmacy_id')->constrained()->cascadeOnDelete();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->string('title', 60)->default('');
    $table->timestamps();                        // updated_at هو at
});

Schema::create('assistant_messages', function (Blueprint $table) {
    $table->id();
    $table->foreignId('assistant_conversation_id')->constrained()->cascadeOnDelete();
    $table->enum('role', ['user', 'assistant']);
    $table->text('text')->nullable();            // للسؤال
    $table->json('blocks')->nullable();          // للجواب
    $table->timestamp('created_at')->useCurrent();
});
```

> المحادثات لكل **مستخدم**: الكاشير ما بيشوف محادثات المديرة. فلتري بـ `user_id` كمان.

---

## الروابط بملف لارافيل

```php
Route::middleware(['auth:sanctum', 'role:manager,pharmacist'])->group(function () {
    Route::get('/reports/sales', [ReportController::class, 'sales']);
    Route::get('/reports/profit', [ReportController::class, 'profit'])->middleware('role:manager');
    Route::get('/reports/stock', [ReportController::class, 'stock']);
    Route::get('/reports/debts', [ReportController::class, 'debts']);

    Route::get('/assistant/conversations', [AssistantController::class, 'index']);
    Route::post('/assistant/conversations', [AssistantController::class, 'store']);
    Route::get('/assistant/conversations/{conversation}', [AssistantController::class, 'show']);
    Route::post('/assistant/conversations/{conversation}/messages', [AssistantController::class, 'ask'])
        ->middleware('throttle:20,1');
    Route::get('/assistant/analysis', [AssistantController::class, 'analysis']);
});
```

> التحليل بينفتح من لوحة التحكم. لوحة الكاشير ما فيها زر التحليل، فتمام إنه 403 للكاشير.

---

## اختبري حالك

- [ ] تقرير المبيعات لـ "هالشهر" مجموعه = مجموع الفواتير بقائمة الفواتير لنفس الفترة
- [ ] `series` للسنة فيه نقطة لكل شهر لحد الشهر الحالي بس
- [ ] الصيدلي بياخد 403 على تقرير الربح، والتقارير التانية بتفتح
- [ ] `within30` و`within90` ما بيتداخلوا
- [ ] صنف ما انباع من 70 يوم بيطلع بالراكد
- [ ] سؤال بالإنجليزي مع `language=en` بيرجع جواب إنجليزي
- [ ] زر `order` بالجواب بيفتح طلب الشراء الصح
- [ ] سؤال فاضي بيرجع `required`
- [ ] الصيدلي بيسأل عن الربح: النموذج ما بيعطيه أرقام الربح
