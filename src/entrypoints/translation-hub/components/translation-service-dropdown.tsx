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
  onToggleService: (serviceId: string, enabled: boolean) => void
}

export function TranslationServiceDropdown({
  selectedServices,
  onToggleService,
}: TranslationServiceDropdownProps) {
  const { theme = 'light' } = useTheme()
  const { services: availableServices, error: hasError } = useAvailableServices()

  // Keep this set for fast lookup of selected state
  const selectedIds = useMemo(() => new Set(selectedServices.map(s => s.id)), [selectedServices])

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
      <div className="flex items-end justify-end">
        <Button variant="outline" disabled className="justify-between min-w-52 h-9">
          <span>Translation Services (Error)</span>
          <Icon icon="tabler:exclamation-circle" className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-end justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="justify-between min-w-52 h-9">
            <span>Translation Services</span>
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
        <DropdownMenuContent
          className="w-80"
          align="end"
          onCloseAutoFocus={e => e.preventDefault()}
        >
          <div className="p-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                Select Translation Services
              </span>
              <button
                type="button"
                onClick={handleConfigureAPI}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary cursor-pointer hover:underline bg-transparent border-none p-0"
              >
                <Icon icon="tabler:settings" className="h-3.5 w-3.5" />
                Configure API
              </button>
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
                        onToggle={onToggleService}
                      />
                      <ServiceSection
                        title="AI Translator"
                        services={aiServices}
                        selectedIds={selectedIds}
                        theme={theme}
                        onToggle={onToggleService}
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
    </div>
  )
}
