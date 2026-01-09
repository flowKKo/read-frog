import type { ServiceInfo } from '../types'
import { browser } from '#imports'
import { Icon } from '@iconify/react'
import { useMemo } from 'react'
import { useTheme } from '@/components/providers/theme-provider'
import { Button } from '@/components/shadcn/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu'
import { useAvailableServices } from '../hooks/use-available-services'
import { ServiceSection } from './service-list-item'

interface TranslationServiceDropdownProps {
  selectedServices: ServiceInfo[]
  onServicesChange: (services: ServiceInfo[]) => void
}

export function TranslationServiceDropdown({
  selectedServices,
  onServicesChange,
}: TranslationServiceDropdownProps) {
  const { theme = 'light' } = useTheme()
  const { services: availableServices, error: hasError } = useAvailableServices()

  const selectedIds = useMemo(() => new Set(selectedServices.map(s => s.id)), [selectedServices])

  const handleServiceToggle = (serviceId: string, enabled: boolean) => {
    if (enabled) {
      const service = availableServices.find(s => s.id === serviceId)
      if (service) {
        onServicesChange([...selectedServices, service])
      }
    }
    else {
      onServicesChange(selectedServices.filter(s => s.id !== serviceId))
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

  const enabledCount = selectedServices.length
  const normalServices = availableServices.filter(s => s.type === 'normal')
  const aiServices = availableServices.filter(s => s.type === 'ai')

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
    <div className="flex items-end gap-3">
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
                      <ServiceSection
                        title="Normal Translator"
                        services={normalServices}
                        selectedIds={selectedIds}
                        theme={theme}
                        onToggle={handleServiceToggle}
                      />
                      <ServiceSection
                        title="AI Translator"
                        services={aiServices}
                        selectedIds={selectedIds}
                        theme={theme}
                        onToggle={handleServiceToggle}
                      />
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
