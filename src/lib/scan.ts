// Kiểu dữ liệu và hàm gọi server. Khớp đúng "hợp đồng API" của đội.
// Ngày 2: chỉ cần đặt EXPO_PUBLIC_API_URL (và EXPO_PUBLIC_APP_KEY) là app tự gọi server thật.

export type Confidence = 'high' | 'medium' | 'low';

export interface ScanResult {
  isMedicine: boolean;
  name: string;
  purpose: string;
  howToUse: string;
  cautions: string[];
  confidence: Confidence;
  askPharmacist: boolean;
}

export interface ScanOutcome {
  result: ScanResult;
  isMock: boolean;
}

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  high: 'Chắc chắn',
  medium: 'Khá chắc',
  low: 'Không chắc',
};

// ---- Dữ liệu mẫu: chỉ dùng khi chưa có địa chỉ server. Mỗi lần chụp đổi sang tình huống kế tiếp. ----
const MOCKS: ScanResult[] = [
  {
    isMedicine: true,
    name: 'Calcium ZINDO 500mg',
    purpose: 'Bổ sung canxi.',
    howToUse: 'Theo hộp: uống 1 viên vào buổi sáng, sau khi ăn.',
    cautions: ['Không uống cùng sữa hoặc sắt.', 'Hỏi bác sĩ nếu bị sỏi thận.'],
    confidence: 'high',
    askPharmacist: false,
  },
  {
    isMedicine: true,
    name: 'Paracetamol 500mg',
    purpose: 'Giảm đau, hạ sốt.',
    howToUse: 'Theo hộp: uống 1 viên mỗi lần, cách nhau ít nhất 4 đến 6 giờ.',
    cautions: ['Không uống quá liều ghi trên hộp.', 'Hỏi bác sĩ nếu đang có bệnh gan.'],
    confidence: 'medium',
    askPharmacist: false,
  },
  {
    isMedicine: true,
    name: 'Chưa đọc rõ tên thuốc',
    purpose: '',
    howToUse: '',
    cautions: [],
    confidence: 'low',
    askPharmacist: true,
  },
  {
    isMedicine: false,
    name: '',
    purpose: '',
    howToUse: '',
    cautions: [],
    confidence: 'low',
    askPharmacist: false,
  },
];
let mockIndex = 0;

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const APP_KEY = process.env.EXPO_PUBLIC_APP_KEY ?? '';
const TIMEOUT_MS = 30000;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Chấp nhận mọi thứ server trả về, nhưng luôn đưa về đúng kiểu để giao diện không bị crash.
function normalize(raw: any): ScanResult {
  const confidence: Confidence =
    raw?.confidence === 'high' || raw?.confidence === 'medium' ? raw.confidence : 'low';
  return {
    isMedicine: raw?.isMedicine !== false,
    name: String(raw?.name ?? ''),
    purpose: String(raw?.purpose ?? ''),
    howToUse: String(raw?.howToUse ?? ''),
    cautions: Array.isArray(raw?.cautions) ? raw.cautions.map((c: unknown) => String(c)) : [],
    confidence,
    askPharmacist: Boolean(raw?.askPharmacist) || confidence === 'low',
  };
}

export async function scanImage(imageBase64: string): Promise<ScanOutcome> {
  if (!API_URL) {
    await sleep(1200);
    const result = MOCKS[mockIndex % MOCKS.length];
    mockIndex += 1;
    return { result, isMock: true };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}/api/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-app-key': APP_KEY },
      body: JSON.stringify({ imageBase64, mimeType: 'image/jpeg', language: 'vi' }),
      signal: controller.signal,
    });
    if (!res.ok) {
  const body = await res.text().catch(() => '');
  console.log('Server error', res.status, body.slice(0, 500));
  throw new Error(`Máy chủ trả về lỗi ${res.status}`);
  }
    const data = await res.json();
    return { result: normalize(data), isMock: false };
  } finally {
    clearTimeout(timer);
  }
}