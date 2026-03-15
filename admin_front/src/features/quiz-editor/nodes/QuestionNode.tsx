import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Trash2, Plus, GripVertical, Copy } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useEditorStore } from '../store/editor.store'
import { QUESTION_TYPES } from '../constants'
import { AttributeBadge } from '../components/AttributeBadge'
import { DroppableZone } from '../components/DroppableZone'
import { flushSaveQuestion, useDebouncedSaveQuestion } from '../hooks/use-auto-save-question'
import type { QuestionNodeData } from '../types'

type Props = NodeProps & { data: QuestionNodeData }

export function QuestionNode({ id, data, selected }: Props) {
  const updateNodeData = useEditorStore((s) => s.updateNodeData)
  const removeNode = useEditorStore((s) => s.removeNode)
  const duplicateNode = useEditorStore((s) => s.duplicateNode)
  const addAnswer = useEditorStore((s) => s.addAnswer)
  const removeAnswer = useEditorStore((s) => s.removeAnswer)
  const updateAnswer = useEditorStore((s) => s.updateAnswer)
  const debouncedSave = useDebouncedSaveQuestion()

  const isChoiceType = data.questionType === 'single_choice' || data.questionType === 'multi_choice'
  const backendId = data.backendQuestionId

  const handleRemoveAttribute = (answerId: string, attrId: number) => {
    const answer = data.answers.find((a) => a.id === answerId)
    if (!answer) return
    updateAnswer(id, answerId, {
      attributes: answer.attributes.filter((a) => a !== attrId),
    })
    flushSaveQuestion(backendId)
  }

  return (
    <div className={cn('w-[280px]', selected && 'ring-2 ring-primary rounded-lg')}>
      <Handle type="target" position={Position.Top} className="!bg-blue-500" />

      <Card className="border-t-[3px] border-t-blue-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 py-2">
          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
            Question
          </Badge>
          <div className="flex items-center gap-2">
            <div className="nodrag flex items-center gap-1">
              <Switch
                id={`requires-${id}`}
                checked={data.requires}
                onCheckedChange={(v) => {
                  updateNodeData(id, { requires: v })
                  flushSaveQuestion(backendId)
                }}
                className="scale-75"
              />
              <Label htmlFor={`requires-${id}`} className="text-[10px] text-muted-foreground cursor-pointer">
                Required
              </Label>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="nodrag h-6 w-6 text-muted-foreground hover:text-blue-500"
              onClick={() => duplicateNode(id)}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="nodrag h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={() => removeNode(id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-2 px-3 pb-3">
          <Textarea
            className="nodrag nowheel min-h-[48px] resize-none text-sm"
            placeholder="Enter question text..."
            defaultValue={data.text}
            onBlur={(e) => {
              updateNodeData(id, { text: e.target.value })
              flushSaveQuestion(backendId)
            }}
          />

          <Select
            value={data.questionType}
            onValueChange={(v) => {
              updateNodeData(id, { questionType: v as QuestionNodeData['questionType'] })
              flushSaveQuestion(backendId)
            }}
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

          {isChoiceType && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Answers
              </p>
              {data.answers.map((answer) => (
                <div key={answer.id} className="space-y-1">
                  <div className="group relative flex items-center gap-1 pr-3">
                    <GripVertical className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                    <Input
                      className="nodrag nowheel h-7 text-xs flex-1 min-w-0"
                      defaultValue={answer.text}
                      placeholder="Answer text"
                      onBlur={(e) => {
                        updateAnswer(id, answer.id, { text: e.target.value })
                        flushSaveQuestion(backendId)
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="nodrag h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        removeAnswer(id, answer.id)
                        flushSaveQuestion(backendId)
                      }}
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
                  <DroppableZone
                    id={`answer-drop-${id}-${answer.id}`}
                    data={{ type: 'answer-attributes', nodeId: id, answerId: answer.id }}
                    placeholder="Drop attributes"
                  >
                    {answer.attributes.map((attrId) => (
                      <AttributeBadge
                        key={attrId}
                        attributeId={attrId}
                        onRemove={() => handleRemoveAttribute(answer.id, attrId)}
                      />
                    ))}
                  </DroppableZone>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="nodrag h-7 w-full text-xs text-muted-foreground"
                onClick={() => {
                  addAnswer(id)
                  debouncedSave(backendId)
                }}
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
