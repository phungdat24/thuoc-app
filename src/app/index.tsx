import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { mockResult, PrescriptionData } from './mock';

export default function HomeScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<PrescriptionData | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const processImage = async (uri: string) => {
    try {
      // Bước 4: Nén ảnh về rộng 1280px, định dạng JPEG, chất lượng 0.7
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1280 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      
      if (manipResult.base64) {
        // Tính xấp xỉ dung lượng base64 ra MB
        const sizeMB = (manipResult.base64.length * 0.75) / (1024 * 1024);
        console.log(`Dung lượng base64 sau nén: ${sizeMB.toFixed(2)} MB`);
      }
      
      setImageUri(manipResult.uri);
      setResult(mockResult); // Bước 5: Hiện dữ liệu giả định mẫu
    } catch (error) {
      console.error("Lỗi nén ảnh", error);
    }
  };

  // Bước 3: Hàm chụp ảnh từ Camera
  const takePhoto = async () => {
    setPermissionDenied(false);
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      setPermissionDenied(true);
      return;
    }
    const pickerResult = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!pickerResult.canceled) processImage(pickerResult.assets[0].uri);
  };

  // Bước 3: Hàm chọn ảnh từ thư viện máy tính/điện thoại để test nhanh
  const pickImage = async () => {
    setPermissionDenied(false);
    const pickerResult = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!pickerResult.canceled) processImage(pickerResult.assets[0].uri);
  };

  // Bước 6: Hàm ghép chuỗi văn bản để đọc to
  const buildSpeech = (data: PrescriptionData) => {
    return `Tên thuốc là ${data.medicineName}. Cách dùng: ${data.usage}. Cần tránh: ${data.warnings}. Độ tin cậy của phân tích là ${data.confidence}.`;
  };

  const speakText = () => {
    if (result) Speech.speak(buildSpeech(result), { language: 'vi-VN' });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.appTitle}>💊 MedAssistant - Vai trò B</Text>

      <TouchableOpacity style={styles.buttonMain} onPress={takePhoto}>
        <Text style={styles.buttonText}>📸 Chụp hộp thuốc</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.buttonSecondary} onPress={pickImage}>
        <Text style={styles.buttonText}>🖼️ Chọn ảnh từ thư viện</Text>
      </TouchableOpacity>

      {permissionDenied && (
        <Text style={styles.errorText}>
          Ứng dụng cần quyền truy cập Camera. Vui lòng cấp quyền!
        </Text>
      )}

      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}

      {/* Bước 5: Giao diện kết quả chữ lớn, tương phản cao */}
      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.label}>💊 Thuốc này để làm gì:</Text>
          <Text style={styles.value}>{result.medicineName}</Text>

          <Text style={styles.label}>🕒 Cách dùng:</Text>
          <Text style={styles.value}>{result.usage}</Text>

          <Text style={styles.label}>⚠️ Cần tránh:</Text>
          <Text style={styles.value}>{result.warnings}</Text>

          <Text style={styles.label}>✅ Mức chắc chắn:</Text>
          <Text style={styles.value}>{result.confidence}</Text>

          <div style={{ width: '100%' }}>
            <TouchableOpacity style={styles.buttonSpeech} onPress={speakText}>
              <Text style={styles.buttonText}>🔊 Đọc lại kết quả</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonStop} onPress={() => Speech.stop()}>
              <Text style={styles.buttonText}>⏹️ Dừng đọc</Text>
            </TouchableOpacity>
          </div>

          <Text style={styles.warningFooter}>
            Ứng dụng không thay thế bác sĩ hay dược sĩ.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#0f172a', padding: 20, paddingTop: 40, alignItems: 'center' },
  appTitle: { color: '#38bdf8', fontSize: 26, fontWeight: 'bold', marginBottom: 20 },
  buttonMain: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 12, width: '100%', maxWidth: 500, alignItems: 'center', marginBottom: 12 },
  buttonSecondary: { backgroundColor: '#475569', padding: 16, borderRadius: 12, width: '100%', maxWidth: 500, alignItems: 'center', marginBottom: 20 },
  buttonSpeech: { backgroundColor: '#10b981', padding: 14, borderRadius: 8, width: '100%', alignItems: 'center', marginVertical: 8 },
  buttonStop: { backgroundColor: '#ef4444', padding: 14, borderRadius: 8, width: '100%', alignItems: 'center', marginBottom: 10 },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  errorText: { color: '#f87171', fontSize: 18, textAlign: 'center', marginVertical: 15, fontWeight: 'bold' },
  image: { width: '100%', maxWidth: 500, height: 280, borderRadius: 12, resizeMode: 'contain', marginBottom: 20 },
  resultCard: { backgroundColor: '#1e293b', width: '100%', maxWidth: 500, padding: 20, borderRadius: 12, borderColor: '#334155', borderWidth: 2, alignItems: 'flex-start' },
  label: { color: '#94a3b8', fontSize: 16, marginTop: 12, fontWeight: 'bold' },
  value: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', lineHeight: 28, marginBottom: 4 },
  warningFooter: { color: '#facc15', fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginTop: 20, width: '100%' },
});