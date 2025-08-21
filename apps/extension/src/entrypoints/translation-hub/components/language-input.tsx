import { i18n } from '#imports'
import { Icon } from '@iconify/react'
import { Button } from '@repo/ui/components/button'
import { Textarea } from '@repo/ui/components/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui/components/tooltip'

interface LanguageInputProps {
  value: string
  onChange: (value: string) => void
  onTranslate: () => void
  onClear: () => void
  hasEnabledServices: boolean
}

export default function LanguageInput({ value, onChange, onTranslate, onClear, hasEnabledServices }: LanguageInputProps) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault()
              onTranslate()
            }
          }}
          placeholder={i18n.t('translationHub.input.placeholder')}
          className="h-40 pr-12 resize-none scrollbar-hide bg-background dark:bg-background focus:bg-background dark:focus:bg-background break-all [field-sizing:fixed]"
        />
        {value && (
          <Button
            variant="ghost"
            size="iconSm"
            onClick={onClear}
            className="absolute top-2 right-2"
          >
            <Icon icon="tabler:x" className="size-4" />
          </Button>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="iconSm">
              <Icon icon="tabler:help-circle" className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{i18n.t('translationHub.input.quickTranslateHint')}</p>
          </TooltipContent>
        </Tooltip>

        <Button
          onClick={onTranslate}
          disabled={!value.trim() || !hasEnabledServices}
          size="sm"
          className="gap-1.5"
        >
          <Icon icon="ri:translate" className="size-3.5" />
          {i18n.t('translationHub.input.translate')}
        </Button>
      </div>
    </div>
  )
}
