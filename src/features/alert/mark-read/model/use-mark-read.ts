import { useMutation, useQueryClient } from '@tanstack/react-query'
import { alertQueries, markAlertRead, markAllAlertsRead, type Alert } from '@/entities/alert'

/** Marks one alert read as its button is followed, so the bell's number goes down. */
export function useMarkAlertRead() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (alert: Alert) => markAlertRead(alert.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: alertQueries.all }),
  })
  return (alert: Alert) => {
    if (!alert.read) mutation.mutate(alert)
  }
}

export function useMarkAllAlertsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markAllAlertsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: alertQueries.all }),
  })
}
