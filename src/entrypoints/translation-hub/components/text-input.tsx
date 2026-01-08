import { Icon } from '@iconify/react'
import { useEffect, useRef, useState } from 'react'

interface TextInputProps {
  value: string
  onChange: (value: string) => void
  onTranslate: () => void
  placeholder?: string
  disabled?: boolean
  isTranslating?: boolean
}

export function TextInput({
  value,
  onChange,
  onTranslate,
  placeholder = 'Enter text to translate...',
  disabled = false,
  isTranslating: _isTranslating = false,
}: TextInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastValueRef = useRef(value)

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    // Only trigger if value has actually changed and is not empty
    if (value.trim() && value !== lastValueRef.current) {
      timeoutRef.current = setTimeout(() => {
        onTranslate()
      }, 1000)
    }

    lastValueRef.current = value

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [value, onTranslate])

  const handleClear = () => {
    onChange('')
  }

  return (
    <div className="relative">
      <div className={`relative border rounded-lg ${isFocused ? 'ring-1 ring-primary/30 border-primary/50' : 'border-border hover:border-border/80'}`}>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full h-96 px-4 py-3 bg-transparent resize-none focus:outline-none placeholder:text-muted-foreground"
          style={{ userSelect: 'text' }}
        />

        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-3 right-3 z-20 p-1 text-muted-foreground hover:text-foreground transition-colors hover:bg-background/80 rounded"
            title="Clear text"
          >
            <Icon icon="tabler:x" className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
