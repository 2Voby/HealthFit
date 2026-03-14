# Сторінки

## MainPage (`src/pages/MainPage/MainPage.tsx`)

Призначення: маркетинговий перший екран із швидким входом у квіз.

- Градієнтний header із брендингом Formfit.
- Блок переваг із безперервним marquee (дублюється масив `perks`).
- CTA-кнопка веде на `/quiz`.
- Нижній блок зі статистикою (`12K+`, `94%`, `8 хв`).

## QuizPage (`src/pages/QuizPage/QuizPage.tsx`)

Призначення: покроковий збір даних користувача.

- Джерело кроків: `HARD_CODED_QUIZ_QUESTIONS`.
- Локальний стан:
  - `answers` - словник відповідей.
  - `stepIndex` - поточний крок.
  - `invalidQuestionId` - підсвітка помилки на кроці.
- Підтримка умовного показу кроків через `visibleIf`.
- Типи кроків:
  - `ChoiceQuestionStep` для `single/multi/boolean`.
  - `NumberQuestionStep` для `number`.
- На останньому кроці при валідній відповіді виконується перехід на `/result`.

## ResultPage (`src/pages/ResultPage/ResultPage.tsx`)

Призначення: показ персонального плану та рекомендованих товарів.

- Верхній summary-блок із badge, назвою плану та тегами.
- CTA "Продовжити" (кнопка поки без прив'язаного action).
- Горизонтальний список карток товарів (snap-scroll).

## UX-нотатки

- Усі три сторінки орієнтовані на mobile-first ширину `max-w-[430px]`.
- У `QuizPage` footer зафіксований унизу й враховує `safe-area-inset-bottom`.
