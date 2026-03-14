import { HelpCircle, FileText, Gift, type LucideIcon } from 'lucide-react'
import type { NodeKind, QuizNodeData, QuestionType, ConditionOperator } from './types'

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
      attribute: '',
      answers: [
        { id: crypto.randomUUID(), text: 'Option 1', value: 'option_1' },
        { id: crypto.randomUUID(), text: 'Option 2', value: 'option_2' },
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
    label: 'Offer',
    icon: Gift,
    color: 'border-amber-500',
    defaultData: {
      kind: 'offer',
      offerId: '',
      label: 'New offer',
    },
  },
]

export const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'single_choice', label: 'Single Choice' },
  { value: 'multi_choice', label: 'Multi Choice' },
  { value: 'input_number', label: 'Number Input' },
  { value: 'input_text', label: 'Text Input' },
]

export const CONDITION_OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: 'eq', label: '=' },
  { value: 'neq', label: '≠' },
  { value: 'gt', label: '>' },
  { value: 'lt', label: '<' },
  { value: 'in', label: 'in' },
  { value: 'contains', label: 'contains' },
]

export const USER_ATTRIBUTES = [
  'age',
  'gender',
  'goal',
  'context',
  'constraints',
  'level',
  'motivation',
  'preferences',
  'wellbeing',
] as const

export const MOCK_OFFERS = [
  { id: 'offer_1', name: 'Weight Loss Starter', description: '4-week home fat-burn plan (20–30 min)' },
  { id: 'offer_2', name: 'Lean Strength Builder', description: 'Gym strength + progression program' },
  { id: 'offer_3', name: 'Low-Impact Fat Burn', description: 'Joint-friendly plan (knees/back safe)' },
  { id: 'offer_4', name: 'Run Your First 5K', description: 'Outdoor running program (3x/week)' },
  { id: 'offer_5', name: 'Yoga & Mobility', description: 'Flexibility + posture (10–25 min)' },
  { id: 'offer_6', name: 'Stress Reset', description: 'Breathing, meditation & anti-stress routines' },
  { id: 'offer_7', name: 'Quick Fit Micro-Workouts', description: 'Daily 10–15 min workouts' },
]
