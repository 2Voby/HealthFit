import type { QuizGraph } from '../types'

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
        requires: true,
        answers: [
          { id: a1, text: 'Weight loss', attributes: [3] },
          { id: a2, text: 'Build strength', attributes: [3, 6] },
          { id: a3, text: 'Flexibility', attributes: [3, 9] },
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
        requires: false,
        answers: [
          { id: 'a4-home', text: 'At home', attributes: [4] },
          { id: 'a5-gym', text: 'At the gym', attributes: [4] },
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
        offerId: '1',
        label: 'Weight Loss Starter',
        requires_all: [3],
        requires_optional: [1, 4],
        excludes: [],
      },
    },
    {
      id: 'offer5',
      type: 'offer',
      position: { x: 350, y: 700 },
      data: {
        kind: 'offer',
        offerId: '5',
        label: 'Yoga & Mobility',
        requires_all: [],
        requires_optional: [3, 9],
        excludes: [],
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
      data: { conditionType: 'always', answerIds: [], priority: 100 },
    },
    {
      id: 'e2',
      source: 'q1',
      sourceHandle: a2,
      target: 'info1',
      type: 'conditional',
      data: { conditionType: 'always', answerIds: [], priority: 100 },
    },
    {
      id: 'e3',
      source: 'q1',
      sourceHandle: a3,
      target: 'offer5',
      type: 'conditional',
      data: { conditionType: 'always', answerIds: [], priority: 100 },
    },
    {
      id: 'e4',
      source: 'q2',
      sourceHandle: 'a4-home',
      target: 'offer1',
      type: 'conditional',
      data: { conditionType: 'answer_any', answerIds: ['a4-home'], priority: 100 },
    },
    {
      id: 'e5',
      source: 'info1',
      target: 'offer5',
      type: 'conditional',
      data: { conditionType: 'always', answerIds: [], priority: 100 },
    },
  ],
}
