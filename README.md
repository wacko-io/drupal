## Проект Drupal

React + Vite проект для учебного задания: адаптивный лендинг (mobile‑first), видео в шапке, меню, слайдер, контактная форма и попап контактной формы.

### Что реализовано

- Адаптивная вёрстка (mobile-first) + секционная структура страницы
- Фоновое видео в первом экране (`src/assets/video/video.mp4`)
- Мобильное меню (бургер) + плавное открытие/закрытие (CSS transition)
- Слайдер отзывов (переключение по кнопкам)
- Контактная форма без перезагрузки страницы (fetch → backend API `/api/forms`)
- Переключение языка RU/EN (i18next + react-i18next), сохранение выбора в `LocalStorage`
- Попап контактной формы на маршруте `/contact`:
  - открытие/закрытие через `requestAnimationFrame`
  - блокировка кнопки во время отправки + обработка ошибки
  - сохранение введённых значений в `LocalStorage`
  - корректная работа кнопки «Назад» (History API через React Router)

### Технологии

- React + Vite
- React Router (`react-router-dom`)
- Redux Toolkit + React Redux (состояние UI и формы)
- i18next + react-i18next (локализация RU/EN)
- Fetch API

### Скрипты

- `npm run dev` — запуск в режиме разработки
- `npm run build` — сборка в `build/`
- `npm run preview` — предпросмотр сборки
- `npm run lint` — ESLint

### Быстрый старт

1. `npm i`
2. `npm run dev`
3. Открыть `http://localhost:5173`

### Структура `src/`

- `src/app/` — каркас приложения (роуты, store)
  - `src/app/App.jsx` — корневой компонент
  - `src/app/routes.jsx` — маршрутизация (в т.ч. модалка на `/contact`)
  - `src/app/store.js` — Redux store + LocalStorage
  - `src/app/slices/` — глобальные слайсы (UI и т.п.)
- `src/pages/` — страницы (сборка секций в страницу)
- `src/sections/` — секции лендинга (Hero/Support/Contact и т.д.)
- `src/components/` — переиспользуемые компоненты (layout и т.п.)
- `src/data/` — данные/контент (тексты, списки, массивы для секций)
- `src/assets/` — шрифты/картинки/видео
- `src/styles/` — глобальные стили и стили секций
- `src/utils/` — мелкие утилиты

### Где что искать

- Попап формы: `src/sections/contact/ContactModal.jsx`
- Анимация RAF: `src/sections/contact/rafAnimate.js`
- Роутинг `/contact`: `src/app/routes.jsx`
- Redux store + LocalStorage: `src/app/store.js`
- Форма (общая для секции и попапа): `src/sections/contact/ContactForm.jsx`
- Стили секции контактов: `src/styles/sections/contact.css`
- Стили попапа: `src/styles/sections/contact-modal.css`

### Деплой на GitHub Pages

Сайт публикуется как GitHub Pages (project pages). После включения Pages он будет доступен по адресу:

- `https://wacko-io.github.io/drupal/`
