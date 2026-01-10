import { browser, i18n } from '#imports'
import { Icon } from '@iconify/react'
import { Button } from '@/components/shadcn/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/shadcn/tooltip'

export function HubButton() {
  const handleClick = async () => {
    try {
      await browser.tabs.create({
        url: browser.runtime.getURL('/translation-hub.html'),
      })
    }
    catch (error) {
      console.error('Error opening translation hub:', error)
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClick}
        >
          <Icon icon="material-symbols:translate" />
        </Button>
      </TooltipTrigger>
      <TooltipContent className="max-w-[200px] text-wrap">
        {i18n.t('popup.hub.tooltip')}
      </TooltipContent>
    </Tooltip>
  )
}
