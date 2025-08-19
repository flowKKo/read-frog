import type { LangCodeISO6393 } from '@/types/config/languages'
import { Icon } from '@iconify/react'
import { useCallback, useState } from 'react'
import { LANG_CODE_TO_EN_NAME, LANG_CODE_TO_LOCALE_NAME } from '@/types/config/languages'

interface LanguageSelectorProps {
  value: LangCodeISO6393 | 'auto'
  onChange: (value: LangCodeISO6393 | 'auto') => void
  allowAuto?: boolean
  placeholder?: string
  detectedLanguage?: LangCodeISO6393 | null
  isDetecting?: boolean
}

const POPULAR_LANGUAGES: (LangCodeISO6393 | 'auto')[] = [
  'auto',
  'eng',
  'cmn',
  'cmn-Hant',
  'spa',
  'fra',
  'deu',
  'jpn',
  'kor',
  'rus',
  'arb',
  'por',
  'ita',
]

export default function LanguageSelector({
  value,
  onChange,
  allowAuto = false,
  placeholder = 'Select language',
  detectedLanguage = null,
  isDetecting = false,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const getDisplayName = useCallback((code: LangCodeISO6393 | 'auto') => {
    if (code === 'auto')
      return 'Auto Detect'
    return `${LANG_CODE_TO_LOCALE_NAME[code]} (${LANG_CODE_TO_EN_NAME[code]})`
  }, [])

  const getShortDisplayName = useCallback((code: LangCodeISO6393 | 'auto') => {
    if (code === 'auto') {
      if (isDetecting) {
        return '检测中...'
      }
      if (detectedLanguage) {
        return `${LANG_CODE_TO_LOCALE_NAME[detectedLanguage]}（自动检测）`
      }
      return '检测源语言'
    }
    return LANG_CODE_TO_LOCALE_NAME[code]
  }, [detectedLanguage, isDetecting])

  const handleSelect = useCallback((selectedValue: LangCodeISO6393 | 'auto') => {
    onChange(selectedValue)
    setIsOpen(false)
    setSearchTerm('')
  }, [onChange])

  const allLanguages = Object.keys(LANG_CODE_TO_EN_NAME) as LangCodeISO6393[]
  const availableLanguages = allowAuto ? ['auto' as const, ...allLanguages] : allLanguages

  const filteredLanguages = availableLanguages.filter((code) => {
    if (!searchTerm)
      return true
    const displayName = getDisplayName(code).toLowerCase()
    return displayName.includes(searchTerm.toLowerCase())
  })

  // Sort with popular languages first
  const sortedLanguages = [
    ...POPULAR_LANGUAGES.filter(lang =>
      (allowAuto || lang !== 'auto') && filteredLanguages.includes(lang),
    ),
    ...filteredLanguages.filter(lang => !POPULAR_LANGUAGES.includes(lang)),
  ]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 px-2 py-1.5 border rounded-md hover:bg-gray-50 transition-colors min-w-[140px] text-left bg-white"
      >
        <span className="text-xs font-medium truncate">
          {value ? getShortDisplayName(value) : placeholder}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isDetecting && value === 'auto' && (
            <Icon icon="svg-spinners:3-dots-bounce" className="size-2.5 text-muted-foreground" />
          )}
          <Icon
            icon={isOpen ? 'tabler:chevron-up' : 'tabler:chevron-down'}
            className="size-3 text-muted-foreground"
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white border rounded-lg shadow-lg z-50 max-h-64 overflow-hidden">
          <div className="p-2 border-b">
            <div className="relative">
              <Icon icon="tabler:search" className="absolute left-2 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search languages..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-ring bg-white"
                autoFocus
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-48">
            {sortedLanguages.length === 0
              ? (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    No languages found
                  </div>
                )
              : (
                  sortedLanguages.map(code => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => handleSelect(code)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors ${
                        value === code ? 'bg-accent font-medium' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{getDisplayName(code)}</span>
                        {POPULAR_LANGUAGES.includes(code) && (
                          <Icon icon="tabler:star" className="size-3 text-yellow-500 flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </button>
                  ))
                )}
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
