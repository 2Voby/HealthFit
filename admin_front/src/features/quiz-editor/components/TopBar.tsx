import { useState, useRef, useCallback } from 'react'
import { useReactFlow } from '@xyflow/react'
import { LayoutDashboard, Save, MoreHorizontal, Download, Copy, Trash2, Plus, Pencil, LogOut, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import { useFlows, useCreateFlow, useUpdateFlow, useDeleteFlow } from '@/hooks/use-flows'
import { useLogout } from '@/hooks/use-auth'
import { useAuthStore } from '@/store/auth.store'
import { graphToFlow, mapQuestionTypeToApi } from '../utils/graph-to-flow'
import { questionsService } from '@/services/questions.service'
import type { QuestionCreateRequest } from '@/types/api'

function CreateFlowDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const createFlow = useCreateFlow()

  const handleCreate = () => {
    if (!name.trim()) return
    createFlow.mutate(
      { name: name.trim() },
      {
        onSuccess: () => {
          toast.success('Flow created')
          setName('')
          setOpen(false)
        },
        onError: (err) => toast.error(err.message || 'Failed to create flow'),
      },
    )
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
            <Button size="sm" onClick={handleCreate} disabled={!name.trim() || createFlow.isPending}>
              {createFlow.isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function RenameFlowDialog() {
  const [open, setOpen] = useState(false)
  const activeFlowId = useFlowStore((s) => s.activeFlowId)
  const { data: flowsData } = useFlows({ limit: 200 })
  const flow = flowsData?.items.find((f) => f.id === activeFlowId)
  const updateFlow = useUpdateFlow()
  const [name, setName] = useState('')

  const handleOpen = () => {
    setName(flow?.name ?? '')
    setOpen(true)
  }

  const handleRename = () => {
    if (!name.trim() || !activeFlowId) return
    updateFlow.mutate(
      { id: activeFlowId, data: { name: name.trim() } },
      {
        onSuccess: () => {
          toast.success('Flow renamed')
          setOpen(false)
        },
        onError: (err) => toast.error(err.message || 'Failed to rename'),
      },
    )
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
            <Button size="sm" onClick={handleRename} disabled={!name.trim() || updateFlow.isPending}>
              {updateFlow.isPending ? 'Saving...' : 'Rename'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function TopBar() {
  const { nodes, edges } = useEditorStore()
  const updateNodeData = useEditorStore((s) => s.updateNodeData)
  const isDirty = useEditorStore((s) => s.isDirty)
  const autoLayout = useEditorStore((s) => s.autoLayout)
  const serializeGraph = useEditorStore((s) => s.serializeGraph)

  const activeFlowId = useFlowStore((s) => s.activeFlowId)
  const selectFlow = useFlowStore((s) => s.selectFlow)

  const { data: flowsData } = useFlows({ limit: 200 })
  const flows = flowsData?.items ?? []
  const activeFlow = flows.find((f) => f.id === activeFlowId)

  const updateFlow = useUpdateFlow()
  const deleteFlow = useDeleteFlow()
  const createFlow = useCreateFlow()
  const logoutMutation = useLogout()
  const clearUser = useAuthStore((s) => s.clearUser)

  const { fitView } = useReactFlow()
  const [editingName, setEditingName] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  const quizName = activeFlow?.name ?? 'No flow selected'

  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!activeFlowId) return
    setIsSaving(true)
    try {
      // Create any new questions that don't have a backendQuestionId yet
      for (const node of nodes) {
        if (node.data.kind === 'question' && !node.data.backendQuestionId) {
          const req: QuestionCreateRequest = {
            text: node.data.text || 'New question',
            type: mapQuestionTypeToApi(node.data.questionType) as QuestionCreateRequest['type'],
            requires: node.data.requires,
            answers: node.data.answers.map((a) => ({
              text: a.text,
              attributes: a.attributes,
            })),
          }
          const created = await questionsService.create(req)
          // Map frontend answer IDs to backend answer IDs
          const answerUpdates: Record<string, { backendId: number }> = {}
          node.data.answers.forEach((a, i) => {
            if (created.answers[i]) {
              answerUpdates[a.id] = { backendId: created.answers[i].id }
            }
          })
          updateNodeData(node.id, {
            backendQuestionId: created.id,
            answers: node.data.answers.map((a, i) =>
              created.answers[i] ? { ...a, backendId: created.answers[i].id } : a,
            ),
          })
        } else if (node.data.kind === 'info_page' && !node.data.backendQuestionId) {
          const req: QuestionCreateRequest = {
            text: node.data.title || 'New info page',
            type: 'text',
          }
          const created = await questionsService.create(req)
          updateNodeData(node.id, { backendQuestionId: created.id })
        }
      }

      // Re-read nodes after updates
      const freshNodes = useEditorStore.getState().nodes
      const freshEdges = useEditorStore.getState().edges
      const flowUpdate = graphToFlow(freshNodes, freshEdges)
      updateFlow.mutate(
        { id: activeFlowId, data: flowUpdate },
        {
          onSuccess: (updated) => {
            selectFlow(updated)
            setIsSaving(false)
            toast.success('Saved')
          },
          onError: (err) => {
            setIsSaving(false)
            toast.error(err.message || 'Save failed')
          },
        },
      )
    } catch (err) {
      setIsSaving(false)
      toast.error(err instanceof Error ? err.message : 'Failed to create questions')
    }
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

  const [confirmSwitch, setConfirmSwitch] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleFlowChange = (flowId: string) => {
    if (isDirty) {
      setConfirmSwitch(flowId)
      return
    }
    const flow = flows.find((f) => f.id === Number(flowId))
    if (flow) selectFlow(flow)
  }

  const handleConfirmSwitch = () => {
    if (!confirmSwitch) return
    const flow = flows.find((f) => f.id === Number(confirmSwitch))
    if (flow) selectFlow(flow)
    setConfirmSwitch(null)
  }

  const handleDeleteFlow = () => {
    if (!activeFlowId) return
    if (flows.length <= 1) {
      toast.error('Cannot delete the last flow')
      return
    }
    setConfirmDelete(true)
  }

  const handleConfirmDelete = () => {
    if (!activeFlowId) return
    setConfirmDelete(false)
    deleteFlow.mutate(activeFlowId, {
      onSuccess: () => toast.success('Flow deleted'),
      onError: (err) => toast.error(err.message || 'Delete failed'),
    })
  }

  const handleDuplicateFlow = () => {
    if (!activeFlow) return
    createFlow.mutate(
      {
        name: `${activeFlow.name} (copy)`,
        is_active: false,
        question_ids: activeFlow.questions.map((q) => q.question_id),
        transitions: activeFlow.transitions.map((t) => ({
          from_question_id: t.from_question_id,
          to_question_id: t.to_question_id,
          condition_type: t.condition_type,
          answer_ids: t.answer_ids,
          priority: t.priority,
        })),
      },
      {
        onSuccess: (newFlow) => {
          selectFlow(newFlow)
          toast.success('Flow duplicated')
        },
        onError: (err) => toast.error(err.message || 'Duplicate failed'),
      },
    )
  }

  const handleSetActive = () => {
    if (!activeFlowId) return
    if (activeFlow?.is_active) return
    updateFlow.mutate(
      { id: activeFlowId, data: { is_active: true } },
      {
        onSuccess: () => toast.success('Flow set as active'),
        onError: (err) => toast.error(err.message || 'Failed to set active'),
      },
    )
  }

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => clearUser(),
      onError: () => clearUser(),
    })
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
                if (activeFlowId && e.target.value && e.target.value !== activeFlow?.name) {
                  updateFlow.mutate(
                    { id: activeFlowId, data: { name: e.target.value } },
                    { onError: (err) => toast.error(err.message || 'Failed to rename') },
                  )
                }
                setEditingName(false)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur()
                if (e.key === 'Escape') setEditingName(false)
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
                disabled={!activeFlowId || isSaving || updateFlow.isPending}
              >
                <Save className="h-3.5 w-3.5" />
                {isSaving || updateFlow.isPending ? 'Saving...' : 'Save'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save flow (Ctrl+S)</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSetActive} disabled={activeFlow?.is_active}>
                <Star className={cn('h-4 w-4 mr-2', activeFlow?.is_active && 'fill-current text-amber-500')} />
                {activeFlow?.is_active ? 'Currently active' : 'Set as active'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={confirmSwitch !== null} onOpenChange={(open) => !open && setConfirmSwitch(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Switch flow anyway? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSwitch}>Switch</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete flow</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The flow and all its data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  )
}
