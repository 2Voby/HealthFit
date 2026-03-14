import { useState, useRef } from 'react'
import { useReactFlow } from '@xyflow/react'
import { LayoutDashboard, Save, MoreHorizontal, Download, Copy, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useEditorStore } from '../store/editor.store'
import { useFlowStore } from '../store/flow.store'
import { FlowHistoryPanel } from './FlowHistoryPanel'

export function TopBar() {
  const quizName = useEditorStore((s) => s.quizName)
  const isDirty = useEditorStore((s) => s.isDirty)
  const setQuizName = useEditorStore((s) => s.setQuizName)
  const autoLayout = useEditorStore((s) => s.autoLayout)
  const serializeGraph = useEditorStore((s) => s.serializeGraph)

  const flows = useFlowStore((s) => s.flows)
  const activeFlowId = useFlowStore((s) => s.activeFlowId)
  const selectFlow = useFlowStore((s) => s.selectFlow)

  const { fitView } = useReactFlow()
  const [editingName, setEditingName] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  const handleSave = () => {
    const data = serializeGraph()
    console.log('Serialized graph:', data)
    toast.success('Graph saved to console')
  }

  const handleExport = () => {
    const data = serializeGraph()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${quizName.toLowerCase().replace(/\s+/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported JSON')
  }

  const handleFlowChange = (flowId: string) => {
    if (isDirty) {
      if (!window.confirm('You have unsaved changes. Switch flow anyway?')) return
    }
    selectFlow(Number(flowId))
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-12 items-center border-b bg-background px-3 gap-2">
        {/* Branding */}
        <span className="text-sm font-bold tracking-tight text-primary shrink-0">
          BebraMe
        </span>

        <Separator orientation="vertical" className="h-6" />

        {/* Flow selector */}
        <Select
          value={activeFlowId ? String(activeFlowId) : undefined}
          onValueChange={handleFlowChange}
        >
          <SelectTrigger className="h-8 w-48 text-xs shrink-0">
            <SelectValue placeholder="Select flow..." />
          </SelectTrigger>
          <SelectContent>
            {flows.map((f) => (
              <SelectItem key={f.id} value={String(f.id)}>
                <span className="flex items-center gap-2">
                  {f.name}
                  {f.is_active && (
                    <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-green-100 text-green-700">
                      Active
                    </Badge>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="h-6" />

        {/* Quiz name */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {editingName ? (
            <Input
              ref={nameRef}
              className="h-8 w-64 text-sm font-semibold"
              defaultValue={quizName}
              autoFocus
              onBlur={(e) => {
                setQuizName(e.target.value || 'Untitled Quiz')
                setEditingName(false)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur()
                }
              }}
            />
          ) : (
            <button
              className="text-sm font-semibold hover:text-muted-foreground transition-colors truncate max-w-[300px] text-left"
              onClick={() => setEditingName(true)}
            >
              {quizName}
            </button>
          )}

          {isDirty && (
            <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" title="Unsaved changes" />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <FlowHistoryPanel />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { autoLayout(); requestAnimationFrame(() => fitView({ duration: 300 })) }}>
                <LayoutDashboard className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Auto-layout</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className={cn('h-8 gap-1.5', isDirty && 'animate-pulse')}
                onClick={handleSave}
              >
                <Save className="h-3.5 w-3.5" />
                Save
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save quiz (Ctrl+S)</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast('Not implemented yet')}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate quiz
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => toast('Not implemented yet')}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete quiz
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </TooltipProvider>
  )
}
