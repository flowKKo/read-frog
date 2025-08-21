import type { TranslationResult } from '@/hooks/use-multi-translate'
import { i18n } from '#imports'
import { Icon } from '@iconify/react'
import { Alert, AlertDescription } from '@repo/ui/components/alert'
import { Button } from '@repo/ui/components/button'
import {
  Card,
  CardContent,
  CardHeader,
} from '@repo/ui/components/card'
import { useState } from 'react'
import { toast } from 'sonner'
import ProviderIcon from '@/components/provider-icon'
import { TRANSLATE_PROVIDER_ITEMS } from '@/utils/constants/config'

interface TranslationCardProps {
  result: TranslationResult
  onClose?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export default function TranslationCard({ result, onClose, isCollapsed: externalCollapsed, onToggleCollapse }: TranslationCardProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const isCollapsed = externalCollapsed ?? internalCollapsed
  const provider = TRANSLATE_PROVIDER_ITEMS[result.provider as keyof typeof TRANSLATE_PROVIDER_ITEMS]
  const hasContent = result.text || result.error || result.loading

  return (
    <Card className="transition-all duration-200 max-h-[400px] min-w-0 gap-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ProviderIcon
              logo={provider.logo}
              name={provider.name}
              size="large"
              className="text-base font-medium"
            />
            {hasContent && (
              <Button
                variant="ghost"
                size="iconSm"
                onClick={() => onToggleCollapse ? onToggleCollapse() : setInternalCollapsed(!internalCollapsed)}
                title={isCollapsed ? i18n.t('translationHub.results.expandContent') : i18n.t('translationHub.results.collapseContent')}
              >
                <Icon
                  icon={isCollapsed ? 'tabler:chevron-down' : 'tabler:chevron-up'}
                  className="size-3.5"
                />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {result.loading
              ? (
                  <Icon icon="svg-spinners:ring-resize" className="size-4 text-blue-500" />
                )
              : result.text
                ? (
                    <Icon icon="tabler:check" className="size-4 text-green-500" />
                  )
                : null}
            {result.text && !result.error && (
              <Button
                variant="ghost"
                size="iconSm"
                onClick={() => {
                  navigator.clipboard.writeText(result.text!)
                  toast.success(`${provider?.name || result.provider} ${i18n.t('translationHub.results.copied')}`)
                }}
                title={i18n.t('translationHub.results.copyTranslation')}
              >
                <Icon icon="tabler:copy" className="size-3.5" />
              </Button>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="iconSm"
                onClick={onClose}
                title={i18n.t('translationHub.results.hideService')}
              >
                <Icon icon="tabler:x" className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {hasContent && (
        <CardContent
          className={`py-0 transition-all duration-300 ease-in-out ${
            isCollapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[280px] opacity-100'
          }`}
        >
          {result.error && !result.loading
            ? (
                <Alert variant="destructive">
                  <Icon icon="tabler:alert-triangle" className="size-4" />
                  <AlertDescription>{result.error}</AlertDescription>
                </Alert>
              )
            : result.text && (
              <div className="text-sm text-foreground leading-relaxed max-h-[280px] overflow-y-auto scrollbar-hide">
                {result.text}
              </div>
            )}
        </CardContent>
      )}
    </Card>
  )
}
