import { Icon } from '@iconify/react'
import { useEffect, useState } from 'react'

interface TextInputProps {
  value: string
  onChange: (value: string) => void
  onTranslate: () => void
  placeholder?: string
  disabled?: boolean
}

export function TextInput({
  value,
  onChange,
  onTranslate,
  placeholder = 'Enter text to translate...',
  disabled = false,
}: TextInputProps) {
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (!value.trim())
      return

    const timer = setTimeout(() => {
      onTranslate()
    }, 1000)

    return () => clearTimeout(timer)
  }, [value, onTranslate])

  const handleClear = () => {
    onChange('')
  }

  return (
    <div className="relative bg-background rounded-xl self-start">
      <div className={`relative border rounded-xl ${isFocused ? 'ring-1 ring-primary/30 border-primary/50' : 'border-border hover:border-border/80'}`}>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full h-96 px-4 py-3 text-base bg-transparent resize-none focus:outline-none placeholder:text-muted-foreground"
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
