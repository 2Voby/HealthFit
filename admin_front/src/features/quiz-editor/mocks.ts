import type { QuizGraph } from './types'

const a1 = 'a1-weight-loss'
const a2 = 'a2-strength'
const a3 = 'a3-flexibility'

export const MOCK_QUIZ: QuizGraph & { quizId: string; quizName: string } = {
  quizId: 'mock-quiz-1',
  quizName: 'Wellness Journey Quiz',
  viewport: { x: 0, y: 0, zoom: 0.85 },
  nodes: [
    {
      id: 'q1',
      type: 'question',
      position: { x: 250, y: 0 },
      data: {
        kind: 'question',
        text: 'What is your main goal?',
        questionType: 'single_choice',
        attribute: 'goal',
        answers: [
          { id: a1, text: 'Weight loss', value: 'weight_loss' },
          { id: a2, text: 'Build strength', value: 'strength' },
          { id: a3, text: 'Flexibility', value: 'flexibility' },
        ],
      },
    },
    {
      id: 'q2',
      type: 'question',
      position: { x: 0, y: 350 },
      data: {
        kind: 'question',
        text: 'Where do you prefer to exercise?',
        questionType: 'single_choice',
        attribute: 'context',
        answers: [
          { id: 'a4-home', text: 'At home', value: 'home' },
          { id: 'a5-gym', text: 'At the gym', value: 'gym' },
        ],
      },
    },
    {
      id: 'info1',
      type: 'info_page',
      position: { x: 350, y: 350 },
      data: {
        kind: 'info_page',
        title: 'Great choice!',
        message: 'Strength training helps build lean muscle and boost metabolism. Let\'s find the perfect plan for you.',
      },
    },
    {
      id: 'offer1',
      type: 'offer',
      position: { x: 0, y: 700 },
      data: {
        kind: 'offer',
        offerId: 'offer_1',
        label: 'Weight Loss Starter',
      },
    },
    {
      id: 'offer5',
      type: 'offer',
      position: { x: 350, y: 700 },
      data: {
        kind: 'offer',
        offerId: 'offer_5',
        label: 'Yoga & Mobility',
      },
    },
  ],
  edges: [
    {
      id: 'e1',
      source: 'q1',
      sourceHandle: a1,
      target: 'q2',
      type: 'conditional',
      data: { conditions: [] },
    },
    {
      id: 'e2',
      source: 'q1',
      sourceHandle: a2,
      target: 'info1',
      type: 'conditional',
      data: { conditions: [] },
    },
    {
      id: 'e3',
      source: 'q1',
      sourceHandle: a3,
      target: 'offer5',
      type: 'conditional',
      data: { conditions: [] },
    },
    {
      id: 'e4',
      source: 'q2',
      sourceHandle: 'a4-home',
      target: 'offer1',
      type: 'conditional',
      data: {
        conditions: [{ attribute: 'goal', operator: 'eq', value: 'weight_loss' }],
      },
    },
    {
      id: 'e5',
      source: 'info1',
      target: 'offer5',
      type: 'conditional',
      data: { conditions: [] },
    },
  ],
}
