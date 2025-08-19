import { cn } from '@repo/ui/lib/utils'

export default function ProviderIcon({ logo, name, className, size = 'default' }: {
  logo: string
  name?: string
  className?: string
  size?: 'default' | 'large'
}) {
  const iconContainerSize = size === 'large' ? 'size-7' : 'size-5'
  const iconSize = size === 'large' ? 'size-[16px]' : 'size-[11px]'

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className={cn(iconContainerSize, 'rounded-full bg-white border border-border flex items-center justify-center')}>
        <img
          src={logo}
          alt={name}
          className={iconSize}
        />
      </div>
      {name && <span>{name}</span>}
    </div>
  )
}
