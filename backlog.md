# Backlog — VibeArena

> Формат ID: VA-NNN · Priority: P0 / P1 / P2 / P3 · Status: TODO / IN PROGRESS / DONE · Area: frontend / backend / infra / design / ai

| ID | Title | Priority | Status | Area | Notes |
|----|-------|----------|--------|------|-------|
| VA-001 | Project initialization | P1 | DONE | infra | Создан CLAUDE.md, MEMORY.md, backlog.md, .gitignore, локальный git |
| VA-002 | Скаффолдинг Next.js + TypeScript + Tailwind + Zod + Vitest | P0 | DONE | infra | App Router, ESLint, `.env.example`, README-стаб |
| VA-003 | Типизированный API-клиент VibeMarketolog (capabilities/estimate/generate/status) | P0 | DONE | backend | `src/lib/vibeApi.ts`, токен только на сервере |
| VA-004 | API route: GET /api/agent/capabilities | P0 | DONE | backend | + demo mode fallback |
| VA-005 | Логика подбора совместимых моделей/параметров (aspect_ratio, seed) | P0 | DONE | backend | `src/lib/compat.ts`, покрыто тестами |
| VA-006 | API route: POST /api/agent/generate/estimate | P0 | DONE | backend | strict: true, Zod-валидация тела |
| VA-007 | API route: POST /api/agent/generate (параллельный запуск, idempotency_key per UUID) | P0 | DONE | backend | UUID генерируется на клиенте перед вызовом |
| VA-008 | API route: GET /api/agent/generation/{id}/status + поллинг 10–15с | P0 | DONE | backend | Поллинг раз в 12с на клиенте |
| VA-009 | UI: экран настройки эксперимента (категория, промпт, модель A/B, формат) | P0 | DONE | frontend | `SetupStep.tsx` |
| VA-010 | UI: экран предварительной сметы и подтверждения | P0 | DONE | frontend | `EstimateStep.tsx` |
| VA-011 | UI: экран генерации с независимым прогрессом двух карточек | P0 | DONE | frontend | `GeneratingStep.tsx` |
| VA-012 | UI: слепое сравнение (одинаковое оформление карточек) | P0 | DONE | frontend | `CompareStep.tsx` |
| VA-013 | UI: голосование (лучше A/ничья/лучше B + причина) | P0 | DONE | frontend | Встроено в `CompareStep.tsx` |
| VA-014 | UI: раскрытие результатов после голосования | P0 | DONE | frontend | `RevealStep.tsx` |
| VA-015 | Локальное хранение голосов (запись по структуре из ТЗ) | P0 | DONE | backend | `src/lib/votes.ts`, localStorage |
| VA-016 | Секция «Результаты экспериментов» (агрегированная статистика) | P1 | DONE | frontend | `ResultsSummary.tsx` |
| VA-017 | Demo mode (fixture-каталог, фиктивная смета, локальные demo-изображения) | P0 | DONE | backend | `src/lib/demo.ts`, `public/demo/*.svg` |
| VA-018 | Обработка ошибок на русском (баланс, лимит, несовместимость, таймаут и т.д.) | P0 | DONE | backend | `src/lib/errors.ts` |
| VA-019 | Юнит-тесты ключевой бизнес-логики (Vitest) | P0 | DONE | backend | `compat.test.ts`, `votes.test.ts` — 8 тестов |
| VA-020 | README (проблема/решение/архитектура/запуск/demo mode/ограничения/идеи) | P1 | DONE | infra | По структуре из ТЗ |
| VA-021 | Финальная проверка: линт, тесты, build, отсутствие токена в bundle, demo flow | P0 | DONE | infra | Все проверки пройдены, см. отчёт в чате |
| VA-022 | Проверить реальную форму ответа GET /capabilities с боевым токеном | P2 | DONE | backend | Реальная форма — `models.image` (dict), не массив. Нормализация переписана под неё, отфильтрованы image-edit модели (17 чистых text-to-image моделей). Полный цикл estimate→generate→status проверен на реальном API (z-image, generation_id 30863, реальный PNG). |
| VA-023 | Предвыбор пары моделей по умолчанию (не пустые селекты) | P1 | DONE | frontend | `pickDefaultPair()` в `compat.ts` — две самые дешёвые из доступных в текущем режиме |
| VA-024 | Таблица цен/параметров всех моделей на экране настройки | P1 | DONE | frontend | `ModelCatalogTable.tsx`: цена, форматы, seed, качество, фото — отсортировано по цене |
| VA-025 | Отключить Next.js dev indicator панель | P3 | DONE | infra | `devIndicators: false` в `next.config.ts` |
| VA-026 | Расширение: image-editing с фото товара (по запросу пользователя, вне исходного ТЗ) | P1 | DONE | backend/frontend | Загрузка фото → `POST /upload-media` → фильтр моделей по `image_input` → авто-промпт «keep pixel-identical» → estimate/generate/status без изменений. `src/app/api/agent/upload-media/route.ts`, `filterModelsForMode()`/`buildPhotoPrompt()` в `compat.ts`. Проверено E2E в demo mode (фото → смета → генерация → голос → раскрытие) и на реальном каталоге (21 модель, 4 edit-only + 9 optional-photo корректно определены). |
| VA-027 | Таблица моделей по категориям в «Результаты экспериментов» + win rate + рекомендация | P1 | DONE | frontend | `summarizeByCategory()` в `votes.ts`, отдельная таблица на категорию в `ResultsSummary.tsx`. Правила: <3 сравнений → «Недостаточно данных», макс. win rate (среди моделей с ≥3 сравнений) → «Основная модель», при равенстве — дешевле, остальные → «Альтернатива». Пояснение про минимум 3 сравнения — вверху блока. |
| VA-028 | Баг: aspect_ratio в /generate не совпадал с тем, что использовался в /estimate | P0 | DONE | frontend | В `ExperimentFlow.tsx` добавлено состояние `resolvedAspectRatio` — вычисляется один раз в `handleSubmitSetup` (ровно то, что ушло в estimate) и используется как есть в `handleConfirmGenerate`, без повторного вывода из сырого `aspectRatio`. Проверено E2E перехватом сетевых запросов — estimate и generate теперь всегда шлют одинаковый aspect_ratio. |
