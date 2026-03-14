import { Children } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'

interface DroppableZoneProps {
  id: string
  data: Record<string, unknown>
  children: React.ReactNode
  className?: string
  placeholder?: string
}

export function DroppableZone({ id, data, children, className, placeholder }: DroppableZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id, data })
  const hasChildren = Children.count(children) > 0

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'nodrag nowheel min-h-[28px] rounded-md border border-dashed p-1 flex flex-wrap gap-1 transition-colors',
        isOver && 'border-primary bg-primary/5',
        !isOver && 'border-muted-foreground/30',
        className,
      )}
    >
      {children}
      {!hasChildren && (
        <span className="text-[10px] text-muted-foreground/50 px-1">
          {placeholder ?? 'Drop attributes here'}
        </span>
      )}
    </div>
  )
}
