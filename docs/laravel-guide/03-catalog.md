# الوحدة 3: الأصناف والتصنيفات والمواد الفعالة

هاي قلب النظام. كل شي تاني (البيع، الشراء، الجرد، التنبيهات) مبني على الصنف ودفعاته.

## المحتويات

1. [الصفحات ومين بيفتحها](#الصفحات-ومين-بيفتحها)
2. [الفكرة: صنف، وحدات، ودفعات](#الفكرة-صنف-وحدات-ودفعات)
3. [قائمة الأصناف](#قائمة-الأصناف)
4. [تفاصيل صنف](#تفاصيل-صنف)
5. [إضافة وتعديل صنف](#إضافة-وتعديل-صنف)
6. [التعديل الجماعي والتصدير](#التعديل-الجماعي-والتصدير)
7. [الباركود والملصقات](#الباركود-والملصقات)
8. [الكتالوج المشترك](#الكتالوج-المشترك)
9. [الاستيراد من إكسل](#الاستيراد-من-إكسل)
10. [التصنيفات](#التصنيفات)
11. [المواد الفعالة](#المواد-الفعالة)
12. [الجداول](#الجداول)
13. [الروابط بملف لارافيل](#الروابط-بملف-لارافيل)
14. [اختبري حالك](#اختبري-حالك)

---

## الصفحات ومين بيفتحها

| الصفحة         | الرابط               | المديرة | الصيدلي | الكاشير  | ملف الصفحة                                                  |
| -------------- | -------------------- | ------- | ------- | -------- | ----------------------------------------------------------- |
| الأصناف        | `/products`          | ✓       | ✓       | قراءة بس | `src/pages/catalog/products/ui/ProductsPage.tsx`            |
| تفاصيل صنف     | `/products/:id`      | ✓       | ✓       | قراءة بس | `src/pages/catalog/product-detail/ui/ProductDetailPage.tsx` |
| صنف جديد       | `/products/new`      | ✓       | ✓       |          | `src/pages/catalog/product-form/ui/ProductFormPage.tsx`     |
| تعديل صنف      | `/products/:id/edit` | ✓       | ✓       |          | نفس الملف                                                   |
| الاستيراد      | `/products/import`   | ✓       | ✓       |          | `src/pages/catalog/product-import/ui/ProductImportPage.tsx` |
| الملصقات       | `/products/labels`   | ✓       | ✓       |          | `src/pages/catalog/product-labels/ui/ProductLabelsPage.tsx` |
| التصنيفات      | `/categories`        | ✓       | ✓       |          | `src/pages/catalog/categories/ui/CategoriesPage.tsx`        |
| المواد الفعالة | `/ingredients`       | ✓       | ✓       |          | `src/pages/catalog/ingredients/ui/IngredientsPage.tsx`      |

القاعدة بالسيرفر:

| الفعل                        | مين مسموحله                              |
| ---------------------------- | ---------------------------------------- |
| قراءة الأصناف والتفاصيل      | الكل                                     |
| إضافة، تعديل، جماعي، استيراد | المديرة والصيدلي                         |
| شوف التكلفة (`cost`)         | المديرة، أو أي حد معه `seePurchasePrice` |

---

## الفكرة: صنف، وحدات، ودفعات

**الصنف** هو الدوا نفسه: "Augmentin 625mg 14 Tablets". إله اسم وباركود ومادة فعالة وتصنيف.

**الوحدات** هي طرق البيع. أول وحدة هي الأكبر، وكل وحدة بعدها بتقول كم منها بالوحدة اللي فوقها:

```json
"units": [
  { "name": "علبة", "perParent": null, "price": 45, "enabled": true },
  { "name": "شريط", "perParent": 2, "price": 23, "enabled": true },
  { "name": "حبة", "perParent": 7, "price": 3.5, "enabled": false }
]
```

يعني: العلبة فيها 2 شريط، والشريط فيه 7 حبات. الحبة موجودة بس مش مفعلة للبيع.

**الدفعات** هي المخزون الحقيقي. كل مرة بيدخل الدوا (شراء، رصيد أول، استيراد) بتنعمل دفعة إلها تاريخ انتهاء وكمية وتكلفة:

```
Augmentin 625mg
├─ دفعة AUG-2611  ← تنتهي 2026-12-20  ← 3 علب   ← تكلفة 32  ← هاي اللي بتنباع أول
└─ دفعة AUG-2703  ← تنتهي 2027-03-15  ← 18 علبة ← تكلفة 31
```

### قواعد مهمة جداً

| القاعدة                         | شرحها                                                           |
| ------------------------------- | --------------------------------------------------------------- |
| الكمية دايماً بأول وحدة          | `quantity: 2.5` يعني علبتين ونص. البيع بالشريط بينقص `0.5` علبة |
| كمية الصنف = مجموع كميات دفعاته | ما في عمود كمية بجدول الأصناف. بتنحسب                           |
| البيع من الأقرب انتهاء أول      | لما تبيعي، خدي من الدفعة اللي تاريخها أقرب (اسمها FEFO)         |
| الحالة بتنحسب بالسيرفر          | الفرونت ما بيحسب `status`، بياخده جاهز                          |
| الكاشير ما بيشوف التكلفة        | `cost` و`averageCost` بيرجعوا `null` إذا ما عنده صلاحية         |

> كمية بأول وحدة يعني كسور. خلي عمود الكمية `decimal(12, 4)`. لو حابة تخزني بأصغر وحدة كرقم صحيح، تمام، بس لازم تحولي لأول وحدة بالريسورس قبل ما ترجعي.

### حالة الصنف

نفس القاعدة بالسيرفر الوهمي وبلارافيل، بهالترتيب بالضبط:

| الترتيب | الحالة    | متى                                                        |
| ------- | --------- | ---------------------------------------------------------- |
| 1       | `out`     | الكمية صفر                                                 |
| 2       | `expired` | أقرب دفعة فيها كمية تاريخها فات                            |
| 3       | `soon`    | أقرب دفعة بتنتهي خلال `expiryAlertDays` يوم (من الإعدادات) |
| 4       | `low`     | الكمية أقل أو بتساوي `minStock`                            |
| 5       | `ok`      | غير هيك                                                    |

```php
// app/Models/Product.php
public function statusFor(int $expiryAlertDays): string
{
    $quantity = (float) $this->stock_quantity;            // من withSum
    $expiry = $this->nearest_expiry;                      // من withMin

    if ($quantity <= 0 || ! $expiry) return 'out';
    $days = today()->diffInDays(Carbon::parse($expiry), false);
    if ($days < 0) return 'expired';
    if ($days <= $expiryAlertDays) return 'soon';
    if ($quantity <= (float) $this->min_stock) return 'low';

    return 'ok';
}
```

وحساب الكمية وأقرب انتهاء بطلب واحد:

```php
// app/Models/Product.php
public function scopeWithStock(Builder $query): Builder
{
    return $query
        ->withSum(['batches as stock_quantity' => fn ($q) => $q->where('quantity', '>', 0)], 'quantity')
        ->withMin(['batches as nearest_expiry' => fn ($q) => $q->where('quantity', '>', 0)], 'expiry');
}

/** نفس الشي لصنف واحد محمل أصلاً */
public function loadStock(): static
{
    return $this->loadSum(['batches as stock_quantity' => fn ($q) => $q->where('quantity', '>', 0)], 'quantity')
        ->loadMin(['batches as nearest_expiry' => fn ($q) => $q->where('quantity', '>', 0)], 'expiry');
}
```

---

## قائمة الأصناف

### شو بيصير بالشاشة

- تبويبات فوق: الكل، ناقص، قرب ينتهي، خلص، منتهي، موقوف. كل تبويب عليه عدد.
- فلاتر: التصنيف، المادة الفعالة، المورد، والترتيب.
- بحث بالاسم أو الاسم العربي أو الباركود أو المادة الفعالة.
- جدول بصفحات. كل سطر فيه زر تحديد للتعديل الجماعي.
- أزرار: صنف جديد، استيراد، تصدير، والكتالوج.

### الملفات

| شو                | وين                                       |
| ----------------- | ----------------------------------------- |
| الأنواع           | `src/entities/product/model/types.ts`     |
| الطلبات           | `src/entities/product/api/product-api.ts` |
| مفاتيح الذاكرة    | `src/entities/product/api/queries.ts`     |
| رد السيرفر الوهمي | `src/app/mocks/handlers/catalog.ts`       |

### الطلب

```http
GET /api/products?tab=low&category=2&ingredient=5&supplier=1&sort=expiry&search=augmentin&page=1&perPage=25
```

| المعامل      | القيم                                                        | إذا ما انبعت |
| ------------ | ------------------------------------------------------------ | ------------ |
| `tab`        | `low` `soon` `out` `expired` `stopped`                       | الكل         |
| `category`   | رقم التصنيف                                                  | الكل         |
| `ingredient` | رقم المادة الفعالة                                           | الكل         |
| `supplier`   | رقم المورد                                                   | الكل         |
| `sort`       | `expiry` (الأقرب انتهاء أول)، `name`، `quantity` (الأقل أول) | `expiry`     |
| `search`     | نص                                                           | بدون         |
| `page`       | رقم                                                          | 1            |
| `perPage`    | 25 أو 50 أو 100                                              | 25           |

قواعد التبويبات:

| التبويب   | بيعرض                               |
| --------- | ----------------------------------- |
| الكل      | الأصناف الفعالة بس                  |
| `low` إلخ | الأصناف الفعالة اللي حالتها هيك     |
| `stopped` | الأصناف الموقوفة (`active = false`) |

### الرد

```json
{
  "data": [
    {
      "id": 12,
      "name": "Augmentin 625mg 14 Tablets",
      "nameAr": "أوجمنتين",
      "ingredient": { "id": 1, "name": "Amoxicillin + Clavulanic acid" },
      "category": { "id": 2, "nameAr": "مضادات حيوية", "nameEn": "Antibiotics" },
      "barcode": "6251079001234",
      "prescription": true,
      "active": true,
      "quantity": 3,
      "unit": "علبة",
      "nearestExpiry": "2026-12-20",
      "price": 45,
      "status": "soon"
    }
  ],
  "meta": { "total": 143, "page": 1, "perPage": 25 },
  "counts": { "all": 143, "low": 7, "soon": 4, "out": 2, "expired": 1, "stopped": 3 }
}
```

| الحقل           | من وين بيجي                                  |
| --------------- | -------------------------------------------- |
| `quantity`      | مجموع كميات الدفعات                          |
| `unit`          | اسم أول وحدة                                 |
| `price`         | سعر أول وحدة                                 |
| `nearestExpiry` | أقرب تاريخ لدفعة فيها كمية. `null` إذا ما في |
| `status`        | [القاعدة فوق](#حالة-الصنف)                   |

> `counts` بتنحسب **بعد** الفلاتر والبحث و**قبل** التبويب. يعني لو بحثتي "augmentin"، كل تبويب بيعرض كم صنف فيه من نتايج البحث.

### بلارافيل

الحالة بتعتمد على تاريخ اليوم والإعدادات، فأسهل طريقة: جيبي الأصناف المفلترة، احسبي الحالة بـ PHP، وبعدين قسمي الصفحة. لصيدلية فيها كم ألف صنف، هاد سريع كفاية.

```php
// app/Http/Controllers/ProductController.php
public function index(Request $request)
{
    $alertDays = $request->user()->pharmacy->settings->expiry_alert_days;

    $products = Product::query()
        ->withStock()
        ->with(['ingredient:id,name', 'category:id,name_ar,name_en', 'firstUnit'])
        ->when($request->query('category'), fn ($q, $id) => $q->where('category_id', $id))
        ->when($request->query('ingredient'), fn ($q, $id) => $q->where('ingredient_id', $id))
        ->when($request->query('supplier'), fn ($q, $id) => $q->where('supplier_id', $id))
        ->when($request->query('search'), fn ($q, $s) => $q->search($s))
        ->get()
        ->each(fn ($p) => $p->status = $p->statusFor($alertDays));

    $inTab = fn (Product $p, string $tab) => match ($tab) {
        'stopped' => ! $p->active,
        'all' => $p->active,
        default => $p->active && $p->status === $tab,
    };

    $counts = collect(['all', 'low', 'soon', 'out', 'expired', 'stopped'])
        ->mapWithKeys(fn ($tab) => [$tab => $products->filter(fn ($p) => $inTab($p, $tab))->count()]);

    $rows = $products->filter(fn ($p) => $inTab($p, $request->query('tab', 'all')));
    $rows = match ($request->query('sort', 'expiry')) {
        'name' => $rows->sortBy('name'),
        'quantity' => $rows->sortBy('stock_quantity'),
        default => $rows->sortBy(fn ($p) => $p->nearest_expiry ?? '9999-12-31'),
    };

    $page = $request->integer('page', 1);
    $perPage = min($request->integer('perPage', 25), 100);

    return response()->json([
        'data' => ProductSummaryResource::collection($rows->forPage($page, $perPage)->values()),
        'meta' => ['total' => $rows->count(), 'page' => $page, 'perPage' => $perPage],
        'counts' => $counts,
    ]);
}
```

البحث:

```php
// app/Models/Product.php
public function scopeSearch(Builder $query, string $term): Builder
{
    $term = trim($term);

    return $query->where(fn ($q) => $q
        ->where('barcode', $term)
        ->orWhere('name', 'like', "%{$term}%")
        ->orWhere('name_ar', 'like', "%{$term}%")
        ->orWhereHas('ingredient', fn ($i) => $i->where('name', 'like', "%{$term}%")));
}
```

> البحث بالعربي: الفرونت بيعتبر "اموكسيسيلين" و"أموكسيسيلين" نفس الشي. عشان السيرفر يعمل نفس الشي، خزني عمود `search_text` فيه الاسم منظف بدالة `arabic_key` (مشروحة تحت بقسم الكتالوج)، وابحثي فيه بعد ما تنظفي كلمة البحث بنفس الدالة. حدثيه بكل حفظ للصنف.

الريسورس:

```php
// app/Http/Resources/ProductSummaryResource.php
public function toArray(Request $request): array
{
    $first = $this->firstUnit;

    return [
        'id' => $this->id,
        'name' => $this->name,
        'nameAr' => $this->name_ar,
        'ingredient' => $this->ingredient ? ['id' => $this->ingredient->id, 'name' => $this->ingredient->name] : null,
        'category' => $this->category ? [
            'id' => $this->category->id,
            'nameAr' => $this->category->name_ar,
            'nameEn' => (string) $this->category->name_en,
        ] : null,
        'barcode' => $this->barcode,
        'prescription' => $this->prescription,
        'active' => $this->active,
        'quantity' => round((float) $this->stock_quantity, 4),
        'unit' => $first?->name ?? '',
        'nearestExpiry' => $this->nearest_expiry,
        'price' => (float) ($first?->price ?? 0),
        'status' => $this->status,
    ];
}
```

---

## تفاصيل صنف

### شو بيصير بالشاشة

- رأس الصفحة: الاسم، المادة الفعالة، الحالة، والسعر.
- بطاقات: الكمية، متوسط التكلفة، المبيع آخر 30 يوم، وأقرب انتهاء.
- رسم صغير للمبيع اليومي آخر 30 يوم.
- جدول الدفعات، مع علامة على اللي بتنباع أول.
- آخر 10 حركات.
- البدائل: أصناف تانية بنفس المادة الفعالة.

### الطلب

```http
GET /api/products/12
```

### الرد

كل حقول القائمة، وفوقهم:

```json
{
  "data": {
    "id": 12,
    "name": "Augmentin 625mg 14 Tablets",
    "...": "نفس حقول القائمة",

    "form": "tablet",
    "strength": "625mg",
    "manufacturer": "GSK",
    "units": [
      { "name": "علبة", "perParent": null, "price": 45, "enabled": true },
      { "name": "شريط", "perParent": 2, "price": 23, "enabled": true }
    ],
    "minStock": 5,
    "supplier": { "id": 1, "name": "شركة القدس للأدوية" },

    "averageCost": 31.2,
    "soldLast30": 22,
    "dailySales": [
      0, 1, 0, 2, 1, 0, 0, 3, 1, 0, 0, 1, 2, 0, 1, 0, 0, 1, 1, 0, 2, 0, 1, 0, 1, 2, 0, 0, 1, 1
    ],
    "batches": [
      {
        "code": "AUG-2611",
        "expiry": "2026-12-20",
        "quantity": 3,
        "cost": 32,
        "supplier": "شركة القدس للأدوية",
        "nextToSell": true
      }
    ],
    "movements": [
      {
        "id": 1201,
        "at": "2026-11-24T09:15:00+02:00",
        "delta": -1,
        "kind": "sale",
        "reference": "INV-01482",
        "actor": "محمد العطار",
        "batch": "AUG-2611",
        "balanceAfter": 3
      }
    ],
    "alternatives": [{ "id": 31, "name": "Amoclan 625mg", "...": "شكل القائمة" }]
  }
}
```

| الحقل          | القاعدة                                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| `form`         | `tablet` `capsule` `syrup` `injection` `cream` `drops` `inhaler` `sachet` `suppository` `other`، أو `null` |
| `averageCost`  | متوسط مرجح: مجموع (تكلفة × كمية) ÷ الكمية. `null` إذا الكمية صفر أو ما عنده صلاحية                         |
| `soldLast30`   | مجموع `dailySales`                                                                                         |
| `dailySales`   | 30 رقم بالضبط، الأقدم أول، آخر رقم هو اليوم. أيام بدون بيع = 0                                             |
| `batches`      | اللي فيها كمية بس، مرتبة بالانتهاء                                                                         |
| `nextToSell`   | `true` للدفعة الأقرب انتهاء                                                                                |
| `movements`    | آخر 10، الأحدث أول. `delta` موجب دخول، سالب خروج                                                           |
| `kind` بالحركة | `sale` `purchase` `return` `count` `damage` `opening` `import`                                             |
| `alternatives` | الأصناف الفعالة التانية بنفس المادة الفعالة                                                                |

### بلارافيل

```php
public function show(Request $request, Product $product)
{
    $product->loadStock()->load(['units', 'supplier:id,name', 'ingredient', 'category']);
    $product->status = $product->statusFor($request->user()->pharmacy->settings->expiry_alert_days);

    return new ProductDetailResource($product);
}
```

المبيع اليومي بطلب واحد:

```php
$sales = StockMovement::where('product_id', $product->id)
    ->where('kind', 'sale')
    ->where('created_at', '>=', today()->subDays(29))
    ->selectRaw('DATE(created_at) as day, SUM(-delta) as sold')
    ->groupBy('day')
    ->pluck('sold', 'day');

$dailySales = collect(range(29, 0))
    ->map(fn ($back) => (float) ($sales[today()->subDays($back)->toDateString()] ?? 0))
    ->values();
```

> المرتجع بيرجع للمخزون، بس ما بيتحسب من المبيع هون. لو حابة تخصميه، ضيفي `kind = return` وطرحيه.

إخفاء التكلفة:

```php
$seesCost = $request->user()->role === 'manager' || $request->user()->can_see_purchase_price;

'averageCost' => $seesCost ? $this->averageCost() : null,
'batches' => $this->batches->map(fn ($b) => [
    'code' => $b->code,
    'expiry' => $b->expiry->toDateString(),
    'quantity' => (float) $b->quantity,
    'cost' => $seesCost ? (float) $b->cost : null,
    'supplier' => $b->supplier?->name,
    'nextToSell' => $b->id === $nextBatchId,
]),
```

---

## إضافة وتعديل صنف

### شو بيصير بالشاشة

نموذج طويل بأقسام: الأساسيات، الوحدات والأسعار، المخزون، والرصيد الأول (بالإضافة بس). فيه بحث بالكتالوج يعبي الحقول تلقائياً.

| شو            | وين                                                 |
| ------------- | --------------------------------------------------- |
| قواعد النموذج | `src/features/product/edit-product/model/schema.ts` |
| التحويل للطلب | نفس الملف، دالة `formToInput`                       |

### الطلب

```http
POST /api/products
PUT  /api/products/12
```

```json
{
  "name": "Augmentin 625mg 14 Tablets",
  "nameAr": "أوجمنتين",
  "ingredientId": 1,
  "categoryId": 2,
  "form": "tablet",
  "strength": "625mg",
  "manufacturer": "GSK",
  "barcode": "6251079001234",
  "prescription": true,
  "units": [
    { "name": "علبة", "perParent": null, "price": 45, "enabled": true },
    { "name": "شريط", "perParent": 2, "price": 23, "enabled": true }
  ],
  "minStock": 5,
  "supplierId": 1,
  "active": true,
  "opening": { "quantity": 20, "expiry": "2027-06-30", "cost": 31 }
}
```

### القواعد

| الحقل               | القاعدة                                             | رمز الخطأ     |
| ------------------- | --------------------------------------------------- | ------------- |
| `name`              | مطلوب                                               | `required`    |
| `nameAr`            | نص أو `null`                                        |               |
| `ingredientId`      | رقم مادة من نفس الصيدلية، أو `null`                 |               |
| `categoryId`        | رقم تصنيف من نفس الصيدلية، أو `null`                |               |
| `form`              | من القائمة أو `null`                                |               |
| `barcode`           | نص أو `null`. فريد بالصيدلية                        | `taken`       |
| `units`             | وحدة وحدة على الأقل                                 |               |
| `units.*.name`      | مطلوب                                               | `required`    |
| `units.0.perParent` | `null` دايماً                                        |               |
| `units.0.enabled`   | لازم `true`: أول وحدة دايماً للبيع                   | `unitEnabled` |
| `units.N.perParent` | للوحدات بعد الأولى: رقم صحيح 2 أو أكتر              | `perParent`   |
| `units.*.price`     | أكبر من صفر                                         | `price`       |
| `minStock`          | صفر أو أكتر                                         | `number`      |
| `supplierId`        | رقم مورد أو `null`                                  |               |
| `opening`           | `null`، أو كائن. **بالإضافة بس**، بالتعديل بينتجاهل |               |
| `opening.quantity`  | أكبر من صفر                                         | `number`      |
| `opening.expiry`    | تاريخ بعد اليوم                                     | `expiryPast`  |
| `opening.cost`      | صفر أو أكتر                                         | `number`      |

> الباركود المستخدم هو الخطأ الوحيد اللي الفرونت بيستناه من السيرفر هون، ورمزه `taken` تحت `barcode`. باقي القواعد الفرونت بيفحصها قبل، بس افحصيها كمان بالسيرفر.

### الرد

201 بالإضافة، 200 بالتعديل. الصنف بشكل التفاصيل كامل.

### بلارافيل

```php
// app/Http/Requests/ProductRequest.php
public function rules(): array
{
    $pharmacy = $this->user()->pharmacy_id;
    $id = $this->route('product')?->id;
    $exists = fn (string $table) => Rule::exists($table, 'id')->where('pharmacy_id', $pharmacy);

    return [
        'name' => ['required', 'string', 'max:160'],
        'nameAr' => ['nullable', 'string', 'max:160'],
        'ingredientId' => ['nullable', $exists('ingredients')],
        'categoryId' => ['nullable', $exists('categories')],
        'form' => ['nullable', 'in:tablet,capsule,syrup,injection,cream,drops,inhaler,sachet,suppository,other'],
        'strength' => ['present', 'nullable', 'string', 'max:60'],
        'manufacturer' => ['present', 'nullable', 'string', 'max:120'],
        'barcode' => ['nullable', 'string', 'max:32',
            Rule::unique('products', 'barcode')->where('pharmacy_id', $pharmacy)->ignore($id)],
        'prescription' => ['required', 'boolean'],
        'units' => ['required', 'array', 'min:1', 'max:3'],
        'units.*.name' => ['required', 'string', 'max:20'],
        'units.*.price' => ['required', 'numeric', 'gt:0'],
        'units.*.enabled' => ['required', 'boolean'],
        'units.0.enabled' => ['accepted'],
        'units.*.perParent' => ['nullable', 'integer', 'min:2'],
        'minStock' => ['required', 'numeric', 'min:0'],
        'supplierId' => ['nullable', $exists('suppliers')],
        'active' => ['required', 'boolean'],
        'opening' => ['nullable', 'array'],
        'opening.quantity' => ['required_with:opening', 'numeric', 'gt:0'],
        'opening.expiry' => ['required_with:opening', 'date_format:Y-m-d', 'after:today'],
        'opening.cost' => ['required_with:opening', 'numeric', 'min:0'],
    ];
}

public function withValidator($validator): void
{
    $validator->after(function ($v) {
        foreach (array_slice($this->input('units', []), 1, null, true) as $i => $unit) {
            if (empty($unit['perParent'])) {
                $v->errors()->add("units.{$i}.perParent", 'perParent');
            }
        }
    });
}

public function messages(): array
{
    return [
        'barcode.unique' => 'taken',
        'units.0.enabled.accepted' => 'unitEnabled',
        'units.*.perParent.*' => 'perParent',
        'units.*.price.*' => 'price',
        'minStock.*' => 'number',
        'opening.expiry.after' => 'expiryPast',
        '*.required' => 'required',
    ];
}
```

الكونترولر:

```php
public function store(ProductRequest $request)
{
    $product = DB::transaction(function () use ($request) {
        $product = Product::create($request->toModel());
        $product->syncUnits($request->input('units'));

        if ($opening = $request->input('opening')) {
            $batch = $product->batches()->create([
                'code' => 'OPEN-'.$product->id,
                'expiry' => $opening['expiry'],
                'quantity' => $opening['quantity'],
                'cost' => $opening['cost'],
                'supplier_id' => $product->supplier_id,
            ]);
            StockMovement::record($batch, +$opening['quantity'], 'opening', adjust: false);   // الوحدة 5
        }

        return $product;
    });

    return (new ProductDetailResource($product->fresh()->loadStock()))->response()->setStatusCode(201);
}

public function update(ProductRequest $request, Product $product)
{
    DB::transaction(function () use ($request, $product) {
        $product->update($request->toModel());
        $product->syncUnits($request->input('units'));
    });

    return new ProductDetailResource($product->fresh()->loadStock());
}
```

```php
// app/Models/Product.php
public function syncUnits(array $units): void
{
    $this->units()->delete();
    foreach (array_values($units) as $position => $unit) {
        $this->units()->create([
            'position' => $position,
            'name' => $unit['name'],
            'per_parent' => $position === 0 ? null : $unit['perParent'],
            'price' => $unit['price'],
            'enabled' => $unit['enabled'],
        ]);
    }
}
```

> لاحظي: الدفعات مربوطة بالصنف، مش بالوحدات، فحذف الوحدات وإعادتها آمن. بس سطور الفواتير القديمة لازم تخزن اسم الوحدة وسعرها نص وقيمة (الوحدة 6)، مش رقم الوحدة، عشان تعديل الوحدات ما يغير الفواتير القديمة.

---

## التعديل الجماعي والتصدير

### التعديل الجماعي

المستخدم بيحدد كم صنف بالقائمة، وبيختار شو يغير. **بس الحقول اللي اختارها بتنبعت**:

```http
POST /api/products/bulk
```

```json
{
  "ids": [12, 15, 31],
  "changes": {
    "minStock": 10,
    "pricePercent": 5
  }
}
```

| التغيير        | معناه                                                                |
| -------------- | -------------------------------------------------------------------- |
| `minStock`     | الحد الأدنى الجديد                                                   |
| `supplierId`   | المورد الجديد                                                        |
| `categoryId`   | التصنيف الجديد                                                       |
| `prescription` | بوصفة أو لا                                                          |
| `active`       | تفعيل أو إيقاف                                                       |
| `pricePercent` | ارفعي **كل** أسعار الوحدات بهالنسبة. سالب يعني تخفيض. التقريب لقرشين |

الرد: 204. وبيكتب سطر `bulkEdit` بسجل النشاط، نوعه `sensitive`، مع `count`.

```php
public function bulk(Request $request)
{
    $data = $request->validate([
        'ids' => ['required', 'array', 'min:1'],
        'ids.*' => ['integer'],
        'changes' => ['required', 'array'],
        'changes.minStock' => ['sometimes', 'numeric', 'min:0'],
        'changes.supplierId' => ['sometimes', 'integer'],
        'changes.categoryId' => ['sometimes', 'integer'],
        'changes.prescription' => ['sometimes', 'boolean'],
        'changes.active' => ['sometimes', 'boolean'],
        'changes.pricePercent' => ['sometimes', 'numeric', 'between:-90,500'],
    ]);

    $c = $data['changes'];
    DB::transaction(function () use ($data, $c) {
        $products = Product::whereIn('id', $data['ids']);
        $products->update(array_filter([
            'min_stock' => $c['minStock'] ?? null,
            'supplier_id' => $c['supplierId'] ?? null,
            'category_id' => $c['categoryId'] ?? null,
            'prescription' => $c['prescription'] ?? null,
            'active' => $c['active'] ?? null,
        ], fn ($v) => $v !== null));

        if (isset($c['pricePercent'])) {
            ProductUnit::whereIn('product_id', $products->pluck('id'))
                ->update(['price' => DB::raw('ROUND(price * '.(1 + $c['pricePercent'] / 100).', 2)')]);
        }
    });

    activity_log('bulkEdit', 'sensitive', ['count' => count($data['ids'])]);

    return response()->noContent();
}
```

> `array_filter` بيشيل `false` كمان! يعني `prescription: false` بينتسى. استخدمي `fn ($v) => $v !== null` زي فوق، مش `array_filter` لحاله.

### التصدير

زر "تصدير" هو رابط عادي:

```http
GET /api/products/export
GET /api/products/export?ids=12,15,31
```

بدون `ids`: كل الأصناف. مع `ids`: المحددة بس. الرد ملف إكسل للتنزيل، بنفس أعمدة الاستيراد (عشان يقدروا يعدلوه ويرجعوه):

```
name, nameAr, ingredient, category, barcode, price, quantity, expiry, cost, manufacturer, minStock, prescription
```

```bash
composer require maatwebsite/excel
```

```php
public function export(Request $request)
{
    $ids = array_filter(explode(',', (string) $request->query('ids')));

    return Excel::download(new ProductsExport($ids), 'products-'.today()->toDateString().'.xlsx');
}
```

---

## الباركود والملصقات

### صفحة الملصقات

المستخدم بيختار أصناف، وعدد النسخ لكل واحد، وبتنطبع ملصقات فيها الاسم والسعر والباركود. الطباعة كلها بالفرونت.

اللي بيحتاجه من السيرفر:

1. تفاصيل كل صنف: `GET /api/products/{id}`
2. بحث لإضافة أصناف: `GET /api/products?search=...&perPage=6`
3. لو الصنف ما إله باركود، بيطلب واحد داخلي:

```http
POST /api/products/12/barcode
```

```json
{ "data": { "barcode": "2000000000121" } }
```

### الباركود الداخلي

باركود EAN-13 بيبدأ بـ 2 (هاد المدى مخصص للمحلات)، بعده رقم الصنف بـ 11 خانة، وآخر رقم للتحقق. ولو الصنف إله باركود أصلاً، رجعيه زي ما هو.

```php
function internal_ean13(int $productId): string
{
    $first12 = '2'.str_pad((string) $productId, 11, '0', STR_PAD_LEFT);
    $sum = 0;
    foreach (str_split($first12) as $i => $digit) {
        $sum += (int) $digit * ($i % 2 === 0 ? 1 : 3);
    }

    return $first12.((10 - $sum % 10) % 10);
}

public function barcode(Product $product)
{
    $product->barcode ??= internal_ean13($product->id);
    $product->save();

    return response()->json(['data' => ['barcode' => $product->barcode]]);
}
```

> بما إنه فيه رقم الصنف، مش ممكن يتكرر بنفس الصيدلية. بس ممكن يتكرر بين صيدليتين، وهاد عادي لأنه الفحص الفريد بالصيدلية.

---

## الكتالوج المشترك

قائمة أدوية جاهزة، **وحدة لكل المنصة**، مش لكل صيدلية. لما الصيدلية تضيف صنف، بتقدر تبحث فيها وتعبي الحقول بضغطة.

```http
GET /api/catalog?search=augmentin
```

```json
{
  "data": [
    {
      "id": 4,
      "name": "Augmentin 1g 14 Tablets",
      "nameAr": "أوجمنتين 1 غرام",
      "ingredient": { "id": 1, "name": "Amoxicillin + Clavulanic acid" },
      "ingredientName": "Amoxicillin + Clavulanic acid",
      "form": "tablet",
      "strength": "1g",
      "manufacturer": "GSK",
      "barcode": "6251079001241",
      "prescription": true,
      "units": [
        { "name": "علبة", "perParent": null, "price": 65, "enabled": true },
        { "name": "شريط", "perParent": 2, "price": 33, "enabled": true }
      ]
    }
  ]
}
```

| الحقل            | معناه                                                                   |
| ---------------- | ----------------------------------------------------------------------- |
| `ingredientName` | اسم المادة الفعالة بالكتالوج                                            |
| `ingredient`     | المادة **من صيدلية المستخدم** اللي اسمها نفس الاسم. `null` إذا ما عندها |

الفرونت بيستخدم `ingredient` لو موجود. لو `null`، بيعرض "مادة جديدة" وبيعملها لما يحفظ.

```php
public function catalog(Request $request)
{
    $term = trim((string) $request->query('search'));
    $mine = Ingredient::get(['id', 'name']);   // من صيدلية المستخدم بس، بسبب الفلتر العام

    $entries = CatalogEntry::query()
        ->where(fn ($q) => $q->where('name', 'like', "%{$term}%")
            ->orWhere('name_ar', 'like', "%{$term}%")
            ->orWhere('barcode', $term))
        ->limit(20)
        ->get();

    return response()->json(['data' => $entries->map(function (CatalogEntry $entry) use ($mine) {
        $match = $mine->first(fn ($i) => arabic_key($i->name) === arabic_key($entry->ingredient_name));

        return [
            'id' => $entry->id,
            'name' => $entry->name,
            'nameAr' => $entry->name_ar,
            'ingredient' => $match ? ['id' => $match->id, 'name' => $match->name] : null,
            'ingredientName' => $entry->ingredient_name,
            'form' => $entry->form,
            'strength' => $entry->strength,
            'manufacturer' => $entry->manufacturer,
            'barcode' => $entry->barcode,
            'prescription' => $entry->prescription,
            'units' => $entry->units,
        ];
    })]);
}
```

`arabic_key` دالة صغيرة بتوحد النص قبل المقارنة، نفس اللي بيعمله الفرونت:

```php
function arabic_key(string $text): string
{
    $text = mb_strtolower(trim($text));
    $text = preg_replace('/[\x{064B}-\x{0652}\x{0640}]/u', '', $text);   // التشكيل والتطويل
    $text = strtr($text, ['أ' => 'ا', 'إ' => 'ا', 'آ' => 'ا', 'ة' => 'ه', 'ى' => 'ي']);

    return preg_replace('/\s+/u', ' ', $text);
}
```

> `catalog_entries` **بدون** الفلتر العام تبع الصيدلية، لأنها مشتركة. صاحبة المنصة هي اللي بتعبيها.

---

## الاستيراد من إكسل

### شو بيصير بالشاشة

أربع خطوات:

1. **رفع الملف.** الفرونت بيقرا الإكسل **بالمتصفح**. السيرفر ما بيستلم ملف أبداً.
2. **مطابقة الأعمدة.** المستخدم بيقول أي عمود هو الاسم، وأي عمود السعر، إلخ.
3. **المراجعة.** الفرونت بيبعت السطور للسيرفر يفحصها بدون ما يحفظ. بتطلع المشاكل، وبيقدر يصلحها بنفس الشاشة.
4. **الحفظ.** بيبعت السطور مرة تانية للحفظ، ومعها قرار كل باركود مكرر.

بعد الحفظ في زر "تراجع" بيمسح كل اللي انضاف.

| شو                | وين                                                   |
| ----------------- | ----------------------------------------------------- |
| الأنواع           | `src/entities/product/model/import.ts`                |
| الطلبات           | `src/entities/product/api/import-api.ts`              |
| قراءة الملف       | `src/features/product/import-products/model/table.ts` |
| رد السيرفر الوهمي | `src/app/mocks/handlers/imports.ts`                   |

### شكل السطر

كل القيم **نصوص**، لأنها جاية من ملف. السيرفر هو اللي بيفحصها ويحولها:

```json
{
  "line": 7,
  "name": "Panadol Extra",
  "nameAr": "بنادول إكسترا",
  "ingredient": "Paracetamol + Caffeine",
  "category": "مسكنات",
  "barcode": "6291100080014",
  "price": "18",
  "quantity": "24",
  "expiry": "2027-08-31",
  "cost": "12.5",
  "manufacturer": "GSK",
  "minStock": "6",
  "prescription": "لا"
}
```

`line` هو رقم السطر بالملف (العنوان هو السطر 1)، عشان المستخدم يلاقيه. أي حقل غير `line` ممكن ما يكون موجود.

### الخطوة 3: الفحص بدون حفظ

```http
POST /api/imports/products/preview
```

```json
{
  "rows": [{ "line": 2, "name": "Panadol", "price": "12" }],
  "duplicates": {}
}
```

```json
{
  "data": {
    "ready": 118,
    "issues": [
      { "line": 7, "name": "Panadol Extra", "problem": "expiryPast", "field": "expiry" },
      { "line": 12, "name": "Brufen 400", "problem": "duplicate", "field": "barcode" }
    ],
    "newCategories": ["مكملات غذائية"],
    "newIngredients": ["Ibuprofen"]
  }
}
```

الفحص لكل سطر، **بهالترتيب**، وأول مشكلة بس بتنحسب:

| الترتيب | المشكلة           | متى                                             | الحقل      |
| ------- | ----------------- | ----------------------------------------------- | ---------- |
| 1       | `nameMissing`     | الاسم فاضي                                      | `name`     |
| 2       | `priceMissing`    | السعر فاضي                                      | `price`    |
| 3       | `priceInvalid`    | السعر مش رقم أو صفر أو سالب                     | `price`    |
| 4       | `quantityInvalid` | الكمية مش رقم أو سالبة                          | `quantity` |
| 5       | `expiryMissing`   | في كمية بس ما في تاريخ                          | `expiry`   |
| 6       | `expiryInvalid`   | التاريخ مش بشكل `YYYY-MM-DD`                    | `expiry`   |
| 7       | `expiryPast`      | التاريخ اليوم أو قبل                            | `expiry`   |
| 8       | `duplicate`       | السطر سليم، بس الباركود موجود عند صنف بالصيدلية | `barcode`  |

| حقل الرد         | معناه                                                 |
| ---------------- | ----------------------------------------------------- |
| `ready`          | عدد السطور السليمة (المكرر بينحسب جاهز، لأنه بينحدث)  |
| `issues`         | المشاكل. المكرر مش مشكلة بتمنع، بس المستخدم لازم يقرر |
| `newCategories`  | تصنيفات بالسطور السليمة مش موجودة، رح تنعمل           |
| `newIngredients` | مواد فعالة مش موجودة، رح تنعمل                        |

> المطابقة بالأسماء: "مسكنات" و"المسكنات"؟ لا، هدول مختلفين. بس "أدوية الضغط" و"ادويه الضغط" نفس الشي بعد التوحيد العربي. والتصنيف بيتطابق مع الاسم العربي أو الإنجليزي.

### الخطوة 4: الحفظ

```http
POST /api/imports/products
```

```json
{
  "rows": [{ "line": 2, "name": "Panadol", "price": "12" }],
  "duplicates": { "12": "skip", "15": "update" }
}
```

`duplicates` قرار كل سطر مكرر حسب رقمه: `update` (حدث سعر الصنف الموجود) أو `skip` (اتركه). السطر المكرر بدون قرار بيتحدث.

```json
{
  "data": {
    "id": 9,
    "added": 112,
    "updated": 4,
    "skipped": 6,
    "newCategories": 1,
    "newIngredients": 3
  }
}
```

شو بيصير لكل سطر:

| السطر                  | النتيجة                                                                       |
| ---------------------- | ----------------------------------------------------------------------------- |
| فيه مشكلة              | بيتخطى (`skipped`)                                                            |
| مكرر و`skip`           | بيتخطى                                                                        |
| مكرر و`update` أو بدون | بيتحدث **سعر أول وحدة بس** (`updated`)                                        |
| جديد                   | صنف جديد بوحدة وحدة "علبة". ولو فيه كمية، دفعة ورصيد أول بحركة نوعها `import` |

قيم خاصة:

| الحقل          | التحويل                                                     |
| -------------- | ----------------------------------------------------------- |
| `prescription` | `1` أو `نعم` أو `yes` أو `true` ← `true`. غير هيك ← `false` |
| `minStock`     | فاضي ← `defaultMinStock` من الإعدادات                       |
| `cost`         | فاضي ← 0                                                    |

### التراجع

```http
POST /api/imports/9/undo
```

- 204: انمسح كل اللي انضاف بهالاستيراد (الأصناف والتصنيفات والمواد الجديدة).
- 409: صنف من هالاستيراد انباع أو انشرى، فما بنقدر نمسح. الفرونت بيعرض رسالة.

### بلارافيل

اعملي خدمة وحدة فيها الفحص، وناديها من الرابطين، عشان القاعدة تكون وحدة:

```php
// app/Services/ProductImport.php
class ProductImport
{
    public function check(array $row): ?array
    {
        $issue = fn (string $problem, string $field) => [
            'line' => $row['line'], 'name' => trim($row['name'] ?? '') ?: '—', 'problem' => $problem, 'field' => $field,
        ];

        if (blank($row['name'] ?? null)) return $issue('nameMissing', 'name');
        if (blank($row['price'] ?? null)) return $issue('priceMissing', 'price');
        if (! is_numeric($row['price']) || $row['price'] <= 0) return $issue('priceInvalid', 'price');

        $quantity = $row['quantity'] ?? '0';
        if (! is_numeric($quantity ?: '0') || $quantity < 0) return $issue('quantityInvalid', 'quantity');

        if ($quantity > 0) {
            $expiry = $row['expiry'] ?? '';
            if ($expiry === '') return $issue('expiryMissing', 'expiry');
            if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $expiry) || ! strtotime($expiry)) return $issue('expiryInvalid', 'expiry');
            if ($expiry <= today()->toDateString()) return $issue('expiryPast', 'expiry');
        }

        return null;
    }

    public function preview(array $rows): array { /* زي السيرفر الوهمي */ }

    public function run(array $rows, array $duplicates): ImportRecord { /* بعملية وحدة DB::transaction */ }
}
```

عشان التراجع، كل شي بينعمل بالاستيراد لازم يتعلم برقمه:

```php
Schema::create('imports', function (Blueprint $table) {
    $table->id();
    $table->foreignId('pharmacy_id')->constrained()->cascadeOnDelete();
    $table->foreignId('user_id')->constrained();
    $table->unsignedInteger('added')->default(0);
    $table->unsignedInteger('updated')->default(0);
    $table->unsignedInteger('skipped')->default(0);
    $table->timestamps();
});

// وبجداول products و categories و ingredients:
$table->foreignId('import_id')->nullable()->constrained()->nullOnDelete();
```

والتراجع:

```php
public function undo(ImportRecord $import)
{
    $used = StockMovement::whereIn('product_id', Product::where('import_id', $import->id)->select('id'))
        ->whereIn('kind', ['sale', 'purchase'])
        ->exists();
    abort_if($used, 409, 'Already used.');

    DB::transaction(function () use ($import) {
        Product::where('import_id', $import->id)->each->delete();   // الدفعات والحركات بتنمسح معها
        Category::where('import_id', $import->id)->delete();
        Ingredient::where('import_id', $import->id)->delete();
        $import->delete();
    });

    return response()->noContent();
}
```

> حجم الطلب: ملف فيه 5000 سطر ممكن يكون كبير. تأكدي إنه `post_max_size` بإعدادات PHP كفاية (8 ميغا مثلاً).

---

## التصنيفات

### شو بيصير بالشاشة

جدول التصنيفات: الاسم العربي والإنجليزي، كم صنف فيه، وكم منها ناقص. إضافة، تعديل، دمج تصنيف بتصنيف، وحذف.

| الطريقة | الرابط                       | الطلب              | الرد                      |
| ------- | ---------------------------- | ------------------ | ------------------------- |
| GET     | `/api/categories`            |                    | القائمة                   |
| POST    | `/api/categories`            | `nameAr`، `nameEn` | 201، التصنيف              |
| PUT     | `/api/categories/{id}`       | `nameAr`، `nameEn` | التصنيف                   |
| POST    | `/api/categories/{id}/merge` | `targetId`         | 204                       |
| DELETE  | `/api/categories/{id}`       |                    | 204، أو 409 إذا فيه أصناف |

```json
{ "id": 2, "nameAr": "مضادات حيوية", "nameEn": "Antibiotics", "productCount": 18, "lowCount": 2 }
```

| القاعدة                                             | الخطأ                                       |
| --------------------------------------------------- | ------------------------------------------- |
| `nameAr` مطلوب وفريد بالصيدلية (بعد التوحيد العربي) | `{ "errors": { "nameAr": ["taken"] } }`     |
| `nameEn` اختياري، ممكن يكون نص فاضي                 |                                             |
| الدمج: `targetId` غير نفسه وموجود                   | `{ "errors": { "targetId": ["invalid"] } }` |
| الحذف: التصنيف فاضي                                 | 409                                         |

الدمج يعني: انقلي كل أصناف هالتصنيف للتصنيف الهدف، وامسحي هالتصنيف.

`productCount` بيعد كل الأصناف (حتى الموقوفة). `lowCount` بيعد الأصناف الفعالة اللي حالتها `low`.

```php
public function merge(Request $request, Category $category)
{
    $target = $request->validate([
        'targetId' => ['required', 'integer', 'not_in:'.$category->id,
            Rule::exists('categories', 'id')->where('pharmacy_id', $request->user()->pharmacy_id)],
    ], ['targetId.*' => 'invalid'])['targetId'];

    DB::transaction(function () use ($category, $target) {
        Product::where('category_id', $category->id)->update(['category_id' => $target]);
        $category->delete();
    });

    return response()->noContent();
}

public function destroy(Category $category)
{
    abort_if($category->products()->exists(), 409, 'The category has products.');
    $category->delete();

    return response()->noContent();
}
```

---

## المواد الفعالة

### شو بيصير بالشاشة

قائمة المواد: الاسم العلمي، الاسم العربي، كم صنف، وكم منها فيه مخزون. فوقها تنبيه بالمواد اللي شكلها مكررة ("Amoxicillin" و"Amoxicilin") مع زر دمج.

| الطريقة | الرابط                        | الطلب            | الرد                  |
| ------- | ----------------------------- | ---------------- | --------------------- |
| GET     | `/api/ingredients`            |                  | القائمة، مرتبة بالاسم |
| GET     | `/api/ingredients/duplicates` |                  | أزواج مكررة           |
| POST    | `/api/ingredients`            | `name`، `nameAr` | 201                   |
| PUT     | `/api/ingredients/{id}`       | `name`، `nameAr` | المادة                |
| POST    | `/api/ingredients/{id}/merge` | `targetId`       | 204                   |

```json
{
  "id": 1,
  "name": "Amoxicillin + Clavulanic acid",
  "nameAr": "أموكسيسيلين مع حمض الكلافولانيك",
  "fromCatalog": true,
  "productCount": 4,
  "inStockCount": 3
}
```

| الحقل          | معناه                                       |
| -------------- | ------------------------------------------- |
| `fromCatalog`  | انعملت من الكتالوج، مش مكتوبة بإيد الصيدلية |
| `productCount` | الأصناف **الفعالة** بس (الموقوف مش بديل)    |
| `inStockCount` | منها كم فيه كمية                            |

المكرر:

```json
{
  "data": [
    { "keep": { "id": 1, "name": "Amoxicillin" }, "merge": { "id": 3, "name": "Amoxicilin" } }
  ]
}
```

السيرفر الوهمي بيرجع زوج ثابت. بلارافيل، اقتراح بسيط: قارني كل اسمين بعد التنظيف (أحرف صغيرة، بدون مسافات ورموز)، واعتبريهم مكررين إذا الفرق بينهم حرف أو حرفين:

```php
$names = Ingredient::get(['id', 'name']);
$clean = fn ($s) => preg_replace('/[^a-z]/', '', strtolower($s));
$pairs = [];

foreach ($names as $i => $a) {
    foreach ($names->slice($i + 1) as $b) {
        if (levenshtein($clean($a->name), $clean($b->name)) <= 2) {
            [$keep, $merge] = $a->products()->count() >= $b->products()->count() ? [$a, $b] : [$b, $a];
            $pairs[] = ['keep' => $keep->only('id', 'name'), 'merge' => $merge->only('id', 'name')];
        }
    }
}
```

الاسم العلمي مطلوب وفريد (`{ "errors": { "name": ["taken"] } }`)، والدمج زي التصنيفات.

---

## الجداول

```php
Schema::create('categories', function (Blueprint $table) {
    $table->id();
    $table->foreignId('pharmacy_id')->constrained()->cascadeOnDelete();
    $table->string('name_ar');
    $table->string('name_en')->default('');
    $table->foreignId('import_id')->nullable();
    $table->timestamps();
});

Schema::create('ingredients', function (Blueprint $table) {
    $table->id();
    $table->foreignId('pharmacy_id')->constrained()->cascadeOnDelete();
    $table->string('name');
    $table->string('name_ar')->nullable();
    $table->boolean('from_catalog')->default(false);
    $table->foreignId('import_id')->nullable();
    $table->timestamps();

    $table->unique(['pharmacy_id', 'name']);
});

Schema::create('products', function (Blueprint $table) {
    $table->id();
    $table->foreignId('pharmacy_id')->constrained()->cascadeOnDelete();
    $table->string('name');
    $table->string('name_ar')->nullable();
    $table->string('search_text')->default('');
    $table->foreignId('ingredient_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
    $table->string('form', 20)->nullable();
    $table->string('strength', 60)->default('');
    $table->string('manufacturer', 120)->default('');
    $table->string('barcode', 32)->nullable();
    $table->boolean('prescription')->default(false);
    $table->boolean('active')->default(true);
    $table->decimal('min_stock', 12, 4)->default(0);
    $table->foreignId('supplier_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignId('import_id')->nullable();
    $table->timestamps();

    $table->unique(['pharmacy_id', 'barcode']);
    $table->index(['pharmacy_id', 'active']);
});

Schema::create('product_units', function (Blueprint $table) {
    $table->id();
    $table->foreignId('product_id')->constrained()->cascadeOnDelete();
    $table->unsignedTinyInteger('position');          // 0 = أول وحدة (الأكبر)
    $table->string('name', 20);
    $table->unsignedInteger('per_parent')->nullable(); // null لأول وحدة
    $table->decimal('price', 10, 2);
    $table->boolean('enabled')->default(true);
});

Schema::create('batches', function (Blueprint $table) {
    $table->id();
    $table->foreignId('pharmacy_id')->constrained()->cascadeOnDelete();
    $table->foreignId('product_id')->constrained()->cascadeOnDelete();
    $table->string('code', 40);
    $table->date('expiry');
    $table->decimal('quantity', 12, 4);                // بأول وحدة
    $table->decimal('cost', 10, 2);                    // تكلفة أول وحدة
    $table->foreignId('supplier_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignId('purchase_order_id')->nullable();
    $table->timestamps();

    $table->index(['product_id', 'expiry']);
});

Schema::create('catalog_entries', function (Blueprint $table) {
    $table->id();                                      // بدون pharmacy_id: مشترك
    $table->string('name');
    $table->string('name_ar')->nullable();
    $table->string('ingredient_name');
    $table->string('form', 20)->nullable();
    $table->string('strength', 60)->default('');
    $table->string('manufacturer', 120)->default('');
    $table->string('barcode', 32)->nullable()->index();
    $table->boolean('prescription')->default(false);
    $table->json('units');
    $table->timestamps();
});
```

> `unique(['pharmacy_id', 'barcode'])` مع باركود `null`: بقاعدة MySQL، أكتر من `null` مسموح. فأصناف بدون باركود ما بتتعارض.

الموديل:

```php
// app/Models/Product.php
class Product extends Model
{
    use BelongsToPharmacy;

    protected $guarded = [];
    protected $casts = ['prescription' => 'boolean', 'active' => 'boolean'];

    public function units(): HasMany { return $this->hasMany(ProductUnit::class)->orderBy('position'); }
    public function firstUnit(): HasOne { return $this->hasOne(ProductUnit::class)->where('position', 0); }
    public function batches(): HasMany { return $this->hasMany(Batch::class)->orderBy('expiry'); }
    public function ingredient(): BelongsTo { return $this->belongsTo(Ingredient::class); }
    public function category(): BelongsTo { return $this->belongsTo(Category::class); }
    public function supplier(): BelongsTo { return $this->belongsTo(Supplier::class); }
    public function movements(): HasMany { return $this->hasMany(StockMovement::class); }

    /** الدفعة اللي بتنباع أول: الأقرب انتهاء وفيها كمية */
    public function nextBatch(): ?Batch
    {
        return $this->batches()->where('quantity', '>', 0)->orderBy('expiry')->first();
    }
}
```

---

## الروابط بملف لارافيل

```php
Route::middleware('auth:sanctum')->group(function () {
    // قراءة: الكل
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/export', [ProductController::class, 'export']);   // قبل {product}
    Route::get('/products/{product}', [ProductController::class, 'show']);
    Route::get('/categories', [CategoryController::class, 'index']);      // فلتر الأصناف للكل
    Route::get('/ingredients', [IngredientController::class, 'index']);   // فلتر الأصناف للكل

    Route::middleware('role:manager,pharmacist')->group(function () {
        Route::post('/products', [ProductController::class, 'store']);
        Route::post('/products/bulk', [ProductController::class, 'bulk']);   // قبل {product}
        Route::put('/products/{product}', [ProductController::class, 'update']);
        Route::post('/products/{product}/barcode', [ProductController::class, 'barcode']);

        Route::get('/catalog', [CatalogController::class, 'index']);

        Route::post('/imports/products/preview', [ImportController::class, 'preview']);
        Route::post('/imports/products', [ImportController::class, 'store']);
        Route::post('/imports/{import}/undo', [ImportController::class, 'undo']);

        Route::apiResource('categories', CategoryController::class)->except(['index', 'show']);
        Route::post('/categories/{category}/merge', [CategoryController::class, 'merge']);

        Route::get('/ingredients/duplicates', [IngredientController::class, 'duplicates']);
        Route::apiResource('ingredients', IngredientController::class)->only(['store', 'update']);
        Route::post('/ingredients/{ingredient}/merge', [IngredientController::class, 'merge']);
    });
});
```

> ترتيب الروابط مهم: `/products/export` و`/products/bulk` لازم ييجوا **قبل** `/products/{product}`، وإلا لارافيل بيفكر إنه `export` رقم صنف.

---

## اختبري حالك

- [ ] قائمة الأصناف بتعرض نفس الأعداد على التبويبات زي السيرفر الوهمي
- [ ] تغيير مدة تنبيه الصلاحية بالإعدادات بيغير مين بيطلع بـ "قرب ينتهي"
- [ ] البحث بالباركود الكامل بيلاقي الصنف
- [ ] صنف جديد برصيد أول بيطلع بكميته ودفعته
- [ ] باركود مكرر بيطلع خطأ تحت الحقل
- [ ] الكاشير بيشوف `cost: null` بالدفعات، وما بيقدر يضيف صنف (403)
- [ ] رفع سعر 5% جماعي بيغير كل الوحدات، والتقريب لقرشين
- [ ] الاستيراد بيعرض نفس المشاكل اللي بالسيرفر الوهمي لنفس الملف
- [ ] التراجع عن استيراد بعد بيع منه بيرجع 409
- [ ] حذف تصنيف فيه أصناف بيرجع 409، والدمج بينقلهم
