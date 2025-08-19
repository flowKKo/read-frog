import { Icon } from '@iconify/react'
import { useCallback } from 'react'
import { sendMessage } from '@/utils/message'

export default function MultiTranslateButton() {
  const handleClick = useCallback(async () => {
    try {
      await sendMessage('openMultiTranslatePage', undefined)
    }
    catch (error) {
      console.error('Failed to open multi-translate page:', error)
    }
  }, [])

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
    >
      <Icon icon="tabler:layers-intersect" className="size-5" strokeWidth={1.5} />
      <span className="font-medium">Multi-Translate</span>
    </button>
  )
}
