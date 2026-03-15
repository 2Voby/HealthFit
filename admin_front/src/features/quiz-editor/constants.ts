import { HelpCircle, FileText, Gift, type LucideIcon } from 'lucide-react'
import type { NodeKind, QuizNodeData, QuestionType } from './types'
import type { AttributeResponse } from '@/types/api'

interface NodeKindMeta {
  kind: NodeKind
  label: string
  icon: LucideIcon
  color: string
  defaultData: QuizNodeData
}

export const NODE_KINDS: NodeKindMeta[] = [
  {
    kind: 'question',
    label: 'Question',
    icon: HelpCircle,
    color: 'border-blue-500',
    defaultData: {
      kind: 'question',
      text: 'New question',
      questionType: 'single_choice',
      requires: false,
      answers: [
        { id: crypto.randomUUID(), text: 'Option 1', attributes: [] },
        { id: crypto.randomUUID(), text: 'Option 2', attributes: [] },
      ],
    },
  },
  {
    kind: 'info_page',
    label: 'Info Page',
    icon: FileText,
    color: 'border-green-500',
    defaultData: {
      kind: 'info_page',
      title: 'Info page',
      message: 'Your motivational message here...',
    },
  },
  {
    kind: 'offer',
    label: 'Finish',
    icon: Gift,
    color: 'border-amber-500',
    defaultData: {
      kind: 'offer',
    },
  },
]

export const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'single_choice', label: 'Single Choice' },
  { value: 'multi_choice', label: 'Multi Choice' },
  { value: 'input_number', label: 'Number Input' },
  { value: 'input_text', label: 'Text Input' },
]

const ts = '2025-01-01T00:00:00Z'

// Attributes are key:value pairs. In the DB each value is a separate AttributeResponse
// with name format "key-value" (e.g. "age-11-20"). The frontend groups them by key.
export const MOCK_ATTRIBUTES: AttributeResponse[] = [
  // age
  { id: 1, name: 'age-11-20', created_at: ts, updated_at: ts },
  { id: 2, name: 'age-21-30', created_at: ts, updated_at: ts },
  { id: 3, name: 'age-31-40', created_at: ts, updated_at: ts },
  { id: 4, name: 'age-41-50', created_at: ts, updated_at: ts },
  // gender
  { id: 5, name: 'gender-male', created_at: ts, updated_at: ts },
  { id: 6, name: 'gender-female', created_at: ts, updated_at: ts },
  // goal
  { id: 7, name: 'goal-weight_loss', created_at: ts, updated_at: ts },
  { id: 8, name: 'goal-strength', created_at: ts, updated_at: ts },
  { id: 9, name: 'goal-flexibility', created_at: ts, updated_at: ts },
  { id: 10, name: 'goal-stress_relief', created_at: ts, updated_at: ts },
  // context
  { id: 11, name: 'context-home', created_at: ts, updated_at: ts },
  { id: 12, name: 'context-gym', created_at: ts, updated_at: ts },
  { id: 13, name: 'context-outdoor', created_at: ts, updated_at: ts },
  // level
  { id: 14, name: 'level-beginner', created_at: ts, updated_at: ts },
  { id: 15, name: 'level-intermediate', created_at: ts, updated_at: ts },
  { id: 16, name: 'level-advanced', created_at: ts, updated_at: ts },
  // constraints
  { id: 17, name: 'constraints-knee', created_at: ts, updated_at: ts },
  { id: 18, name: 'constraints-back', created_at: ts, updated_at: ts },
  { id: 19, name: 'constraints-none', created_at: ts, updated_at: ts },
]

/** Parse attribute name into key and value parts */
export function parseAttributeName(name: string): { key: string; value: string } {
  const idx = name.indexOf('-')
  if (idx === -1) return { key: name, value: name }
  return { key: name.slice(0, idx), value: name.slice(idx + 1) }
}

/** Group attributes by key */
export function groupAttributes(attributes: AttributeResponse[]): Map<string, AttributeResponse[]> {
  const groups = new Map<string, AttributeResponse[]>()
  for (const attr of attributes) {
    const { key } = parseAttributeName(attr.name)
    const group = groups.get(key) ?? []
    group.push(attr)
    groups.set(key, group)
  }
  return groups
}

