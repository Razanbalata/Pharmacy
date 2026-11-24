import type { Category } from '@/entities/category'
import type { Ingredient } from '@/entities/ingredient'
import type { Batch, CatalogEntry, DosageForm, Movement, SaleUnit } from '@/entities/product'
import type { SupplierOption } from '@/entities/supplier'

/** A product as the fake server keeps it. Quantity, status and names are worked out on read. */
export interface StoredProduct {
  id: number
  name: string
  nameAr: string | null
  ingredientId: number | null
  categoryId: number | null
  form: DosageForm | null
  strength: string
  manufacturer: string
  barcode: string | null
  prescription: boolean
  active: boolean
  units: SaleUnit[]
  minStock: number
  supplierId: number | null
  /** Batch quantities are in the first unit, like everything the client sees. */
  batches: (Omit<Batch, 'supplier' | 'nextToSell' | 'cost'> & {
    cost: number
    supplierId: number | null
  })[]
  movements: Movement[]
  dailySales: number[]
  /** Set by an import, so the import can be undone. */
  importId?: number
}

export type StoredCategory = Omit<Category, 'productCount' | 'lowCount'>
export type StoredIngredient = Omit<Ingredient, 'productCount' | 'inStockCount'>

const box = (price: number, extra: SaleUnit[] = []): SaleUnit[] => [
  { name: 'علبة', perParent: null, price, enabled: true },
  ...extra,
]
const bottle = (price: number): SaleUnit[] => [
  { name: 'عبوة', perParent: null, price, enabled: true },
]

/** Same numbers every run, so the sales chart and the tests do not change. */
function sales(seed: number): number[] {
  return Array.from({ length: 30 }, (_, day) =>
    (seed * 7 + day * 3) % 5 === 0 ? 0 : (seed + day) % 4,
  )
}

let batchNumber = 2200
function batch(expiry: string, quantity: number, cost: number, supplierId: number | null) {
  batchNumber += 37
  return { code: `A-${batchNumber}`, expiry, quantity, cost, supplierId }
}

function product(
  id: number,
  name: string,
  fields: Partial<StoredProduct> & Pick<StoredProduct, 'units'>,
): StoredProduct {
  return {
    id,
    name,
    nameAr: null,
    ingredientId: null,
    categoryId: null,
    form: 'tablet',
    strength: '',
    manufacturer: '',
    barcode: null,
    prescription: false,
    active: true,
    minStock: 5,
    supplierId: 1,
    batches: [],
    movements: [
      {
        id: id * 100,
        at: '2026-09-01T09:00:00Z',
        delta: fields.batches?.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
        kind: 'opening',
        reference: null,
        actor: 'رزان',
      },
    ],
    dailySales: sales(id),
    ...fields,
  }
}

