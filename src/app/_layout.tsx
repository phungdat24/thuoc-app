import { Stack } from 'expo-router';

// Chỉ một màn hình, không có thanh tab. Đã bỏ tab Explore và lớp splash mẫu của Expo.
export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}