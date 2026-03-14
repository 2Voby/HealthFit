import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { NODE_KINDS } from '../constants'
import type { NodeKind } from '../types'

export function NodePalette() {
  const [collapsed, setCollapsed] = useState(false)

  const onDragStart = (event: React.DragEvent, kind: NodeKind) => {
    event.dataTransfer.setData('application/quiz-node-kind', kind)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      className={cn(
        'relative flex flex-col border-r bg-background transition-[width] duration-200',
        collapsed ? 'w-12' : 'w-56',
      )}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm font-semibold"
            >
              Components
            </motion.span>
          )}
        </AnimatePresence>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <Separator />

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {NODE_KINDS.map((meta) => {
          const Icon = meta.icon
          return (
            <div
              key={meta.kind}
              draggable
              onDragStart={(e) => onDragStart(e, meta.kind)}
              className={cn(
                'flex items-center gap-2 rounded-md border border-dashed px-3 py-2 cursor-grab',
                'hover:bg-accent hover:border-solid transition-colors',
                'active:cursor-grabbing',
                collapsed && 'justify-center px-0',
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', meta.color.replace('border-', 'text-'))} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-sm whitespace-nowrap overflow-hidden"
                  >
                    {meta.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
