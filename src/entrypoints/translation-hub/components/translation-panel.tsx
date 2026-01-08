import { Icon } from '@iconify/react'
import ProviderIcon from '@/components/provider-icon'
import { useTheme } from '@/components/providers/theme-provider'
import { Button } from '@/components/shadcn/button'
import { PROVIDER_ITEMS } from '@/utils/constants/providers'

export interface TranslationResult {
  id: string
  name: string
  provider: string
  text?: string
  error?: string
  isLoading: boolean
}

interface TranslationCardProps {
  result: TranslationResult
  onCopy: (text: string) => void
  onDelete: (id: string) => void
  onServiceRemove: (id: string) => void
}

function TranslationCard({ result, onCopy, onDelete, onServiceRemove }: TranslationCardProps) {
  const { theme } = useTheme()

  const handleCopy = () => {
    if (result.text) {
      onCopy(result.text)
    }
  }

  const hasContent = result.isLoading || result.error || result.text

  return (
    <div className="border rounded-lg bg-card">
      <div className={`flex items-center justify-between px-3 py-2 ${hasContent ? 'border-b' : ''}`}>
        <div className="flex items-center space-x-2">
          {result.provider && PROVIDER_ITEMS[result.provider as keyof typeof PROVIDER_ITEMS]
            ? (
                <ProviderIcon
                  logo={PROVIDER_ITEMS[result.provider as keyof typeof PROVIDER_ITEMS].logo(theme)}
                  name={result.name}
                  size="sm"
                />
              )
            : (
                <div className="w-5 h-5 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                  ?
                </div>
              )}
        </div>
        <div className="flex items-center space-x-1">
          {result.text && !result.isLoading && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="h-7 w-7"
              title="Copy translation"
            >
              <Icon icon="tabler:copy" className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              onDelete(result.id)
              onServiceRemove(result.id)
            }}
            className="h-7 w-7 text-destructive hover:text-destructive"
            title="Delete card"
          >
            <Icon icon="tabler:x" className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {hasContent && (
        <div className="p-3">
          {result.isLoading
            ? (
                <div className="flex items-center justify-center py-4">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Icon icon="tabler:loader" className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Translating...</span>
                  </div>
                </div>
              )
            : result.error
              ? (
                  <div className="py-2">
                    <div className="flex items-center space-x-2 text-destructive mb-1">
                      <Icon icon="tabler:alert-circle" className="h-4 w-4" />
                      <span className="text-sm font-medium">Translation Failed</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{result.error}</p>
                  </div>
                )
              : (
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {result.text}
                  </div>
                )}
        </div>
      )}
    </div>
  )
}

interface SelectedService {
  id: string
  name: string
  provider: string
  enabled: boolean
}

interface TranslationPanelProps {
  results: TranslationResult[]
  selectedServices: SelectedService[]
  onCopy: (text: string) => void
  onDeleteCard: (id: string) => void
  onServiceRemove: (id: string) => void
}

export function TranslationPanel({ results, selectedServices, onCopy, onDeleteCard, onServiceRemove }: TranslationPanelProps) {
  // Create cards for all selected services, showing empty state if no result yet
  const serviceCards = selectedServices.map((service) => {
    const existingResult = results.find(result => result.id === service.id)

    if (existingResult) {
      return existingResult
    }

    // Create empty card for selected service
    return {
      id: service.id,
      name: service.name,
      provider: service.provider,
      text: undefined,
      error: undefined,
      isLoading: false,
    }
  })

  if (selectedServices.length === 0) {
    return (
      <div className="text-center py-16">
        <Icon icon="tabler:language-off" className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Translation Services Selected</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Select translation services above to see translation cards here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Translation Services (
          {selectedServices.length}
          )
        </h3>
      </div>

      <div className="space-y-3">
        {serviceCards.map(result => (
          <TranslationCard
            key={result.id}
            result={result}
            onCopy={onCopy}
            onDelete={onDeleteCard}
            onServiceRemove={onServiceRemove}
          />
        ))}
      </div>
    </div>
  )
}
