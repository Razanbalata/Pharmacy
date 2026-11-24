export interface Category {
  id: number
  nameAr: string
  nameEn: string
  productCount: number
  /** Products in this category below their minimum. */
  lowCount: number
}

export interface CategoryInput {
  nameAr: string
  nameEn: string
}
