import { History, RotateCcw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useFlowStore } from '../store/flow.store'
import { useFlowHistory, useRollbackFlow } from '@/hooks/use-flows'
import type { FlowHistoryAction } from '@/types/api'
import toast from 'react-hot-toast'

const ACTION_COLORS: Record<FlowHistoryAction, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  rollback: 'bg-amber-100 text-amber-700',
  dependency_update: 'bg-gray-100 text-gray-700',
}

const ACTION_LABELS: Record<FlowHistoryAction, string> = {
  create: 'Created',
  update: 'Updated',
  rollback: 'Rollback',
  dependency_update: 'Dep. update',
}

export function FlowHistoryPanel() {
  const activeFlowId = useFlowStore((s) => s.activeFlowId)
  const selectFlow = useFlowStore((s) => s.selectFlow)
  const rollbackFlow = useRollbackFlow()

  const { data: historyData } = useFlowHistory(activeFlowId, { limit: 50 })
  const entries = historyData?.items ?? []
  const sortedEntries = [...entries].sort((a, b) => b.revision - a.revision)
  const latestRevision = sortedEntries.length > 0 ? sortedEntries[0].revision : 0

  if (!activeFlowId) return null

  const handleRollback = (revision: number) => {
    rollbackFlow.mutate(
      { flowId: activeFlowId, revision },
      {
        onSuccess: (updatedFlow) => {
          selectFlow(updatedFlow)
          toast.success(`Rolled back to revision ${revision}`)
        },
        onError: (err) => toast.error(err.message || 'Rollback failed'),
      },
    )
  }

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <History className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Flow history</TooltipContent>
      </Tooltip>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>History</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-2 pr-4">
            {sortedEntries.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No history entries</p>
            )}
            {sortedEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-mono font-bold text-muted-foreground">
                    r{entry.revision}
                  </span>
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${ACTION_COLORS[entry.action]}`}
                    >
                      {ACTION_LABELS[entry.action]}
                    </Badge>
                    {entry.revision === latestRevision && (
                      <Badge variant="outline" className="text-[10px]">
                        Current
                      </Badge>
                    )}
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    {new Date(entry.created_at).toLocaleString()}
                  </p>

                  {entry.source_revision !== null && (
                    <p className="text-[11px] text-muted-foreground">
                      From revision {entry.source_revision}
                    </p>
                  )}

                  <p className="text-[11px] text-muted-foreground">
                    {entry.snapshot.question_ids?.length ?? 0} questions,{' '}
                    {entry.snapshot.transitions?.length ?? 0} transitions
                  </p>
                </div>

                {entry.revision !== latestRevision && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1 shrink-0"
                    onClick={() => handleRollback(entry.revision)}
                    disabled={rollbackFlow.isPending}
                  >
                    <RotateCcw className="h-3 w-3" />
                    Rollback
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
