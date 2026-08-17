// Понятные русские сообщения для кодов ошибок VibeMarketolog API.

const MESSAGES: Record<string, string> = {
  insufficient_balance: "Недостаточно средств на балансе для этой генерации.",
  email_confirmation_required: "Подтвердите email в личном кабинете VibeMarketolog, чтобы использовать бонусные рубли.",
  media_validation_failed: "Не удалось проверить входные изображения — проверьте ссылки и попробуйте снова.",
  daily_spend_limit_exceeded: "Достигнут дневной лимит расходов по токену. Попробуйте позже.",
  idempotency_key_conflict: "Конфликт idempotency-ключа: запрос с этим ключом уже выполнялся с другими параметрами.",
  duplicate_request: "Такой запрос уже выполняется — дождитесь его завершения.",
  generation_failed: "Ошибка на стороне провайдера модели. Средства возвращены на баланс.",
  validation_failed: "Проверьте параметры запроса — часть значений не поддерживается моделью.",
};

export function describeApiError(code: string | undefined, fallback: string): string {
  if (code && MESSAGES[code]) return MESSAGES[code];
  return fallback || "Неизвестная ошибка VibeMarketolog API.";
}
