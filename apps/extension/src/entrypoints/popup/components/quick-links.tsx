import { browser, i18n } from '#imports'
import { Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui/components/tooltip'
import bookIcon from '@/assets/icons/book.svg'
import discordIcon from '@/assets/icons/discord.svg'
import hubIcon from '@/assets/icons/hub.svg'

const LINKS: {
  label: 'hub' | 'discord' | 'book'
  icon: string
  url: string
}[] = [
  {
    label: 'hub',
    icon: hubIcon,
    url: browser.runtime.getURL('/translation-hub.html'),
  },
  {
    label: 'discord',
    icon: discordIcon,
    url: 'https://discord.gg/ej45e3PezJ',
  },
  {
    label: 'book',
    icon: bookIcon,
    url: 'https://www.neat-reader.com/webapp#/',
  },
]

export default function QuickLinks() {
  return (
    <div className="flex justify-between">
      {LINKS.map(link => (
        <LinkCard key={link.url} link={link} />
      ))}
    </div>
  )
}

function LinkCard({ link }: { link: (typeof LINKS)[number] }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={link.url}
          target="_blank"
          rel="noreferrer"
          className="border-border bg-input/50 hover:bg-input flex w-20 flex-col items-center justify-center gap-1.5 rounded-md border py-3 text-sm"
        >
          <img src={link.icon} alt={link.label} className="size-5" />
          {i18n.t(`popup.${link.label}.title`)}
        </a>
      </TooltipTrigger>
      <TooltipContent className="max-w-[210px] break-words text-center">
        {i18n.t(`popup.${link.label}.description`)}
      </TooltipContent>
    </Tooltip>
  )
}
