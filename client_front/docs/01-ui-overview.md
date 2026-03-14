# Огляд UI

## Технології

- React 19 + TypeScript + Vite.
- Tailwind CSS + Shadcn/ui (`new-york`) + Radix primitives.
- Іконки: `lucide-react`.
- UI-сповіщення: `react-hot-toast`.

## Точки входу

- `src/main.tsx` - монтує застосунок і провайдери.
- `src/providers/index.tsx` - `QueryClientProvider`, `ReactQueryDevtools`, `Toaster`.
- `src/App.tsx` - маршрутизація.

## Маршрути UI

- `/` - лендинг (MainPage).
- `/quiz` - багатокроковий квіз (QuizPage).
- `/result` - екран результату та рекомендацій (ResultPage).

## Базовий користувацький флоу

1. Користувач потрапляє на лендинг і тисне CTA "Почати квіз".
2. У квізі заповнює відповіді по кроках (single/multi/boolean/number).
3. Після останнього валідного кроку відбувається перехід на `/result`.

## Дані та обмеження

- Зараз питання квізу беруться з `HARD_CODED_QUIZ_QUESTIONS`
  (`src/pages/QuizPage/mockQuizConfig.ts`).
- У `QuizPage` вже є `TODO` на заміну hardcoded-конфіга на backend payload.
- API-шар (`src/lib/api.ts`) готовий до роботи через `VITE_API_URL`,
  але поточний UI-флоу результату використовує локальні константи.
