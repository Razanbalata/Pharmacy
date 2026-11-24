/**
 * An active ingredient. Products with the same ingredient are alternatives for each other,
 * so the seller can offer one when another is out.
 */
export interface Ingredient {
  id: number
  /** The scientific name, e.g. "Amoxicillin + Clavulanic acid". */
  name: string
  nameAr: string | null
  /** Came from the shared drug list rather than typed by this pharmacy. */
  fromCatalog: boolean
  productCount: number
  inStockCount: number
}

export interface IngredientInput {
  name: string
  nameAr: string | null
}

/** Two ingredients the server thinks are the same thing written differently. */
export interface IngredientDuplicate {
  keep: Pick<Ingredient, 'id' | 'name'>
  merge: Pick<Ingredient, 'id' | 'name'>
}
