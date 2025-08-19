import { Icon } from '@iconify/react'
import { useCallback } from 'react'

interface LanguageInputProps {
  value: string
  onChange: (value: string) => void
  onTranslate: () => void
  onClear: () => void
}

export default function LanguageInput({
  value,
  onChange,
  onTranslate,
  onClear,
}: LanguageInputProps) {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      onTranslate()
    }
  }, [onTranslate])

  return (
    <div className="space-y-4">
      <div className="relative">
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter text to translate..."
          className="w-full h-128 p-3 pr-12 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground scrollbar-hide"
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute top-2 right-2 p-1.5 hover:bg-accent rounded-md"
          >
            <Icon icon="tabler:x" className="size-4 text-muted-foreground" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-end">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClear}
            disabled={!value}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Icon icon="tabler:trash" className="size-3.5" />
            Clear
          </button>

          <button
            type="button"
            onClick={onTranslate}
            disabled={!value.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Icon icon="ri:translate" className="size-3.5" />
            Translate
          </button>
        </div>
      </div>
    </div>
  )
}
