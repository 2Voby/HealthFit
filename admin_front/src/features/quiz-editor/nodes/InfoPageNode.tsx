import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useEditorStore } from '../store/editor.store'
import type { InfoPageNodeData } from '../types'

type Props = NodeProps & { data: InfoPageNodeData }

export function InfoPageNode({ id, data, selected }: Props) {
  const updateNodeData = useEditorStore((s) => s.updateNodeData)
  const removeNode = useEditorStore((s) => s.removeNode)

  return (
    <div className={cn('w-[280px]', selected && 'ring-2 ring-primary rounded-lg')}>
      <Handle type="target" position={Position.Top} className="!bg-green-500" />

      <Card className="border-t-[3px] border-t-green-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 py-2">
          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
            Info Page
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

        <CardContent className="space-y-2 px-3 pb-3">
          <Input
            className="nodrag nowheel h-8 text-sm font-medium"
            placeholder="Page title..."
            defaultValue={data.title}
            onBlur={(e) => updateNodeData(id, { title: e.target.value })}
          />
          <Textarea
            className="nodrag nowheel min-h-[64px] resize-none text-sm"
            placeholder="Motivational message..."
            defaultValue={data.message}
            onBlur={(e) => updateNodeData(id, { message: e.target.value })}
          />
        </CardContent>
      </Card>

      <Handle type="source" position={Position.Bottom} className="!bg-green-500" />
    </div>
  )
}
