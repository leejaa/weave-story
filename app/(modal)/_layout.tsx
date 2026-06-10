import { Stack } from 'expo-router';

// 별도 모달 스택 — 카드 확대 전환 후 book-preview가 이 스택에서 열림
export default function ModalStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
