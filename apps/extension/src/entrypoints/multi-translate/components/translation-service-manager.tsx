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

const DEFAULT_SERVICES: TranslationService[] = [
  { id: 'google', name: 'Google Translate', icon: '', enabled: true },
  { id: 'microsoft', name: 'Microsoft Translator', icon: '', enabled: true },
  { id: 'deeplx', name: 'DeepLX', icon: '', enabled: true },
  { id: 'openai', name: 'OpenAI', icon: '', enabled: false },
  { id: 'deepseek', name: 'DeepSeek', icon: '', enabled: false },
  { id: 'gemini', name: 'Gemini', icon: '', enabled: false },
]

export default function TranslationServiceManager({
  services,
  onChange,
}: TranslationServiceManagerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggleService = useCallback((serviceId: TranslateProviderNames) => {
    const updatedServices = services.map(service =>
      service.id === serviceId
        ? { ...service, enabled: !service.enabled }
        : service,
    )
    onChange(updatedServices)
  }, [services, onChange])

  const enabledCount = services.filter(s => s.enabled).length

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
              {services.map(service => (
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
                    {TRANSLATE_PROVIDER_ITEMS[service.id]?.name || service.name}
                  </span>
                </label>
              ))}
            </div>

            <div className="p-3 border-t bg-muted">
              <div className="text-xs text-muted-foreground">
                {enabledCount}
                {' '}
                of
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

export { DEFAULT_SERVICES }
