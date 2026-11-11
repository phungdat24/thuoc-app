import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const MAX_WIDTH = 1280;

export interface PreparedImage {
  uri: string;
  base64: string;
}

// Thu nhỏ ảnh về tối đa 1280 px chiều rộng, JPEG chất lượng 0.7, lấy base64 để gửi server.
// Dùng API mới (manipulate / renderAsync / saveAsync); manipulateAsync đã bị đánh dấu lỗi thời.
export async function prepareImage(uri: string, originalWidth?: number): Promise<PreparedImage> {
  const context = ImageManipulator.manipulate(uri);
  // Chỉ thu nhỏ, không phóng to ảnh nhỏ hơn 1280 px.
  if (!originalWidth || originalWidth > MAX_WIDTH) {
    context.resize({ width: MAX_WIDTH });
  }
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.7,
    base64: true,
  });

  if (!saved.base64) throw new Error('Không đọc được dữ liệu ảnh.');

  const sizeMB = (saved.base64.length * 0.75) / (1024 * 1024);
  console.log(`Dung lượng ảnh sau nén: ${sizeMB.toFixed(2)} MB`);

  return { uri: saved.uri, base64: saved.base64 };
}