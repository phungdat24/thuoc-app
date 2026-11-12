import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset } from '@/constants/theme';
import { prepareImage } from '@/lib/image';
import { CONFIDENCE_LABEL, scanImage, type Confidence, type ScanResult } from '@/lib/scan';
import { buildSpeech } from '@/lib/speech';

type Status = 'idle' | 'loading' | 'done' | 'error';

const CONFIDENCE_STYLE: Record<Confidence, { bg: string; fg: string; icon: string }> = {
  high: { bg: '#DDF3E6', fg: '#0B5A33', icon: '✓' },
  medium: { bg: '#FFF1CC', fg: '#7A4B00', icon: '!' },
  low: { bg: '#FBE0DE', fg: '#9B1C1C', icon: '?' },
};

export default function HomeScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [viVoiceMissing, setViVoiceMissing] = useState(false);

  // Kiểm tra máy Android có giọng đọc tiếng Việt chưa; dừng đọc khi rời màn hình.
  useEffect(() => {
    Speech.getAvailableVoicesAsync()
      .then((voices) => {
        const hasVietnamese = voices.some((v) => v.language?.toLowerCase().startsWith('vi'));
        if (voices.length > 0 && !hasVietnamese) setViVoiceMissing(true);
      })
      .catch(() => {});
    return () => {
      Speech.stop();
    };
  }, []);
