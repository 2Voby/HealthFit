# Компоненти

## Shared UI primitives (`src/components/ui`)

Використовуються як базові елементи інтерфейсу.

- `button.tsx`
  - Варіанти через `class-variance-authority`: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`.
  - Розміри: `default`, `sm`, `lg`, `icon`.
  - Підтримка `asChild` через Radix `Slot`.
- `card.tsx`
  - Набір: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
- `input.tsx`, `label.tsx`
  - Базові обгортки для полів форми.
- `form.tsx`
  - Адаптери для `react-hook-form`: `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`.

## Quiz feature-components (`src/pages/QuizPage/components`)

- `QuizHeader`
  - Кнопка "назад" + прогресбар кроків.
- `QuizFooter`
  - Фіксована CTA-кнопка й лічильник "Крок N з M".
- `ChoiceQuestionStep`
  - Рендерить варіанти для `single`, `multi`, `boolean`.
  - Враховує `minSelected`/`maxSelected` і помилковий стан.
- `NumberQuestionStep`
  - Композиція з `EditableMetricDisplay` і `NumberWheel`.
- `EditableMetricDisplay`
  - Інлайн-редагування числового значення з `clamp(min, max)`.
- `NumberWheel`
  - Скрол-колесо вибору числа + кнопки `+/-` (Chevron).
- `InfoCard`
  - Додатковий контекст щодо питання (title + description).

## Utility

- `cn()` у `src/lib/utils.ts` поєднує `clsx` + `tailwind-merge`.
- Рекомендовано використовувати `cn` для всіх умовних класів.
