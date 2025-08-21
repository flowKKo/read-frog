import type { LangCodeISO6393 } from '@/types/config/languages'
import { i18n } from '#imports'
import { Icon } from '@iconify/react'
import { Input } from '@repo/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
import { useEffect, useRef, useState } from 'react'
import { LANG_CODE_TO_EN_NAME, LANG_CODE_TO_LOCALE_NAME } from '@/types/config/languages'

// Utility functions for language display
function getDisplayName(code: LangCodeISO6393 | 'auto'): string {
  return code === 'auto'
    ? i18n.t('translationHub.language.autoDetect')
    : `${LANG_CODE_TO_LOCALE_NAME[code]} (${LANG_CODE_TO_EN_NAME[code]})`
}

function getSelectedDisplay(code: LangCodeISO6393 | 'auto', isDetecting: boolean, detectedLanguage: LangCodeISO6393 | null): string {
  if (code !== 'auto')
    return LANG_CODE_TO_LOCALE_NAME[code]
  if (isDetecting)
    return i18n.t('translationHub.language.detecting')
  if (detectedLanguage)
    return `${LANG_CODE_TO_LOCALE_NAME[detectedLanguage]}${i18n.t('translationHub.language.autoDetected')}`
  return i18n.t('translationHub.language.autoDetect')
}

interface LanguageSelectorProps {
  value: LangCodeISO6393 | 'auto'
  onChange: (value: LangCodeISO6393 | 'auto') => void
  allowAuto?: boolean
  placeholder?: string
  detectedLanguage?: LangCodeISO6393 | null
  isDetecting?: boolean
}

export default function LanguageSelector({
  value,
  onChange,
  allowAuto = false,
  placeholder = 'Select language',
  detectedLanguage = null,
  isDetecting = false,
}: LanguageSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Get all available languages
  const languages = allowAuto
    ? (['auto', ...Object.keys(LANG_CODE_TO_EN_NAME)] as (LangCodeISO6393 | 'auto')[])
    : (Object.keys(LANG_CODE_TO_EN_NAME) as LangCodeISO6393[])

  // Filter languages based on search (skip during IME composition)
  const filteredLanguages = !searchTerm || isComposing
    ? languages
    : languages.filter(code => getDisplayName(code).toLowerCase().includes(searchTerm.toLowerCase()))

  // Maintain input focus during search
  useEffect(() => {
    if (searchTerm && inputRef.current) {
      const timer = setTimeout(() => inputRef.current?.focus(), 0)
      return () => clearTimeout(timer)
    }
  }, [filteredLanguages, searchTerm])

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-40 text-xs">
        <SelectValue placeholder={placeholder}>
          <div className="flex items-center gap-1 min-w-0">
            <span className="truncate">
              {value ? getSelectedDisplay(value, isDetecting, detectedLanguage) : placeholder}
            </span>
            {isDetecting && value === 'auto' && (
              <Icon icon="svg-spinners:3-dots-bounce" className="size-2.5 text-muted-foreground flex-shrink-0" />
            )}
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="w-80 max-h-64">
        <div className="p-2 border-b">
          <div className="relative">
            <Icon icon="tabler:search" className="absolute left-2 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder={i18n.t('translationHub.language.searchLanguages')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              onKeyDown={e => e.stopPropagation()}
              className="pl-8 h-8 text-sm"
              autoFocus
              autoComplete="off"
            />
          </div>
        </div>

        {filteredLanguages.length === 0
          ? (
              <div className="p-3 text-sm text-muted-foreground text-center">
                {i18n.t('translationHub.language.noLanguagesFound')}
              </div>
            )
          : (
              filteredLanguages.map(code => (
                <SelectItem key={code} value={code}>
                  {getDisplayName(code)}
                </SelectItem>
              ))
            )}
      </SelectContent>
    </Select>
  )
}
