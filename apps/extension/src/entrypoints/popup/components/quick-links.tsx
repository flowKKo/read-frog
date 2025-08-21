import { i18n } from '#imports'
import { Icon } from '@iconify/react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui/components/tooltip'
import bookIcon from '@/assets/icons/book.svg'
import discordIcon from '@/assets/icons/discord.svg'
import { sendMessage } from '@/utils/message'

const LINKS: {
  label: 'discord' | 'book'
  icon: string
  url: string
}[] = [
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
      <TranslationHubCard />
      <LinkCard link={LINKS[0]} />
      <LinkCard link={LINKS[1]} />
    </div>
  )
}

const cardClassName = 'border-border bg-input/50 hover:bg-input flex w-20 flex-col items-center justify-center gap-1.5 rounded-md border py-3 text-sm'
const tooltipContentClassName = 'max-w-[210px] break-words text-center'

function TranslationHubCard() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={async () => {
            await sendMessage('openTranslationHubPage', undefined)
          }}
          className={cardClassName}
        >
          <Icon icon="tabler:layers-intersect" className="size-5" />
          Hub
        </button>
      </TooltipTrigger>
      <TooltipContent className={tooltipContentClassName}>
        {i18n.t('translationHub.title')}
      </TooltipContent>
    </Tooltip>
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
          className={cardClassName}
        >
          <img src={link.icon} alt={link.label} className="size-5" />
          {i18n.t(`popup.${link.label}.title`)}
        </a>
      </TooltipTrigger>
      <TooltipContent className={tooltipContentClassName}>
        {i18n.t(`popup.${link.label}.description`)}
      </TooltipContent>
    </Tooltip>
  )
}