export function initialCatalog() {
  const categories: StoredCategory[] = [
    { id: 1, nameAr: 'مضادات حيوية', nameEn: 'Antibiotics' },
    { id: 2, nameAr: 'أمراض مزمنة', nameEn: 'Chronic diseases' },
    { id: 3, nameAr: 'مسكنات', nameEn: 'Painkillers' },
    { id: 4, nameAr: 'جهاز تنفسي', nameEn: 'Respiratory' },
    { id: 5, nameAr: 'حساسية وتنفس', nameEn: 'Allergy & breathing' },
    { id: 6, nameAr: 'جهاز هضمي', nameEn: 'Digestive' },
    { id: 7, nameAr: 'فيتامينات ومكملات', nameEn: 'Vitamins & supplements' },
    { id: 8, nameAr: 'عناية بالبشرة', nameEn: 'Skin care' },
    { id: 9, nameAr: 'أطفال', nameEn: 'Kids' },
  ]

  const ingredients: StoredIngredient[] = [
    {
      id: 1,
      name: 'Amoxicillin + Clavulanic acid',
      nameAr: 'أموكسيسيلين مع حمض الكلافولانيك',
      fromCatalog: true,
    },
    { id: 2, name: 'Amoxicillin', nameAr: 'أموكسيسيلين', fromCatalog: true },
    { id: 3, name: 'Amoxicillin/Clavulanate', nameAr: null, fromCatalog: false },
    { id: 4, name: 'Azithromycin', nameAr: 'أزيثروميسين', fromCatalog: true },
    { id: 5, name: 'Dexpanthenol', nameAr: 'ديكسبانثينول', fromCatalog: true },
    { id: 6, name: 'Insulin aspart', nameAr: 'إنسولين أسبارت', fromCatalog: true },
    { id: 7, name: 'Metformin', nameAr: 'ميتفورمين', fromCatalog: true },
    { id: 8, name: 'Paracetamol', nameAr: 'باراسيتامول', fromCatalog: true },
    { id: 9, name: 'Paracetamol + Caffeine', nameAr: 'باراسيتامول مع كافيين', fromCatalog: true },
    { id: 10, name: 'Salbutamol', nameAr: 'سالبوتامول', fromCatalog: true },
    { id: 11, name: 'Dextromethorphan', nameAr: 'ديكستروميثورفان', fromCatalog: true },
    { id: 12, name: 'Omeprazole', nameAr: 'أوميبرازول', fromCatalog: true },
    { id: 13, name: 'Cetirizine', nameAr: 'سيتريزين', fromCatalog: true },
    { id: 14, name: 'Cholecalciferol', nameAr: 'فيتامين د3', fromCatalog: true },
    { id: 15, name: 'Ibuprofen', nameAr: 'إيبوبروفين', fromCatalog: true },
  ]

  const suppliers: SupplierOption[] = [
    { id: 1, name: 'المستودع الطبي الحديث' },
    { id: 2, name: 'شركة الشفاء للأدوية' },
    { id: 3, name: 'مستودع القدس' },
    { id: 4, name: 'شركة دار الدواء' },
  ]

  const augmentin = product(1, 'Augmentin 625mg 14 Tablets', {
    ingredientId: 1,
    categoryId: 1,
    strength: '625 ملغ',
    manufacturer: 'GSK',
    barcode: '6281100012345',
    prescription: true,
    minStock: 10,
    units: box(39, [
      { name: 'شريط', perParent: 2, price: 20, enabled: true },
      { name: 'حبة', perParent: 7, price: 3, enabled: false },
    ]),
    batches: [
      { code: 'A-2291', expiry: '2027-09-30', quantity: 30, cost: 27, supplierId: 1 },
      { code: 'A-2410', expiry: '2028-01-31', quantity: 8, cost: 28, supplierId: 2 },
    ],
    movements: [
      {
        id: 104,
        at: '2026-11-24T13:42:00Z',
        delta: -3,
        kind: 'sale',
        reference: 'INV-000245',
        actor: 'محمد',
      },
      {
        id: 103,
        at: '2026-11-23T16:10:00Z',
        delta: -1,
        kind: 'sale',
        reference: 'INV-000231',
        actor: 'سارة',
      },
      {
        id: 102,
        at: '2026-11-18T08:05:00Z',
        delta: 20,
        kind: 'purchase',
        reference: 'PO-0012',
        actor: 'رزان',
      },
      {
        id: 101,
        at: '2026-11-15T18:30:00Z',
        delta: -1,
        kind: 'count',
        reference: null,
        actor: 'رزان',
      },
    ],
    dailySales: [
      1, 2, 0, 1, 3, 2, 1, 0, 2, 1, 1, 2, 4, 1, 0, 2, 3, 1, 2, 1, 0, 1, 2, 3, 1, 2, 1, 2, 3, 3,
    ],
  })

  const products: StoredProduct[] = [
    augmentin,
    product(2, 'Cough Syrup 120ml', {
      ingredientId: 11,
      categoryId: 4,
      form: 'syrup',
      strength: '15 ملغ/5 مل',
      manufacturer: 'Pharmacare',
      barcode: '6251234000011',
      units: bottle(14),
      supplierId: 3,
      batches: [batch('2026-10-31', 4, 9, 3)],
    }),
    product(3, 'Azithromycin 500mg 3 Tablets', {
      ingredientId: 4,
      categoryId: 1,
      strength: '500 ملغ',
      manufacturer: 'Pfizer',
      barcode: '6223001234567',
      prescription: true,
      minStock: 10,
      units: box(22),
      batches: [batch('2026-11-29', 12, 15, 1)],
    }),
    product(4, 'Augmentin 457mg/5ml Syrup', {
      ingredientId: 1,
      categoryId: 1,
      form: 'syrup',
      strength: '457 ملغ/5 مل',
      manufacturer: 'GSK',
      barcode: '6281100012352',
      prescription: true,
      units: bottle(32),
      batches: [batch('2026-12-19', 6, 22, 1)],
    }),
    product(5, 'Ventolin Inhaler 100mcg', {
      ingredientId: 10,
      categoryId: 4,
      form: 'inhaler',
      strength: '100 مكغ',
      manufacturer: 'GSK',
      barcode: '5000123456789',
      prescription: true,
      minStock: 10,
      supplierId: 2,
      units: box(24),
      batches: [batch('2027-12-31', 3, 16, 2)],
    }),
    product(6, 'Insulin NovoRapid FlexPen', {
      ingredientId: 6,
      categoryId: 2,
      form: 'injection',
      strength: '100 وحدة/مل',
      manufacturer: 'Novo Nordisk',
      prescription: true,
      minStock: 6,
      units: [{ name: 'قلم', perParent: null, price: 119, enabled: true }],
      batches: [batch('2027-04-30', 3, 90, 1)],
    }),
    product(7, 'Amoxil 500mg 16 Capsules', {
      ingredientId: 2,
      categoryId: 1,
      form: 'capsule',
      strength: '500 ملغ',
      manufacturer: 'GSK',
      barcode: '6281100020012',
      prescription: true,
      units: box(18),
    }),
    product(8, 'Glucophage 500mg 50 Tablets', {
      ingredientId: 7,
      categoryId: 2,
      strength: '500 ملغ',
      manufacturer: 'Merck',
      barcode: '3400930000123',
      prescription: true,
      units: box(16),
      batches: [batch('2028-02-29', 27, 10, 4)],
    }),
    product(9, 'Panadol Extra 24 Tablets', {
      ingredientId: 9,
      categoryId: 3,
      strength: '500/65 ملغ',
      manufacturer: 'GSK',
      barcode: '6281100030011',
      units: box(21, [{ name: 'شريط', perParent: 2, price: 11, enabled: true }]),
      batches: [batch('2028-03-31', 120, 14, 2)],
    }),
    product(10, 'Bepanthen Cream 30g', {
      ingredientId: 5,
      categoryId: 8,
      form: 'cream',
      strength: '5%',
      manufacturer: 'Bayer',
      barcode: '4008500000011',
      units: box(27),
      batches: [batch('2027-05-31', 18, 19, 2)],
    }),
    product(11, 'Augmentin 1g 14 Tablets', {
      ingredientId: 1,
      categoryId: 1,
      strength: '1 غ',
      manufacturer: 'GSK',
      barcode: '6281100012369',
      prescription: true,
      units: box(49),
      batches: [batch('2027-08-31', 11, 35, 1)],
    }),
    product(12, 'Amoclan 1g 14 Tablets', {
      ingredientId: 1,
      categoryId: 1,
      strength: '1 غ',
      manufacturer: 'Hikma',
      barcode: '6251070000014',
      prescription: true,
      units: box(52),
      batches: [batch('2027-10-31', 15, 37, 4)],
    }),
    product(13, 'Amoclan 312mg/5ml Syrup', {
      ingredientId: 1,
      categoryId: 9,
      form: 'syrup',
      strength: '312 ملغ/5 مل',
      manufacturer: 'Hikma',
      barcode: '6251070000021',
      prescription: true,
      units: bottle(24),
      batches: [batch('2027-06-30', 9, 17, 4)],
    }),
    product(14, 'Moxiclav 625mg 14 Tablets', {
      ingredientId: 1,
      categoryId: 1,
      strength: '625 ملغ',
      manufacturer: 'Jamjoom',
      barcode: '6286001000013',
      prescription: true,
      units: box(34),
    }),
    product(15, 'Curam 1g 14 Tablets', {
      ingredientId: 1,
      categoryId: 1,
      strength: '1 غ',
      manufacturer: 'Sandoz',
      barcode: '9002260000014',
      prescription: true,
      units: box(47),
    }),
    product(16, 'Omeprazole 20mg 28 Capsules', {
      ingredientId: 12,
      categoryId: 6,
      form: 'capsule',
      strength: '20 ملغ',
      manufacturer: 'Dexcel',
      barcode: '7290000000016',
      units: box(18),
      batches: [batch('2027-03-31', 22, 11, 3)],
    }),
    product(17, 'Zyrtec 10mg 20 Tablets', {
      ingredientId: 13,
      categoryId: 5,
      strength: '10 ملغ',
      manufacturer: 'UCB',
      barcode: '5413000000017',
      units: box(26),
      batches: [batch('2027-07-31', 4, 18, 2)],
    }),
    product(18, 'Vitamin D3 1000IU 30 Capsules', {
      ingredientId: 14,
      categoryId: 7,
      form: 'capsule',
      strength: '1000 وحدة',
      manufacturer: 'Now Foods',
      barcode: '7330000000018',
      units: box(45),
      batches: [batch('2028-06-30', 16, 30, 4)],
    }),
    product(19, 'Brufen 400mg 30 Tablets', {
      ingredientId: 15,
      categoryId: 3,
      strength: '400 ملغ',
      manufacturer: 'Abbott',
      barcode: '5000000000019',
      units: box(15),
      batches: [batch('2027-11-30', 40, 9, 1)],
    }),
    product(20, 'Adol Syrup 120ml', {
      ingredientId: 8,
      categoryId: 9,
      form: 'syrup',
      strength: '120 ملغ/5 مل',
      manufacturer: 'Julphar',
      barcode: '6291000000020',
      units: bottle(12),
      batches: [batch('2027-01-31', 10, 8, 3)],
    }),
    product(21, 'Panadol 500mg 24 Tablets', {
      ingredientId: 8,
      categoryId: 3,
      strength: '500 ملغ',
      manufacturer: 'GSK',
      barcode: '6281100030028',
      units: box(14),
      batches: [batch('2028-01-31', 60, 9, 2)],
    }),
    product(22, 'Strepsils Honey Lemon 24', {
      categoryId: 4,
      form: 'other',
      manufacturer: 'Reckitt',
      barcode: '5000158000022',
      units: box(18),
      batches: [batch('2027-09-30', 25, 12, 3)],
    }),
    product(23, 'Fucidin Cream 15g', {
      categoryId: 8,
      form: 'cream',
      strength: '2%',
      manufacturer: 'LEO',
      barcode: '5701000000023',
      prescription: true,
      active: false,
      units: box(25),
      batches: [batch('2027-02-28', 5, 17, 2)],
    }),
    product(24, 'Augmentin 375mg Tablets', {
      ingredientId: 1,
      categoryId: 1,
      strength: '375 ملغ',
      manufacturer: 'GSK',
      barcode: '6281100012376',
      prescription: true,
      active: false,
      units: box(28),
    }),
  ]

  const catalog: CatalogEntry[] = [
    {
      id: 1,
      name: 'Augmentin 625mg 14 Tablets',
      nameAr: 'أوجمنتين 625',
      ingredient: null,
      ingredientName: 'Amoxicillin + Clavulanic acid',
      form: 'tablet',
      strength: '625 ملغ',
      manufacturer: 'GSK',
      barcode: '6281100012345',
      prescription: true,
      units: box(39, [{ name: 'شريط', perParent: 2, price: 20, enabled: true }]),
    },
    {
      id: 2,
      name: 'Amoxil 250mg/5ml Syrup',
      nameAr: 'أموكسيل شراب',
      ingredient: null,
      ingredientName: 'Amoxicillin',
      form: 'syrup',
      strength: '250 ملغ/5 مل',
      manufacturer: 'GSK',
      barcode: '6281100020029',
      prescription: true,
      units: bottle(16),
    },
    {
      id: 3,
      name: 'Zithromax 250mg 6 Tablets',
      nameAr: 'زيثروماكس',
      ingredient: null,
      ingredientName: 'Azithromycin',
      form: 'tablet',
      strength: '250 ملغ',
      manufacturer: 'Pfizer',
      barcode: '5415062000036',
      prescription: true,
      units: box(38),
    },
    {
      id: 4,
      name: 'Nexium 40mg 14 Tablets',
      nameAr: 'نيكسيوم',
      ingredient: null,
      ingredientName: 'Esomeprazole',
      form: 'tablet',
      strength: '40 ملغ',
      manufacturer: 'AstraZeneca',
      barcode: '7310000000047',
      prescription: true,
      units: box(55),
    },
    {
      id: 5,
      name: 'Claritine 10mg 20 Tablets',
      nameAr: 'كلاريتين',
      ingredient: null,
      ingredientName: 'Loratadine',
      form: 'tablet',
      strength: '10 ملغ',
      manufacturer: 'Bayer',
      barcode: '4008500000059',
      prescription: false,
      units: box(24),
    },
    {
      id: 6,
      name: 'Panadol Cold & Flu 24 Tablets',
      nameAr: 'بنادول كولد اند فلو',
      ingredient: null,
      ingredientName: 'Paracetamol + Caffeine',
      form: 'tablet',
      strength: '500 ملغ',
      manufacturer: 'GSK',
      barcode: '6281100030066',
      prescription: false,
      units: box(23),
    },
  ]

  return { categories, ingredients, suppliers, products, catalog }
}
