import type { TranslationResult } from '@/hooks/use-multi-translate'
import { Icon } from '@iconify/react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import ProviderIcon from '@/components/provider-icon'
import { TRANSLATE_PROVIDER_ITEMS } from '@/utils/constants/config'

interface TranslationCardProps {
  result: TranslationResult
  onClose?: () => void
  dragHandleProps?: {
    ref: React.Ref<HTMLDivElement>
  } & Record<string, any>
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

function getProviderDisplayName(provider: string) {
  return TRANSLATE_PROVIDER_ITEMS[provider as keyof typeof TRANSLATE_PROVIDER_ITEMS]?.name || provider
}

function getProviderColor(_provider: string) {
  // All cards now have white background with subtle border
  return 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
}

export default function TranslationCard({ result, onClose, dragHandleProps, isCollapsed: externalCollapsed, onToggleCollapse }: TranslationCardProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed

  const handleCopy = useCallback(() => {
    if (result.text) {
      navigator.clipboard.writeText(result.text)
      toast.success(`${getProviderDisplayName(result.provider)} result copied!`)
    }
  }, [result.text, result.provider])

  const handleToggleCollapse = useCallback(() => {
    if (onToggleCollapse) {
      onToggleCollapse()
    }
    else {
      setInternalCollapsed(!internalCollapsed)
    }
  }, [internalCollapsed, onToggleCollapse])

  const getStatusIcon = () => {
    if (result.loading) {
      return <Icon icon="svg-spinners:ring-resize" className="size-4 text-blue-500" />
    }
    if (result.text) {
      return <Icon icon="tabler:check" className="size-4 text-green-500" />
    }
    return null
  }

  const hasContent = result.text || result.error || result.loading

  return (
    <div className={`border rounded-lg transition-all duration-200 max-h-[400px] flex ${getProviderColor(result.provider)} min-w-0`}>
      {/* Drag Handle */}
      {dragHandleProps && (
        <div className="w-6 pt-4 flex flex-col rounded-l-lg">
          <div className="flex items-center justify-center h-7">
            <div
              {...dragHandleProps}
              className="p-1 cursor-grab active:cursor-grabbing rounded"
              title="Drag to reorder"
            >
              <Icon icon="tabler:grip-vertical" className="size-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
            </div>
          </div>
        </div>
      )}

      {/* Card Content */}
      <div className="flex-1 py-4 pr-4 min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between h-8 mb-3">
          <div className="flex items-center gap-2">
            <ProviderIcon
              logo={TRANSLATE_PROVIDER_ITEMS[result.provider as keyof typeof TRANSLATE_PROVIDER_ITEMS]?.logo || ''}
              name={getProviderDisplayName(result.provider)}
              className="text-sm font-medium"
              size="large"
            />
            {hasContent && (
              <button
                type="button"
                onClick={handleToggleCollapse}
                className="p-1 hover:bg-accent rounded transition-colors"
                title={isCollapsed ? 'Expand content' : 'Collapse content'}
              >
                <Icon
                  icon={isCollapsed ? 'tabler:chevron-down' : 'tabler:chevron-up'}
                  className="size-3.5 text-muted-foreground hover:text-foreground transition-colors"
                />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            {result.text && !result.error && (
              <button
                type="button"
                onClick={handleCopy}
                className="p-1 hover:bg-accent rounded transition-colors"
                title="Copy translation"
              >
                <Icon icon="tabler:copy" className="size-3.5 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 hover:bg-accent rounded transition-colors"
                title="Hide this service"
              >
                <Icon icon="tabler:x" className="size-3.5 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
            )}
          </div>
        </div>

        {/* Content - Scrollable with hidden scrollbar */}
        {hasContent && (
          <div
            className={`flex-1 overflow-hidden relative transition-all duration-300 ease-in-out ${
              isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[280px] opacity-100'
            }`}
          >
            {result.error && !result.loading
              ? (
                  <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded max-h-[280px] overflow-y-auto scrollbar-hide">
                    <div className="flex items-start gap-2">
                      <Icon icon="tabler:alert-triangle" className="size-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-destructive">{result.error}</div>
                    </div>
                  </div>
                )
              : result.text
                ? (
                    <div className="text-sm text-foreground leading-relaxed max-h-[280px] overflow-y-auto scrollbar-hide">
                      {result.text}
                    </div>
                  )
                : null}

          </div>
        )}
      </div>
    </div>
  )
}
