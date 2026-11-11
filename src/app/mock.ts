export interface PrescriptionData {
  medicineName: string;
  usage: string;
  warnings: string;
  confidence: 'Chắc chắn' | 'Khá chắc' | 'Không chắc';
}

export const mockResult: PrescriptionData = {
  medicineName: "Calcium ZINDO 500mg",
  usage: "Uống 1 viên vào buổi sáng sau khi ăn.",
  warnings: "Không uống cùng sữa hoặc sắt. Cẩn trọng với người bị sỏi thận.",
  confidence: "Chắc chắn"
};