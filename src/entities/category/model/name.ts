import type { Category } from './types'

/** The category's name in the interface language. */
export function categoryName(category: Pick<Category, 'nameAr' | 'nameEn'>, language: string) {
  return language === 'en' && category.nameEn ? category.nameEn : category.nameAr
}
