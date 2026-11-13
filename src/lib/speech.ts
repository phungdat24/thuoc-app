import { CONFIDENCE_LABEL, type ScanResult } from './scan';

// Đổi ký hiệu thành chữ để giọng tiếng Việt đọc nghe được (500mg, 5ml, 2 lần/ngày...).
// Lookahead (?![\p{L}\d]) để không nuốt nhầm chữ khác, ví dụ "5 gói" không bị đổi thành "5 gam".
export function normalizeForSpeech(text: string): string {
  return text
    .replace(/(\d)\s*mcg(?![\p{L}\d])/giu, '$1 mi-crô-gam')
    .replace(/(\d)\s*µg(?![\p{L}\d])/giu, '$1 mi-crô-gam')
    .replace(/(\d)\s*mg(?![\p{L}\d])/giu, '$1 mi-li-gam')
    .replace(/(\d)\s*ml(?![\p{L}\d])/giu, '$1 mi-li-lít')
    .replace(/(\d)\s*g(?![\p{L}\d])/giu, '$1 gam')
    .replace(/(\d)\s*UI(?![\p{L}\d])/gu, '$1 đơn vị quốc tế')
    .replace(/(\d)\s*[-–]\s*(\d+)(?=\s*(?:giờ|lần|ngày|viên|phút|tuổi|tháng|tuần))/giu, '$1 đến $2')
    .replace(/\s+[x×]\s*(?=\d)/giu, ', ')
    .replace(/\s*\/\s*ngày/giu, ' mỗi ngày')
    .replace(/\s*\/\s*lần/giu, ' mỗi lần')
    .replace(/\s+/g, ' ')
    .trim();
}

// Ghép các trường JSON thành vài câu ngắn để đọc to. App tự ghép, AI không viết câu đọc.
export function buildSpeech(r: ScanResult): string {
  if (!r.isMedicine) {
    return 'Đây có vẻ không phải hộp thuốc. Bác hãy chụp lại, gần hơn và đủ sáng.';
  }

  // Không đọc được gì: nói một câu ngắn, không đọc lặp nhiều lần.
  if (r.confidence === 'low' && !r.name.trim()) {
    return 'Máy chưa đọc rõ hộp thuốc. Bác hãy chụp lại, gần hơn và đủ sáng, hoặc hỏi dược sĩ hay bác sĩ. Ứng dụng không thay thế bác sĩ.';
  }

  const parts: string[] = [];
  if (r.name) parts.push(`Thuốc này là ${normalizeForSpeech(r.name)}.`);
  if (r.purpose) parts.push(`Công dụng: ${normalizeForSpeech(r.purpose)}`);
  if (r.howToUse) parts.push(`Cách dùng: ${normalizeForSpeech(r.howToUse)}`);

  // Câu "không thay thế bác sĩ" đã được đọc ở cuối, bỏ bản trùng từ server.
  const cautions = r.cautions.filter((c) => !/không thay thế/i.test(c));
  if (cautions.length > 0) parts.push(`Cần lưu ý: ${normalizeForSpeech(cautions.join(' '))}`);

  parts.push(`Mức chắc chắn: ${CONFIDENCE_LABEL[r.confidence]}.`);
  if (r.askPharmacist) {
    parts.push('Máy chưa chắc chắn. Bác hãy hỏi dược sĩ hoặc bác sĩ trước khi uống.');
  }
  parts.push('Ứng dụng không thay thế bác sĩ.');
  return parts.join(' ');
}