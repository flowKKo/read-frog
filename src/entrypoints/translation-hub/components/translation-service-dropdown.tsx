import { browser } from '#imports'
import { Icon } from '@iconify/react'
import { useAtomValue } from 'jotai'
import { useMemo } from 'react'
import ProviderIcon from '@/components/provider-icon'
import { useTheme } from '@/components/providers/theme-provider'
import { Button } from '@/components/shadcn/button'
import { Checkbox } from '@/components/shadcn/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu'
import { configFieldsAtomMap } from '@/utils/atoms/config'
import { filterEnabledProvidersConfig, getLLMTranslateProvidersConfig, getNonAPIProvidersConfig, getPureAPIProvidersConfig } from '@/utils/config/helpers'
import { PROVIDER_ITEMS } from '@/utils/constants/providers'

export interface SelectedService {
  id: string
  name: string
  provider: string
  enabled: boolean
  type?: 'normal' | 'ai'
}

const DEFAULT_SELECTED_SERVICES: SelectedService[] = []

interface TranslationServiceDropdownProps {
  selectedServices?: SelectedService[]
  onServicesChange: (services: SelectedService[]) => void
}

export function TranslationServiceDropdown({
  selectedServices = DEFAULT_SELECTED_SERVICES,
  onServicesChange,
}: TranslationServiceDropdownProps) {
  const { theme = 'light' } = useTheme()
  const providersConfig = useAtomValue(configFieldsAtomMap.providersConfig)

  const servicesData = useMemo(() => {
    try {
      if (!providersConfig) {
        return { services: [], error: false }
      }

      const filteredProvidersConfig = filterEnabledProvidersConfig(providersConfig)

      // Separate different types of translation services
      const llmProviders = (getLLMTranslateProvidersConfig(filteredProvidersConfig) || [])
        .filter(p => p && p.id && p.name && p.provider)
        .map(({ id, name, provider }) => ({
          id,
          name,
          provider,
          enabled: selectedServices.some(s => s.id === id && s.enabled),
          type: 'ai' as const,
        }))

      const normalProviders = [
        ...(getNonAPIProvidersConfig(filteredProvidersConfig) || []),
        ...(getPureAPIProvidersConfig(filteredProvidersConfig) || []),
      ].filter(p => p && p.id && p.name && p.provider).map(({ id, name, provider }) => ({
        id,
        name,
        provider,
        enabled: selectedServices.some(s => s.id === id && s.enabled),
        type: 'normal' as const,
      }))

      const allServices = [...normalProviders, ...llmProviders]
        .filter(service => service.id && service.name && service.provider)

      return { services: allServices, error: false }
    }
    catch (error) {
      console.error('Error loading translation services:', error)
      return { services: [], error: true }
    }
  }, [providersConfig, selectedServices])

  const availableServices = servicesData.services
  const hasError = servicesData.error

  const handleServiceToggle = (serviceId: string, enabled: boolean) => {
    try {
      const updatedServices = availableServices.map(service =>
        service.id === serviceId
          ? { ...service, enabled }
          : service,
      )

      onServicesChange(updatedServices.filter(service => service.enabled))
    }
    catch (error) {
      console.error('Error toggling service:', error)
    }
  }

  const handleConfigureAPI = async () => {
    try {
      await browser.tabs.create({
        url: browser.runtime.getURL('/options.html#/api-providers'),
      })
    }
    catch (error) {
      console.error('Error opening configure API:', error)
    }
  }

  const enabledCount = selectedServices?.length || 0

  if (hasError) {
    return (
      <div className="flex items-center gap-3">
        <Button variant="outline" disabled className="justify-between min-w-64">
          <span>Translation Services (Error)</span>
          <Icon icon="tabler:exclamation-circle" className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleConfigureAPI}
          className="shrink-0"
        >
          <Icon icon="tabler:settings" className="h-3.5 w-3.5 mr-1.5" />
          Configure API
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="justify-between min-w-64">
            <span>Configure Translation Services</span>
            <div className="flex items-center gap-2">
              {enabledCount > 0 && (
                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  {enabledCount}
                </span>
              )}
              <Icon icon="tabler:chevron-down" className="h-4 w-4" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80" align="start">
          <div className="p-2">
            <div className="text-sm font-medium text-foreground mb-2">
              Select Translation Services
            </div>
            <div className="max-h-80 overflow-y-auto">
              {availableServices.length > 0
                ? (
                    <>
                      {/* Normal Translator Section */}
                      {availableServices.filter(s => s.type === 'normal').length > 0 && (
                        <div className="mb-3">
                          <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Normal Translator
                          </div>
                          <div className="space-y-1">
                            {availableServices
                              .filter(service => service?.type === 'normal' && service?.id && service?.name)
                              .map((service, index) => {
                                try {
                                  return (
                                    <div
                                      key={service.id}
                                      className="flex items-center space-x-2 p-2 rounded hover:bg-primary/5 cursor-pointer"
                                      onClick={() => handleServiceToggle(service.id, !service.enabled)}
                                    >
                                      <Checkbox
                                        checked={service.enabled || false}
                                        onCheckedChange={checked =>
                                          handleServiceToggle(service.id, !!checked)}
                                        onClick={e => e.stopPropagation()}
                                      />
                                      {service.provider && PROVIDER_ITEMS[service.provider as keyof typeof PROVIDER_ITEMS]
                                        ? (
                                            <ProviderIcon
                                              logo={PROVIDER_ITEMS[service.provider as keyof typeof PROVIDER_ITEMS].logo(theme)}
                                              name={service.name}
                                              size="sm"
                                            />
                                          )
                                        : (
                                            <div className="flex items-center space-x-2">
                                              <div className="w-5 h-5 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                                                ?
                                              </div>
                                              <span className="text-sm font-medium">
                                                {service.name || 'Unknown Service'}
                                              </span>
                                            </div>
                                          )}
                                    </div>
                                  )
                                }
                                catch (renderError) {
                                  console.error('Error rendering service:', service, renderError)
                                  const errorKey = service?.id || `error-normal-${service?.name || 'unknown'}-${index}`
                                  return (
                                    <div key={errorKey} className="p-2 text-xs text-destructive">
                                      Error loading service:
                                      {' '}
                                      {service?.name || 'Unknown'}
                                    </div>
                                  )
                                }
                              })}
                          </div>
                        </div>
                      )}

                      {/* AI Translator Section */}
                      {availableServices.filter(s => s.type === 'ai').length > 0 && (
                        <div className="mb-3">
                          <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            AI Translator
                          </div>
                          <div className="space-y-1">
                            {availableServices
                              .filter(service => service?.type === 'ai' && service?.id && service?.name)
                              .map((service, index) => {
                                try {
                                  return (
                                    <div
                                      key={service.id}
                                      className="flex items-center space-x-2 p-2 rounded hover:bg-primary/5 cursor-pointer"
                                      onClick={() => handleServiceToggle(service.id, !service.enabled)}
                                    >
                                      <Checkbox
                                        checked={service.enabled || false}
                                        onCheckedChange={checked =>
                                          handleServiceToggle(service.id, !!checked)}
                                        onClick={e => e.stopPropagation()}
                                      />
                                      {service.provider && PROVIDER_ITEMS[service.provider as keyof typeof PROVIDER_ITEMS]
                                        ? (
                                            <ProviderIcon
                                              logo={PROVIDER_ITEMS[service.provider as keyof typeof PROVIDER_ITEMS].logo(theme)}
                                              name={service.name}
                                              size="sm"
                                            />
                                          )
                                        : (
                                            <div className="flex items-center space-x-2">
                                              <div className="w-5 h-5 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                                                ?
                                              </div>
                                              <span className="text-sm font-medium">
                                                {service.name || 'Unknown Service'}
                                              </span>
                                            </div>
                                          )}
                                    </div>
                                  )
                                }
                                catch (renderError) {
                                  console.error('Error rendering service:', service, renderError)
                                  const errorKey = service?.id || `error-ai-${service?.name || 'unknown'}-${index}`
                                  return (
                                    <div key={errorKey} className="p-2 text-xs text-destructive">
                                      Error loading service:
                                      {' '}
                                      {service?.name || 'Unknown'}
                                    </div>
                                  )
                                }
                              })}
                          </div>
                        </div>
                      )}
                    </>
                  )
                : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-sm">No translation services available</p>
                    </div>
                  )}
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        size="sm"
        onClick={handleConfigureAPI}
        className="shrink-0"
      >
        <Icon icon="tabler:settings" className="h-3.5 w-3.5 mr-1.5" />
        Configure API
      </Button>
    </div>
  )
}
