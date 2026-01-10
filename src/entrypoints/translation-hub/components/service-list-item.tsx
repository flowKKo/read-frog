import type { ServiceInfo } from '../types'
import ProviderIcon from '@/components/provider-icon'
import { useTheme } from '@/components/providers/theme-provider'
import { Checkbox } from '@/components/shadcn/checkbox'
import { PROVIDER_ITEMS } from '@/utils/constants/providers'

interface ServiceListItemProps {
  service: ServiceInfo
  isSelected: boolean
  onToggle: (id: string, enabled: boolean) => void
}

export function ServiceListItem({ service, isSelected, onToggle }: ServiceListItemProps) {
  const { theme = 'light' } = useTheme()
  const providerItem = PROVIDER_ITEMS[service.provider as keyof typeof PROVIDER_ITEMS]

  return (
    <div
      className="flex items-center space-x-2 p-2 rounded hover:bg-primary/5 cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={() => onToggle(service.id, !isSelected)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle(service.id, !isSelected)
        }
      }}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={checked => onToggle(service.id, !!checked)}
        onClick={e => e.stopPropagation()}
      />
      {providerItem
        ? (
            <ProviderIcon
              logo={providerItem.logo(theme)}
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

interface ServiceSectionProps {
  title: string
  services: ServiceInfo[]
  selectedIds: Set<string>
  onToggle: (id: string, enabled: boolean) => void
}

export function ServiceSection({ title, services, selectedIds, onToggle }: ServiceSectionProps) {
  if (services.length === 0) {
    return null
  }

  return (
    <div className="mb-3">
      <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {title}
      </div>
      <div className="space-y-1">
        {services.map(service => (
          <ServiceListItem
            key={service.id}
            service={service}
            isSelected={selectedIds.has(service.id)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  )
}
