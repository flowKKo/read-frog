import type { TranslateProviderNames } from '@/types/config/provider'
import { i18n } from '#imports'
import { Icon } from '@iconify/react'
import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'
import { Checkbox } from '@repo/ui/components/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui/components/popover'
import { Separator } from '@repo/ui/components/separator'
import { useAtomValue } from 'jotai'
import ProviderIcon from '@/components/provider-icon'
import {
  isAPIProvider,
  isPureTranslateProvider,
  LLM_TRANSLATE_PROVIDER_NAMES,
  PURE_TRANSLATE_PROVIDERS,
  TRANSLATE_PROVIDER_NAMES,
} from '@/types/config/provider'
import { configFields } from '@/utils/atoms/config'
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
  onClearProvider?: (provider: TranslateProviderNames) => void
}

// Create service object from provider ID
function createService(id: TranslateProviderNames, enabled = false): TranslationService {
  return {
    id,
    name: TRANSLATE_PROVIDER_ITEMS[id]?.name || id,
    icon: '',
    enabled,
  }
}

function getDefaultServices(providersConfig: any): TranslationService[] {
  const enabledServices = TRANSLATE_PROVIDER_NAMES.filter(id =>
    isPureTranslateProvider(id) || (isAPIProvider(id) && providersConfig[id]?.apiKey),
  ).map(id => createService(id, true))

  return enabledServices.length > 0
    ? enabledServices
    : [
        createService('google', true),
        createService('microsoft', true),
      ]
}

export default function TranslationServiceManager({ services, onChange, onClearProvider }: TranslationServiceManagerProps) {
  const providersConfig = useAtomValue(configFields.providersConfig)

  const handleToggleService = (serviceId: TranslateProviderNames) => {
    const existing = services.find(s => s.id === serviceId)
    if (existing?.enabled) {
      onChange(services.filter(s => s.id !== serviceId))
      onClearProvider?.(serviceId) // Clear translation results when disabling
    }
    else {
      onClearProvider?.(serviceId) // Clear any existing results when re-enabling
      onChange([
        ...services.filter(s => s.id !== serviceId),
        createService(serviceId, true),
      ])
    }
  }

  const enabledCount = services.filter(s => s.enabled).length

  const getServiceState = (id: TranslateProviderNames) =>
    services.find(s => s.id === id) || createService(id)

  const serviceGroups = [
    { services: PURE_TRANSLATE_PROVIDERS.map(getServiceState), title: i18n.t('translationHub.services.normalTranslator') },
    { services: LLM_TRANSLATE_PROVIDER_NAMES.map(getServiceState), title: i18n.t('translationHub.services.aiTranslator') },
  ].filter(({ services }) => services.length > 0)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-auto gap-2">
          <Icon icon="tabler:settings" className="size-4" />
          <span>
            {i18n.t('translationHub.services.title')}
            {' '}
            (
            {enabledCount}
            )
          </span>
          <Icon icon="tabler:chevron-down" className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 max-h-96 overflow-y-auto scrollbar-hide bg-white border shadow-lg"
        align="end"
        sideOffset={8}
      >
        <div className="p-3 space-y-3">
          {serviceGroups.map(({ services, title }, index) => (
            <div key={title} className="space-y-2">
              <h4 className="px-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {title}
              </h4>
              <div className="space-y-1">
                {services.map(service => (
                  <label
                    key={service.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={service.enabled}
                      onCheckedChange={() => handleToggleService(service.id)}
                    />
                    <ProviderIcon
                      logo={TRANSLATE_PROVIDER_ITEMS[service.id].logo}
                    />
                    <span className="text-sm text-foreground flex-1">
                      {service.name}
                    </span>
                    {isAPIProvider(service.id) && service.id !== 'deeplx' && !providersConfig[service.id]?.apiKey && (
                      <Badge variant="warning">{i18n.t('translationHub.services.needAPIKey')}</Badge>
                    )}
                  </label>
                ))}
              </div>
              {index < serviceGroups.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { getDefaultServices }
