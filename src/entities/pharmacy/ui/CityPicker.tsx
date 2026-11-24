import { useQuery } from '@tanstack/react-query'
import { pharmacyQueries } from '../api/queries'
import { Combobox } from '@/shared/ui/combobox'
import type { FieldControlProps } from '@/shared/ui/field'

interface CityPickerProps extends Partial<FieldControlProps> {
  value: string
  onChange: (city: string) => void
}

/** Searchable city list; a missing city can be typed and added. */
export function CityPicker({ value, onChange, ...control }: CityPickerProps) {
  const { data: cities = [] } = useQuery(pharmacyQueries.cities())
  const options = [...new Set([...cities, ...(value ? [value] : [])])].map((city) => ({
    value: city,
    label: city,
  }))
  return (
    <Combobox
      {...control}
      options={options}
      value={value || null}
      onChange={(city) => onChange(city ?? '')}
      onCreate={onChange}
    />
  )
}
