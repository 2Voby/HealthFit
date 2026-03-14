import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Trash2, Plus, GripVertical } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useEditorStore } from '../store/editor.store'
import { QUESTION_TYPES, USER_ATTRIBUTES } from '../constants'
import type { QuestionNodeData } from '../types'

type Props = NodeProps & { data: QuestionNodeData }

export function QuestionNode({ id, data, selected }: Props) {
  const updateNodeData = useEditorStore((s) => s.updateNodeData)
  const removeNode = useEditorStore((s) => s.removeNode)
  const addAnswer = useEditorStore((s) => s.addAnswer)
  const removeAnswer = useEditorStore((s) => s.removeAnswer)
  const updateAnswer = useEditorStore((s) => s.updateAnswer)

  const isChoiceType = data.questionType === 'single_choice' || data.questionType === 'multi_choice'

  return (
    <div className={cn('w-[280px]', selected && 'ring-2 ring-primary rounded-lg')}>
      <Handle type="target" position={Position.Top} className="!bg-blue-500" />

      <Card className="border-t-[3px] border-t-blue-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 py-2">
          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
            Question
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
          <Textarea
            className="nodrag nowheel min-h-[48px] resize-none text-sm"
            placeholder="Enter question text..."
            defaultValue={data.text}
            onBlur={(e) => updateNodeData(id, { text: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-2">
            <Select
              value={data.questionType}
              onValueChange={(v) => updateNodeData(id, { questionType: v as QuestionNodeData['questionType'] })}
            >
              <SelectTrigger className="nodrag nowheel h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_TYPES.map((qt) => (
                  <SelectItem key={qt.value} value={qt.value}>
                    {qt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={data.attribute}
              onValueChange={(v) => updateNodeData(id, { attribute: v })}
            >
              <SelectTrigger className="nodrag nowheel h-8 text-xs">
                <SelectValue placeholder="Attribute" />
              </SelectTrigger>
              <SelectContent>
                {USER_ATTRIBUTES.map((attr) => (
                  <SelectItem key={attr} value={attr}>
                    {attr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isChoiceType && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Answers
              </p>
              {data.answers.map((answer) => (
                <div key={answer.id} className="group relative flex items-center gap-1 pr-3">
                  <GripVertical className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                  <Input
                    className="nodrag nowheel h-7 text-xs flex-1 min-w-0"
                    defaultValue={answer.text}
                    placeholder="Answer text"
                    onBlur={(e) => updateAnswer(id, answer.id, { text: e.target.value })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="nodrag h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={() => removeAnswer(id, answer.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={answer.id}
                    className="!bg-blue-500 !w-2.5 !h-2.5"
                  />
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="nodrag h-7 w-full text-xs text-muted-foreground"
                onClick={() => addAnswer(id)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add answer
              </Button>
            </div>
          )}

          {!isChoiceType && (
            <Handle
              type="source"
              position={Position.Bottom}
              className="!bg-blue-500"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
