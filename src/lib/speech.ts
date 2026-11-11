import { CONFIDENCE_LABEL, type ScanResult } from './scan';

// Ghép các trường JSON thành vài câu ngắn để đọc to. App tự ghép, AI không viết câu đọc.
export function buildSpeech(r: ScanResult): string {
  if (!r.isMedicine) {
    return 'Đây có vẻ không phải hộp thuốc. Bác hãy chụp lại, gần hơn và đủ sáng.';
  }

  const parts: string[] = [];
  if (r.name) parts.push(`Thuốc này là ${r.name}.`);
  if (r.purpose) parts.push(`Công dụng: ${r.purpose}`);
  if (r.howToUse) parts.push(`Cách dùng: ${r.howToUse}`);
  if (r.cautions.length > 0) parts.push(`Cần lưu ý: ${r.cautions.join(' ')}`);
  parts.push(`Mức chắc chắn: ${CONFIDENCE_LABEL[r.confidence]}.`);
  if (r.askPharmacist) {
    parts.push('Máy chưa chắc chắn. Bác hãy hỏi dược sĩ hoặc bác sĩ trước khi uống.');
  }
  parts.push('Ứng dụng không thay thế bác sĩ.');
  return parts.join(' ');
}