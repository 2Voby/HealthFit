// ─── Pagination ─────────────────────────────────────────────
export interface PaginationParams {
  offset?: number
  limit?: number
}

// ─── Attributes ─────────────────────────────────────────────
export interface AttributeResponse {
  id: number
  name: string
  created_at: string
  updated_at: string
}

export interface AttributesListResponse {
  items: AttributeResponse[]
  total: number
}

export interface AttributeCreateRequest {
  name: string
}

export interface AttributeUpdateRequest {
  name?: string | null
}

// ─── Auth ───────────────────────────────────────────────────
export interface LoginRequest {
  login: string
  password: string
}

export interface RegisterRequest {
  login: string
  password: string
}

export interface UserResponse {
  id: number
  login: string
  authorities: string[]
}

// ─── Offers ─────────────────────────────────────────────────
export interface OfferResponse {
  id: number
  name: string
  description: string
  wellness_kit_name: string
  wellness_kit_image_url: string
  wellness_kit_description: string
  price: number
  default: boolean
  requires_all: number[]
  requires_optional: number[]
  excludes: number[]
  priority: number
  created_at: string
  updated_at: string
}

export interface OffersListResponse {
  items: OfferResponse[]
  total: number
}

export interface OfferCreateRequest {
  name: string
  description?: string
  wellness_kit_name?: string
  wellness_kit_image_url?: string
  wellness_kit_description?: string
  price: number
  default?: boolean
  requires_all?: number[]
  requires_optional?: number[]
  excludes?: number[]
  priority?: number
}

export interface OfferUpdateRequest {
  name?: string | null
  description?: string | null
  wellness_kit_name?: string | null
  wellness_kit_image_url?: string | null
  wellness_kit_description?: string | null
  price?: number | null
  default?: boolean | null
  requires_all?: number[] | null
  requires_optional?: number[] | null
  excludes?: number[] | null
  priority?: number | null
}

export interface OfferSelectionRequest {
  attributes?: number[]
  limit?: number
}

export interface OfferSelectionItem {
  offer: OfferResponse
  score: number
  matched_optional_count: number
  total_optional_count: number
  matched_optional_ids: number[]
  missing_requires_all_ids: number[]
  hit_excluded_ids: number[]
  reasoning: string[]
}

export interface OfferSelectionResponse {
  requested_attributes: number[]
  total_considered: number
  total_eligible: number
  items: OfferSelectionItem[]
}

// ─── Questions ──────────────────────────────────────────────
export type QuestionType = 'singe_choise' | 'multiple_choise' | 'manual_input' | 'text'

export interface QuestionAnswerResponse {
  id: number
  text: string
  attributes: number[]
  created_at: string
  updated_at: string
}

export interface QuestionResponse {
  id: number
  text: string
  type: QuestionType
  requires: boolean
  answers: QuestionAnswerResponse[]
  created_at: string
  updated_at: string
}

export interface QuestionsListResponse {
  items: QuestionResponse[]
  total: number
}

export interface QuestionAnswerCreateRequest {
  text: string
  attributes?: number[]
}

export interface QuestionCreateRequest {
  text: string
  type: QuestionType
  requires?: boolean
  answers?: QuestionAnswerCreateRequest[]
}

export interface QuestionUpdateRequest {
  text?: string | null
  type?: QuestionType | null
  requires?: boolean | null
  answers?: QuestionAnswerCreateRequest[] | null
}

// ─── Users ──────────────────────────────────────────────────
export interface UsersListResponse {
  items: UserResponse[]
  total: number
}

export interface UserCreateRequest {
  login: string
  password: string
  authorities?: string[]
}

export interface UserUpdateRequest {
  login?: string | null
  password?: string | null
  authorities?: string[] | null
}

// ─── Flows ─────────────────────────────────────────────────
export type FlowTransitionCondition = 'always' | 'answer_any' | 'answer_all'

export interface FlowTransitionResponse {
  id: number
  from_question_id: number
  to_question_id: number | null
  condition_type: FlowTransitionCondition
  answer_ids: number[]
  priority: number
  created_at: string
  updated_at: string
}

export interface FlowTransitionCreateRequest {
  from_question_id: number
  to_question_id?: number | null
  condition_type?: FlowTransitionCondition
  answer_ids?: number[]
  priority?: number
}

export interface FlowQuestionResponse {
  question_id: number
  position: number
  question: QuestionResponse
}

export interface FlowResponse {
  id: number
  name: string
  is_active: boolean
  start_question_id: number | null
  questions: FlowQuestionResponse[]
  transitions: FlowTransitionResponse[]
  created_at: string
  updated_at: string
}

export interface FlowsListResponse {
  items: FlowResponse[]
  total: number
}

export interface FlowCreateRequest {
  name: string
  is_active?: boolean
  question_ids?: number[]
  transitions?: FlowTransitionCreateRequest[]
}

export interface FlowUpdateRequest {
  name?: string | null
  is_active?: boolean | null
  question_ids?: number[] | null
  transitions?: FlowTransitionCreateRequest[] | null
}

// ─── Flow History ──────────────────────────────────────────
export type FlowHistoryAction = 'create' | 'update' | 'rollback' | 'dependency_update'

export interface FlowSnapshot {
  name: string
  is_active: boolean
  question_ids?: number[]
  transitions?: FlowTransitionCreateRequest[]
}

export interface FlowHistoryEntryResponse {
  id: number
  flow_id: number
  revision: number
  action: FlowHistoryAction
  source_revision: number | null
  changed_by_user_id: number | null
  snapshot: FlowSnapshot
  created_at: string
  updated_at: string
}

export interface FlowHistoryListResponse {
  items: FlowHistoryEntryResponse[]
  total: number
}