const speak = (data: ScanResult) => {
  Speech.stop();
  Speech.speak(buildSpeech(data), {
    language: 'vi-VN',
    rate: 0.85,
    onStart: () => setSpeaking(true),
    onDone: () => setSpeaking(false),
    onStopped: () => setSpeaking(false),
    onError: (e) => {
      console.log('Speech error:', e);
      setSpeaking(false);
    },
  });
};
  const stopSpeaking = () => {
    Speech.stop();
    setSpeaking(false);
  };

  const processAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    stopSpeaking();
    setResult(null);
    setErrorMessage('');
    setStatus('loading');
    try {
      const prepared = await prepareImage(asset.uri, asset.width);
      setImageUri(prepared.uri);
      const outcome = await scanImage(prepared.base64);
      setResult(outcome.result);
      setIsMock(outcome.isMock);
      setStatus('done');
      speak(outcome.result); // Tự đọc ngay khi có kết quả
    } catch (error: any) {
      console.error('Lỗi xử lý ảnh', error);
      setErrorMessage(
        error?.name === 'AbortError'
          ? 'Máy chủ phản hồi quá lâu. Hãy kiểm tra mạng rồi thử lại.'
          : 'Không đọc được hộp thuốc. Hãy chụp lại, gần hơn và đủ sáng.'
      );
      setStatus('error');
    }
  };

  const takePhoto = async () => {
    setPermissionDenied(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setPermissionDenied(true);
      return;
    }
    const picked = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!picked.canceled) processAsset(picked.assets[0]);
  };

  const pickImage = async () => {
    setPermissionDenied(false);
    const picked = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!picked.canceled) processAsset(picked.assets[0]);
  };

  const loading = status === 'loading';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Đọc Thuốc</Text>
        <Text style={styles.subtitle}>Chụp hộp thuốc, máy sẽ đọc to cho bác nghe.</Text>

        <Pressable
          style={({ pressed }) => [styles.btn, styles.btnMain, pressed && styles.pressed, loading && styles.disabled]}
          onPress={takePhoto}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Chụp hộp thuốc">
          <Text style={styles.btnText}>Chụp hộp thuốc</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.btn, styles.btnSecondary, pressed && styles.pressed, loading && styles.disabled]}
          onPress={pickImage}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Chọn ảnh có sẵn trong máy">
          <Text style={styles.btnSecondaryText}>Chọn ảnh có sẵn</Text>
        </Pressable>

        {permissionDenied && (
          <Text style={styles.errorText}>
            Cần cho phép dùng camera. Vào Cài đặt của máy, chọn ứng dụng này, rồi bật quyền Camera.
          </Text>
        )}

        {status === 'idle' && (
          <Text style={styles.hint}>
            Đặt hộp thuốc ở nơi đủ sáng. Chụp gần, thấy rõ chữ trên hộp.
          </Text>
        )}

        {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#0B6B58" />
            <Text style={styles.loadingText}>Đang đọc hộp thuốc…</Text>
          </View>
        )}

        {status === 'error' && <Text style={styles.errorText}>{errorMessage}</Text>}

        {status === 'done' && result && (
          <View style={styles.card}>
            {isMock && (
              <Text style={styles.mockBadge}>Dữ liệu mẫu, chưa gọi AI thật</Text>
            )}

            {!result.isMedicine ? (
              <Text style={styles.value}>
                Đây có vẻ không phải hộp thuốc. Bác hãy chụp lại, gần hơn và đủ sáng.
              </Text>
            ) : (
              <>
                <Text style={styles.label}>Tên thuốc</Text>
                <Text style={styles.value}>{result.name || 'Chưa đọc rõ'}</Text>

                {!!result.purpose && (
                  <>
                    <Text style={styles.label}>Thuốc này để làm gì</Text>
                    <Text style={styles.value}>{result.purpose}</Text>
                  </>
                )}

                {!!result.howToUse && (
                  <>
                    <Text style={styles.label}>Cách dùng</Text>
                    <Text style={styles.value}>{result.howToUse}</Text>
                  </>
                )}

                {result.cautions.length > 0 && (
                  <>
                    <Text style={styles.label}>Cần tránh, cần lưu ý</Text>
                    {result.cautions.map((c, i) => (
                      <Text key={i} style={styles.value}>
                        • {c}
                      </Text>
                    ))}
                  </>
                )}

                <View
                  style={[
                    styles.badge,
                    { backgroundColor: CONFIDENCE_STYLE[result.confidence].bg },
                  ]}>
                  <Text style={[styles.badgeText, { color: CONFIDENCE_STYLE[result.confidence].fg }]}>
                    {CONFIDENCE_STYLE[result.confidence].icon} Mức chắc chắn:{' '}
                    {CONFIDENCE_LABEL[result.confidence]}
                  </Text>
                </View>

                {result.askPharmacist && (
                  <View style={styles.askBox}>
                    <Text style={styles.askText}>
                      Máy chưa chắc chắn. Hãy hỏi dược sĩ hoặc bác sĩ trước khi uống.
                    </Text>
                  </View>
                )}
              </>
            )}

            <View style={styles.speechRow}>
              {speaking ? (
                <Pressable
                  style={({ pressed }) => [styles.btn, styles.btnStop, pressed && styles.pressed]}
                  onPress={stopSpeaking}
                  accessibilityRole="button">
                  <Text style={styles.btnText}>Dừng đọc</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={({ pressed }) => [styles.btn, styles.btnMain, pressed && styles.pressed]}
                  onPress={() => speak(result)}
                  accessibilityRole="button">
                  <Text style={styles.btnText}>Đọc lại</Text>
                </Pressable>
              )}
            </View>

            {viVoiceMissing && (
              <Text style={styles.voiceNote}>
                Máy chưa có giọng đọc tiếng Việt. Vào Cài đặt, tìm "Chuyển văn bản thành giọng nói", rồi tải giọng tiếng Việt.
              </Text>
            )}

            <Text style={styles.footer}>Ứng dụng không thay thế bác sĩ hay dược sĩ.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const INK = '#10231F';
const GREEN = '#0B6B58';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F7F6' },
  content: {
    padding: 20,
    paddingBottom: BottomTabInset + 32,
    alignItems: 'center',
    gap: 14,
  },
  title: { color: INK, fontSize: 34, fontWeight: '800', marginTop: 8 },
  subtitle: { color: '#3C514C', fontSize: 20, lineHeight: 28, textAlign: 'center' },
  hint: { color: '#3C514C', fontSize: 18, lineHeight: 26, textAlign: 'center' },

  btn: {
    width: '100%',
    maxWidth: 520,
    minHeight: 72,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  btnMain: { backgroundColor: GREEN },
  btnSecondary: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: GREEN },
  btnStop: { backgroundColor: '#A32020' },
  btnText: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  btnSecondaryText: { color: GREEN, fontSize: 22, fontWeight: '700' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },

  errorText: { color: '#9B1C1C', fontSize: 20, lineHeight: 28, fontWeight: '700', textAlign: 'center' },
  image: { width: '100%', maxWidth: 520, height: 240, borderRadius: 16, resizeMode: 'contain', backgroundColor: '#E1EAE8' },
  loadingBox: { alignItems: 'center', gap: 10, paddingVertical: 16 },
  loadingText: { color: INK, fontSize: 20, fontWeight: '600' },

  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#C9D8D4',
    padding: 20,
    gap: 4,
  },
  mockBadge: { color: '#7A4B00', backgroundColor: '#FFF1CC', fontSize: 16, fontWeight: '700', padding: 8, borderRadius: 8, marginBottom: 8, alignSelf: 'flex-start' },
  label: { color: '#3C514C', fontSize: 18, fontWeight: '700', marginTop: 14 },
  value: { color: INK, fontSize: 24, lineHeight: 33, fontWeight: '600' },

  badge: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginTop: 18 },
  badgeText: { fontSize: 20, fontWeight: '800' },
  askBox: { backgroundColor: '#FFF1CC', borderRadius: 12, padding: 14, marginTop: 12 },
  askText: { color: '#7A4B00', fontSize: 20, lineHeight: 28, fontWeight: '700' },

  speechRow: { marginTop: 20, alignItems: 'center' },
  voiceNote: { color: '#7A4B00', fontSize: 16, lineHeight: 23, marginTop: 12 },
  footer: { color: '#3C514C', fontSize: 16, textAlign: 'center', marginTop: 18 },
});