import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Trash2, Gift } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useEditorStore } from '../store/editor.store'
import type { OfferNodeData } from '../types'

type Props = NodeProps & { data: OfferNodeData }

export function OfferNode({ id, selected }: Props) {
  const removeNode = useEditorStore((s) => s.removeNode)

  return (
    <div className={cn('w-[240px]', selected && 'ring-2 ring-primary rounded-lg')}>
      <Handle type="target" position={Position.Top} className="!bg-amber-500" />

      <Card className="border-t-[3px] border-t-amber-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 py-2">
          <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
            Finish
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="nodrag h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={() => removeNode(id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>

        <CardContent className="px-3 pb-3">
          <div className="flex flex-col items-center gap-2 py-2 text-muted-foreground">
            <Gift className="h-6 w-6 text-amber-400" />
            <p className="text-center text-xs">
              Тут буде обрано оффер на основі профілю користувача
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
