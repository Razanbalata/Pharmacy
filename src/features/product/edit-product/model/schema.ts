import { z } from 'zod'
import { DOSAGE_FORMS, type Product, type ProductInput } from '@/entities/product'

const number = (message: string) =>
  z.coerce.number<string | number>({ error: message }).refine(Number.isFinite, message)

const unitSchema = z.object({
  name: z.string().trim().min(1, 'validation.required'),
  perParent: z.union([z.literal(''), z.null(), number('products.form.errors.perParent')]),
  price: number('products.form.errors.price').refine((value) => value > 0, {
    message: 'products.form.errors.price',
  }),
  enabled: z.boolean(),
})

export const productSchema = z
  .object({
    name: z.string().trim().min(1, 'validation.required'),
    nameAr: z.string().trim(),
    ingredientId: z.number().nullable(),
    categoryId: z.number().nullable(),
    form: z.enum(DOSAGE_FORMS).nullable(),
    strength: z.string().trim(),
    manufacturer: z.string().trim(),
    barcode: z.string().trim(),
    prescription: z.boolean(),
    units: z.array(unitSchema).min(1),
    minStock: number('products.form.errors.number').refine((value) => value >= 0, {
      message: 'products.form.errors.number',
    }),
    supplierId: z.number().nullable(),
    active: z.boolean(),
    hasOpening: z.boolean(),
    opening: z.object({
      quantity: z.string(),
      expiry: z.string(),
      cost: z.string(),
    }),
  })
  .superRefine((values, context) => {
    values.units.forEach((unit, index) => {
      if (index === 0) {
        if (!unit.enabled) {
          context.addIssue({
            code: 'custom',
            path: ['units', 0, 'enabled'],
            message: 'products.form.errors.unitEnabled',
          })
        }
        return
      }
      const per = Number(unit.perParent)
      if (!Number.isInteger(per) || per < 2) {
        context.addIssue({
          code: 'custom',
          path: ['units', index, 'perParent'],
          message: 'products.form.errors.perParent',
        })
      }
    })
    if (!values.hasOpening) return
    const quantity = Number(values.opening.quantity)
    if (!values.opening.quantity || !Number.isFinite(quantity) || quantity <= 0) {
      context.addIssue({
        code: 'custom',
        path: ['opening', 'quantity'],
        message: 'products.form.errors.number',
      })
    }
    if (!values.opening.expiry) {
      context.addIssue({
        code: 'custom',
        path: ['opening', 'expiry'],
        message: 'validation.required',
      })
    } else if (values.opening.expiry <= new Date().toISOString().slice(0, 10)) {
      context.addIssue({
        code: 'custom',
        path: ['opening', 'expiry'],
        message: 'products.form.errors.expiryPast',
      })
    }
    const cost = Number(values.opening.cost)
    if (!values.opening.cost || !Number.isFinite(cost) || cost < 0) {
      context.addIssue({
        code: 'custom',
        path: ['opening', 'cost'],
        message: 'products.form.errors.number',
      })
    }
  })

export type ProductFormInput = z.input<typeof productSchema>
export type ProductFormValues = z.output<typeof productSchema>

/** A new product starts sold by the box, active, with the pharmacy's default minimum. */
export function emptyProduct(defaultMinStock = 5): ProductFormInput {
  return {
    name: '',
    nameAr: '',
    ingredientId: null,
    categoryId: null,
    form: 'tablet',
    strength: '',
    manufacturer: '',
    barcode: '',
    prescription: false,
    units: [{ name: 'علبة', perParent: null, price: '', enabled: true }],
    minStock: defaultMinStock,
    supplierId: null,
    active: true,
    hasOpening: false,
    opening: { quantity: '', expiry: '', cost: '' },
  }
}

export function productToForm(product: Product): ProductFormInput {
  return {
    name: product.name,
    nameAr: product.nameAr ?? '',
    ingredientId: product.ingredient?.id ?? null,
    categoryId: product.category?.id ?? null,
    form: product.form,
    strength: product.strength,
    manufacturer: product.manufacturer,
    barcode: product.barcode ?? '',
    prescription: product.prescription,
    units: product.units,
    minStock: product.minStock,
    supplierId: product.supplier?.id ?? null,
    active: product.active,
    hasOpening: false,
    opening: { quantity: '', expiry: '', cost: '' },
  }
}

export function formToInput(values: ProductFormValues): ProductInput {
  return {
    name: values.name,
    nameAr: values.nameAr || null,
    ingredientId: values.ingredientId,
    categoryId: values.categoryId,
    form: values.form,
    strength: values.strength,
    manufacturer: values.manufacturer,
    barcode: values.barcode || null,
    prescription: values.prescription,
    units: values.units.map((unit, index) => ({
      name: unit.name,
      perParent: index === 0 ? null : Number(unit.perParent),
      price: unit.price,
      enabled: unit.enabled,
    })),
    minStock: values.minStock,
    supplierId: values.supplierId,
    active: values.active,
    opening: values.hasOpening
      ? {
          quantity: Number(values.opening.quantity),
          expiry: values.opening.expiry,
          cost: Number(values.opening.cost),
        }
      : null,
  }
}
