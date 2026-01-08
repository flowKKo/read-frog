import type { LangCodeISO6393 } from '@read-frog/definitions'
import { Icon } from '@iconify/react'
import {
  LANG_CODE_TO_EN_NAME,
  langCodeISO6393Schema,
} from '@read-frog/definitions'
import { useEffect, useRef, useState } from 'react'

interface SearchableLanguageSelectorProps {
  value: LangCodeISO6393
  onValueChange: (value: LangCodeISO6393) => void
  label: string
}

function langCodeLabel(langCode: LangCodeISO6393) {
  return LANG_CODE_TO_EN_NAME[langCode]
}

function highlightSearchText(text: string, search: string) {
  if (!search.trim())
    return text

  const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)

  return parts.map((part) => {
    const isHighlighted = regex.test(part)
    const key = isHighlighted ? `highlight-${part}-${search}` : `text-${part}-${search}`

    return isHighlighted
      ? <mark key={key} className="bg-primary/20 text-primary">{part}</mark>
      : <span key={key}>{part}</span>
  })
}

export function SearchableLanguageSelector({
  value,
  onValueChange,
  label,
}: SearchableLanguageSelectorProps) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredLanguages = langCodeISO6393Schema.options.filter((langCode) => {
    if (!search.trim())
      return true
    const searchLower = search.toLowerCase()

    // Get all possible names for this language
    const enName = LANG_CODE_TO_EN_NAME[langCode]?.toLowerCase() || ''

    // Check if any part matches the search
    return enName.includes(searchLower)
      || langCode.toLowerCase().includes(searchLower)
  })

  // Reset highlighted index when search changes using derived state
  const [prevSearch, setPrevSearch] = useState(search)

  if (prevSearch !== search) {
    setHighlightedIndex(0)
    setPrevSearch(search)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearch('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSelect = (langCode: LangCodeISO6393) => {
    onValueChange(langCode)
    setIsOpen(false)
    setSearch('')
    setHighlightedIndex(0)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex(prev => Math.min(prev + 1, filteredLanguages.length - 1))
    }
    else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(prev => Math.max(prev - 1, 0))
    }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredLanguages[highlightedIndex]) {
        handleSelect(filteredLanguages[highlightedIndex])
      }
    }
    else if (e.key === 'Escape') {
      setIsOpen(false)
      setSearch('')
      inputRef.current?.blur()
    }
  }

  return (
    <div className="flex-1 relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-muted-foreground mb-2 whitespace-nowrap">
        {label}
      </label>

      <div className="relative">
        <div
          className={`w-full border rounded-md px-3 py-2 bg-background cursor-pointer transition-colors ${
            isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-border/80'
          }`}
          onClick={() => {
            setIsOpen(!isOpen)
            if (!isOpen) {
              setTimeout(() => inputRef.current?.focus(), 0)
            }
          }}
        >
          {isOpen
            ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => {
                    if (!isComposing) {
                      setSearch(e.target.value)
                    }
                  }}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={(e) => {
                    setIsComposing(false)
                    setSearch((e.target as HTMLInputElement).value)
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search languages..."
                  className="w-full bg-transparent focus:outline-none text-sm relative z-10"
                  autoFocus
                />
              )
            : (
                <div className="flex items-center justify-between">
                  <span className="text-sm truncate">{langCodeLabel(value)}</span>
                  <Icon icon="tabler:chevron-down" className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              )}
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
            {filteredLanguages.length > 0
              ? (
                  filteredLanguages.map((langCode, index) => (
                    <div
                      key={langCode}
                      className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                        index === highlightedIndex
                          ? 'bg-primary/10 text-foreground'
                          : 'hover:bg-primary/5'
                      }`}
                      onClick={() => handleSelect(langCode)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                    >
                      {highlightSearchText(langCodeLabel(langCode), search)}
                    </div>
                  ))
                )
              : (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No languages found
                  </div>
                )}
          </div>
        )}
      </div>
    </div>
  )
}
