import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useAttributes } from '@/hooks/use-attributes'

interface AttributeBadgeProps {
  attributeId: number
  onRemove?: () => void
  className?: string
  /** @deprecated ignored, always shows full name */
  showKey?: boolean
}

export function AttributeBadge({ attributeId, onRemove, className }: AttributeBadgeProps) {
  const { data: attributesData } = useAttributes({ limit: 200 })
  const name = attributesData?.items.find((a) => a.id === attributeId)?.name

  if (!name) return null

  return (
    <Badge
      variant="secondary"
      className={`text-[10px] h-5 gap-0.5 px-1.5 ${className ?? ''}`}
      title={name}
    >
      {name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-0.5 hover:text-destructive"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </Badge>
  )
}
