import { Platform } from 'react-native';

// 스토어 다운로드 링크. 공유 메시지에 동봉해 추천(referral) 유입 경로로 사용.
export const APP_STORE_URL = 'https://apps.apple.com/app/id6771166873';
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.leejahun.weavestory';

/** 현재 플랫폼에 맞는 스토어 링크(웹/기타는 App Store로 폴백). */
export function appStoreLink(): string {
  return Platform.OS === 'android' ? PLAY_STORE_URL : APP_STORE_URL;
}
