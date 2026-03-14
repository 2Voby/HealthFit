import { useState, useRef } from 'react'
import { useReactFlow } from '@xyflow/react'
import { LayoutDashboard, Save, MoreHorizontal, Download, Copy, Trash2, Plus, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

function CreateFlowDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const createFlow = useFlowStore((s) => s.createFlow)

  const handleCreate = () => {
    if (name.trim()) {
      createFlow(name.trim())
      setName('')
      setOpen(false)
      toast.success('Flow created')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" title="Create new flow">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create new flow</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Flow name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleCreate} disabled={!name.trim()}>Create</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function RenameFlowDialog() {
  const [open, setOpen] = useState(false)
  const activeFlowId = useFlowStore((s) => s.activeFlowId)
  const flow = useFlowStore((s) => s.flows.find((f) => f.id === s.activeFlowId))
  const renameFlow = useFlowStore((s) => s.renameFlow)
  const [name, setName] = useState('')

  const handleOpen = () => {
    setName(flow?.name ?? '')
    setOpen(true)
  }

  const handleRename = () => {
    if (name.trim() && activeFlowId) {
      renameFlow(activeFlowId, name.trim())
      setOpen(false)
      toast.success('Flow renamed')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleOpen() }}>
          <Pencil className="h-4 w-4 mr-2" />
          Rename flow
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename flow</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRename() }}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleRename} disabled={!name.trim()}>Rename</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function TopBar() {
  const quizName = useEditorStore((s) => s.quizName)
  const isDirty = useEditorStore((s) => s.isDirty)
  const setQuizName = useEditorStore((s) => s.setQuizName)
  const autoLayout = useEditorStore((s) => s.autoLayout)
  const serializeGraph = useEditorStore((s) => s.serializeGraph)

  const flows = useFlowStore((s) => s.flows)
  const activeFlowId = useFlowStore((s) => s.activeFlowId)
  const selectFlow = useFlowStore((s) => s.selectFlow)
  const deleteFlow = useFlowStore((s) => s.deleteFlow)
  const duplicateFlow = useFlowStore((s) => s.duplicateFlow)

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

  const handleDeleteFlow = () => {
    if (!activeFlowId) return
    if (flows.length <= 1) {
      toast.error('Cannot delete the last flow')
      return
    }
    if (!window.confirm('Delete this flow? This cannot be undone.')) return
    deleteFlow(activeFlowId)
    toast.success('Flow deleted')
  }

  const handleDuplicateFlow = () => {
    if (!activeFlowId) return
    duplicateFlow(activeFlowId)
    toast.success('Flow duplicated')
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-12 items-center border-b bg-background px-3 gap-2">
        {/* Branding */}
        <span className="text-sm font-bold tracking-tight text-primary shrink-0">
          HealthFit
        </span>

        <Separator orientation="vertical" className="h-6" />

        {/* Flow selector + create */}
        <div className="flex items-center gap-1 shrink-0">
          <Select
            value={activeFlowId ? String(activeFlowId) : undefined}
            onValueChange={handleFlowChange}
          >
            <SelectTrigger className="h-8 w-48 text-xs">
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

          <CreateFlowDialog />
        </div>

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
              <DropdownMenuSeparator />
              <RenameFlowDialog />
              <DropdownMenuItem onClick={handleDuplicateFlow}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate flow
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleDeleteFlow}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete flow
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </TooltipProvider>
  )
}
