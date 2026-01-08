import type { LangCodeISO6393 } from '@read-frog/definitions'
import { Icon } from '@iconify/react'
import { Button } from '@/components/shadcn/button'
import { SearchableLanguageSelector } from './searchable-language-selector'

interface LanguageControlPanelProps {
  sourceLanguage: LangCodeISO6393
  targetLanguage: LangCodeISO6393
  onSourceLanguageChange: (langCode: LangCodeISO6393) => void
  onTargetLanguageChange: (langCode: LangCodeISO6393) => void
  onLanguageExchange: () => void
}

export function LanguageControlPanel({
  sourceLanguage,
  targetLanguage,
  onSourceLanguageChange,
  onTargetLanguageChange,
  onLanguageExchange,
}: LanguageControlPanelProps) {
  return (
    <div className="flex items-end gap-3">
      <SearchableLanguageSelector
        value={sourceLanguage}
        onValueChange={onSourceLanguageChange}
        label="Source Language"
      />

      <div className="shrink-0 pb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onLanguageExchange}
          title="Exchange languages"
        >
          <Icon icon="tabler:arrows-exchange" className="h-4 w-4" />
        </Button>
      </div>

      <SearchableLanguageSelector
        value={targetLanguage}
        onValueChange={onTargetLanguageChange}
        label="Target Language"
      />
    </div>
  )
}
