import type { SelectedService } from '../types'
import { useAtomValue } from 'jotai'
import { useMemo } from 'react'
import { configFieldsAtomMap } from '@/utils/atoms/config'
import {
  filterEnabledProvidersConfig,
  getLLMTranslateProvidersConfig,
  getNonAPIProvidersConfig,
  getPureAPIProvidersConfig,
} from '@/utils/config/helpers'

interface UseAvailableServicesOptions {
  /** Include type field ('normal' | 'ai') for categorization */
  withType?: boolean
  /** Selected services to derive enabled state from. If not provided, all services default to enabled=true */
  selectedServices?: SelectedService[]
}

interface UseAvailableServicesResult {
  services: SelectedService[]
  error: boolean
}

export function useAvailableServices(
  options: UseAvailableServicesOptions = {},
): UseAvailableServicesResult {
  const { withType = false, selectedServices } = options
  const providersConfig = useAtomValue(configFieldsAtomMap.providersConfig)

  return useMemo(() => {
    try {
      if (!providersConfig) {
        return { services: [], error: false }
      }

      const filteredProvidersConfig = filterEnabledProvidersConfig(providersConfig)

      const llmProviders = (getLLMTranslateProvidersConfig(filteredProvidersConfig) || [])
        .filter(p => p?.id && p?.name && p?.provider)

      const normalProviders = [
        ...(getNonAPIProvidersConfig(filteredProvidersConfig) || []),
        ...(getPureAPIProvidersConfig(filteredProvidersConfig) || []),
      ].filter(p => p?.id && p?.name && p?.provider)

      const mapProvider = (p: { id: string, name: string, provider: string }, type: 'normal' | 'ai') => {
        const enabled = selectedServices
          ? selectedServices.some(s => s.id === p.id && s.enabled)
          : true

        const service: SelectedService = {
          id: p.id,
          name: p.name,
          provider: p.provider,
          enabled,
        }

        if (withType) {
          service.type = type
        }

        return service
      }

      const services = [
        ...normalProviders.map(p => mapProvider(p, 'normal')),
        ...llmProviders.map(p => mapProvider(p, 'ai')),
      ]

      return { services, error: false }
    }
    catch (error) {
      console.error('Error loading translation services:', error)
      return { services: [], error: true }
    }
  }, [providersConfig, selectedServices, withType])
}
