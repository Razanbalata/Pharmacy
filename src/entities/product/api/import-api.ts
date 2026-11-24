import { http } from '@/shared/api'
import type { ImportPreview, ImportRequest, ImportResult } from '../model/import'

/** Checks the rows without saving anything: what is ready, what needs fixing, what is new. */
export async function previewImport(request: ImportRequest): Promise<ImportPreview> {
  return (await http.post<{ data: ImportPreview }>('/api/imports/products/preview', request)).data
}

/** Saves the rows that are ready. Rows that still have a problem are skipped and counted. */
export async function runImport(request: ImportRequest): Promise<ImportResult> {
  return (await http.post<{ data: ImportResult }>('/api/imports/products', request)).data
}

/** Removes what an import added. Refused (409) once any of it was sold or bought. */
export async function undoImport(id: number): Promise<void> {
  await http.post(`/api/imports/${id}/undo`)
}
