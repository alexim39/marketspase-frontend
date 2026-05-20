export const MARKETSPASE_MARKETER_WHATSAPP_MESSAGE =
  "Hello I found your business on MarketSpase and I'm interested in what you offer. Please share more details";

export function normalizeWhatsAppPhone(phoneNumber?: string | null): string {
  return (phoneNumber || '').replace(/\D/g, '');
}

export function buildWhatsAppChatUrl(
  phoneNumber?: string | null,
  message: string = MARKETSPASE_MARKETER_WHATSAPP_MESSAGE
): string {
  const normalizedPhone = normalizeWhatsAppPhone(phoneNumber);

  if (!normalizedPhone) {
    return '';
  }

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}
