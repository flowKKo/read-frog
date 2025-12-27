import { useAtomValue } from 'jotai'
import { useMemo } from 'react'
import ProviderIcon from '@/components/provider-icon'
import { useTheme } from '@/components/providers/theme-provider'
import { Checkbox } from '@/components/shadcn/checkbox'
import { configFieldsAtomMap } from '@/utils/atoms/config'
import { filterEnabledProvidersConfig, getLLMTranslateProvidersConfig, getNonAPIProvidersConfig, getPureAPIProvidersConfig } from '@/utils/config/helpers'
import { PROVIDER_ITEMS } from '@/utils/constants/providers'

export interface SelectedService {
  id: string
  name: string
  provider: string
  enabled: boolean
}

interface TranslationServiceControlProps {
  selectedServices: SelectedService[]
  onServicesChange: (services: SelectedService[]) => void
}

export function TranslationServiceControl({
  selectedServices,
  onServicesChange,
}: TranslationServiceControlProps) {
  const { theme } = useTheme()
  const providersConfig = useAtomValue(configFieldsAtomMap.providersConfig)
  const filteredProvidersConfig = filterEnabledProvidersConfig(providersConfig)

  const availableServices = useMemo(() => {
    // Combine all available translation services
    const llmProviders = getLLMTranslateProvidersConfig(filteredProvidersConfig)
    const nonApiProviders = getNonAPIProvidersConfig(filteredProvidersConfig)
    const pureApiProviders = getPureAPIProvidersConfig(filteredProvidersConfig)

    return [
      ...llmProviders,
      ...nonApiProviders,
      ...pureApiProviders,
    ].map(({ id, name, provider }) => ({
      id,
      name,
      provider,
      enabled: selectedServices.find(s => s.id === id)?.enabled ?? false,
    }))
  }, [filteredProvidersConfig, selectedServices])

  const handleServiceToggle = (serviceId: string, enabled: boolean) => {
    const updatedServices = availableServices.map(service =>
      service.id === serviceId
        ? { ...service, enabled }
        : service,
    )

    onServicesChange(updatedServices.filter(service => service.enabled))
  }

  const handleSelectAll = () => {
    const allEnabled = availableServices.every(service => service.enabled)
    const updatedServices = availableServices.map(service => ({
      ...service,
      enabled: !allEnabled,
    }))

    onServicesChange(updatedServices.filter(service => service.enabled))
  }

  const enabledCount = availableServices.filter(service => service.enabled).length
  const totalCount = availableServices.length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Translation Services (
          {enabledCount}
          /
          {totalCount}
          )
        </h3>
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-xs text-primary hover:text-primary/80 transition-colors"
        >
          {enabledCount === totalCount ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {availableServices.map(service => (
          <div
            key={service.id}
            className={`border rounded-lg p-3 transition-all ${
              service.enabled
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-border/80'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`service-${service.id}`}
                checked={service.enabled}
                onCheckedChange={checked =>
                  handleServiceToggle(service.id, !!checked)}
              />
              <label
                htmlFor={`service-${service.id}`}
                className="flex items-center space-x-2 cursor-pointer flex-1"
              >
                <ProviderIcon
                  logo={PROVIDER_ITEMS[service.provider as keyof typeof PROVIDER_ITEMS].logo(theme)}
                  name={service.name}
                  size="sm"
                />
                <span className="text-xs font-medium truncate">
                  {service.name}
                </span>
              </label>
            </div>
          </div>
        ))}
      </div>

      {enabledCount === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No translation services selected.</p>
          <p className="text-xs mt-1">Select at least one service to start translating.</p>
        </div>
      )}
    </div>
  )
}
