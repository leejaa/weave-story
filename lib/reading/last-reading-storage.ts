import AsyncStorage from '@react-native-async-storage/async-storage';

// "지금 리더 화면에 머물러 있는" 스레드를 기록한다. 리더에 진입하면 set, 정상적으로
// 화면을 떠나면(뒤로가기 등) clear 한다. 백그라운드 전환에서는 clear 되지 않으므로,
// 앱이 리더 상태로 OS에 의해 종료되면 이 값이 남아 다음 콜드 스타트에서 그 스레드로
// 자동 복귀(이어읽기)하는 데 쓰인다. 페이지 단위 위치는 reading-position-storage 가 담당.
const STORAGE_KEY = 'weave:active-reading-thread';

export async function getActiveReadingThreadId(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEY);
}

export async function setActiveReadingThreadId(threadId: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, threadId);
}

export async function clearActiveReadingThreadId(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
