import type { APIProviderNames } from '@/types/config/provider'
import type { APIConnectionTestResult } from '@/utils/api-connection'
import { useMutation } from '@tanstack/react-query'
import { useCallback } from 'react'
import { testAPIConnectivity } from '@/utils/api-connection'

export function useAPIConnection({ provider }: { provider: APIProviderNames }) {
  const mutation = useMutation({
    mutationKey: ['apiConnection', provider],
    mutationFn: async (): Promise<APIConnectionTestResult> => {
      const result = await testAPIConnectivity(provider)
      if (!result.success) {
        throw new Error(result.message)
      }
      return result
    },
  })

  const testConnection = useCallback(() => {
    mutation.mutate()
  }, [mutation])

  const reset = useCallback(() => {
    mutation.reset()
  }, [mutation])

  return {
    isPending: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    testConnection,
    reset,
  }
}
