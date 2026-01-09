import type { ServiceInfo } from '../types'
import { useAtomValue } from 'jotai'
import { useMemo } from 'react'
import { configFieldsAtomMap } from '@/utils/atoms/config'
import {
  filterEnabledProvidersConfig,
  getLLMTranslateProvidersConfig,
  getNonAPIProvidersConfig,
  getPureAPIProvidersConfig,
} from '@/utils/config/helpers'

interface UseAvailableServicesResult {
  services: ServiceInfo[]
  error: boolean
}

export function useAvailableServices(): UseAvailableServicesResult {
  const providersConfig = useAtomValue(configFieldsAtomMap.providersConfig)

  return useMemo(() => {
    try {
      if (!providersConfig) {
        return { services: [], error: false }
      }

      const filtered = filterEnabledProvidersConfig(providersConfig)

      const mapToService = (p: { id: string, name: string, provider: string }, type: 'normal' | 'ai'): ServiceInfo => ({
        id: p.id,
        name: p.name,
        provider: p.provider,
        type,
      })

      const normalProviders = [
        ...(getNonAPIProvidersConfig(filtered) || []),
        ...(getPureAPIProvidersConfig(filtered) || []),
      ].filter(p => p?.id && p?.name && p?.provider)

      const llmProviders = (getLLMTranslateProvidersConfig(filtered) || [])
        .filter(p => p?.id && p?.name && p?.provider)

      return {
        services: [
          ...normalProviders.map(p => mapToService(p, 'normal')),
          ...llmProviders.map(p => mapToService(p, 'ai')),
        ],
        error: false,
      }
    }
    catch (error) {
      console.error('Error loading translation services:', error)
      return { services: [], error: true }
    }
  }, [providersConfig])
}
