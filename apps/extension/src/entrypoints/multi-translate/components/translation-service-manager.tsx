import type { TranslateProviderNames } from '@/types/config/provider'
import { Icon } from '@iconify/react'
import { useCallback, useState } from 'react'
import ProviderIcon from '@/components/provider-icon'
import { TRANSLATE_PROVIDER_ITEMS } from '@/utils/constants/config'

export interface TranslationService {
  id: TranslateProviderNames
  name: string
  icon: string
  enabled: boolean
}

interface TranslationServiceManagerProps {
  services: TranslationService[]
  onChange: (services: TranslationService[]) => void
}

// All available services with their default settings
const ALL_AVAILABLE_SERVICES: TranslationService[] = [
  { id: 'google', name: 'Google Translate', icon: '', enabled: false },
  { id: 'microsoft', name: 'Microsoft Translator', icon: '', enabled: false },
  { id: 'deeplx', name: 'DeepLX', icon: '', enabled: false },
  { id: 'openai', name: 'OpenAI', icon: '', enabled: false },
  { id: 'deepseek', name: 'DeepSeek', icon: '', enabled: false },
  { id: 'gemini', name: 'Gemini', icon: '', enabled: false },
]

// Default services that are enabled by default (only the first few)
const DEFAULT_SERVICES: TranslationService[] = [
  { id: 'google', name: 'Google Translate', icon: '', enabled: true },
  { id: 'microsoft', name: 'Microsoft Translator', icon: '', enabled: true },
  { id: 'deeplx', name: 'DeepLX', icon: '', enabled: true },
]

// Service type categories
const NORMAL_TRANSLATORS: TranslateProviderNames[] = ['google', 'microsoft', 'deeplx']
const AI_TRANSLATORS: TranslateProviderNames[] = ['openai', 'deepseek', 'gemini']

function getServiceDisplayName(serviceId: TranslateProviderNames): string {
  return TRANSLATE_PROVIDER_ITEMS[serviceId]?.name || serviceId
}

export default function TranslationServiceManager({
  services,
  onChange,
}: TranslationServiceManagerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggleService = useCallback((serviceId: TranslateProviderNames) => {
    const serviceExists = services.find(s => s.id === serviceId)

    if (serviceExists) {
      if (serviceExists.enabled) {
        // Service is currently enabled, remove it from the array
        const updatedServices = services.filter(service => service.id !== serviceId)
        onChange(updatedServices)
      }
      else {
        // Service exists but is disabled, remove it and add to the end as enabled
        const newService = ALL_AVAILABLE_SERVICES.find(s => s.id === serviceId)
        if (newService) {
          const updatedServices = [
            ...services.filter(service => service.id !== serviceId),
            { ...newService, enabled: true },
          ]
          onChange(updatedServices)
        }
      }
    }
    else {
      // Add new service to the end
      const newService = ALL_AVAILABLE_SERVICES.find(s => s.id === serviceId)
      if (newService) {
        const updatedServices = [...services, { ...newService, enabled: true }]
        onChange(updatedServices)
      }
    }
  }, [services, onChange])

  const enabledCount = services.filter(s => s.enabled).length

  // Create services map for quick lookup
  const servicesMap = new Map(services.map(service => [service.id, service]))

  // Group services by type, using FIXED order for dropdown display
  const normalServices = NORMAL_TRANSLATORS.map((serviceId) => {
    const existingService = servicesMap.get(serviceId)
    if (existingService) {
      return existingService
    }
    // Return default service if not in current list
    const defaultService = ALL_AVAILABLE_SERVICES.find(s => s.id === serviceId)
    return defaultService ? { ...defaultService, enabled: false } : null
  }).filter(Boolean) as TranslationService[]

  const aiServices = AI_TRANSLATORS.map((serviceId) => {
    const existingService = servicesMap.get(serviceId)
    if (existingService) {
      return existingService
    }
    // Return default service if not in current list
    const defaultService = ALL_AVAILABLE_SERVICES.find(s => s.id === serviceId)
    return defaultService ? { ...defaultService, enabled: false } : null
  }).filter(Boolean) as TranslationService[]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg bg-white hover:bg-gray-50 transition-colors"
      >
        <Icon icon="tabler:settings" className="size-4" />
        <span>
          Translation Services (
          {enabledCount}
          )
        </span>
        <Icon
          icon={isOpen ? 'tabler:chevron-up' : 'tabler:chevron-down'}
          className="size-4"
        />
      </button>

      {isOpen && (
        <>
          <div className="absolute top-full left-0 mt-2 w-64 bg-white border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
            <div className="p-3 border-b">
              <h3 className="text-sm font-medium text-foreground">Translation Services</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Select which services to use for translation
              </p>
            </div>

            <div className="p-2">
              {/* Normal Translators Section */}
              {normalServices.length > 0 && (
                <>
                  <div className="px-2 py-1 mb-1">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Normal Translator
                    </h4>
                  </div>
                  {normalServices.map(service => (
                    <label
                      key={service.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-accent cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={service.enabled}
                        onChange={() => handleToggleService(service.id)}
                        className="w-4 h-4 text-primary border-2 border-border rounded focus:ring-2 focus:ring-ring"
                      />
                      <ProviderIcon
                        logo={TRANSLATE_PROVIDER_ITEMS[service.id]?.logo || ''}
                        className="flex-shrink-0"
                      />
                      <span className="text-sm text-foreground flex-1">
                        {getServiceDisplayName(service.id)}
                      </span>
                    </label>
                  ))}
                </>
              )}

              {/* AI Translators Section */}
              {aiServices.length > 0 && (
                <>
                  <div className="px-2 py-1 mb-1 mt-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      AI Translator
                    </h4>
                  </div>
                  {aiServices.map(service => (
                    <label
                      key={service.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-accent cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={service.enabled}
                        onChange={() => handleToggleService(service.id)}
                        className="w-4 h-4 text-primary border-2 border-border rounded focus:ring-2 focus:ring-ring"
                      />
                      <ProviderIcon
                        logo={TRANSLATE_PROVIDER_ITEMS[service.id]?.logo || ''}
                        className="flex-shrink-0"
                      />
                      <span className="text-sm text-foreground flex-1">
                        {getServiceDisplayName(service.id)}
                      </span>
                    </label>
                  ))}
                </>
              )}
            </div>

            <div className="p-3 border-t bg-muted">
              <div className="text-xs text-muted-foreground">
                {enabledCount}
                {' '}
                of
                {' '}
                {services.length}
                {' '}
                services enabled
              </div>
            </div>
          </div>

          {/* Backdrop to close dropdown */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        </>
      )}
    </div>
  )
}

export { ALL_AVAILABLE_SERVICES, DEFAULT_SERVICES }
