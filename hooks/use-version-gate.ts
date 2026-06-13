import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import * as Application from 'expo-application';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchAppConfig, type PlatformConfig } from '@/lib/version-gate/api';
import { compareVersions } from '@/lib/version-gate/compare';

export type GateStatus = 'loading' | 'ok' | 'force' | 'recommended';

const SNOOZE_KEY = 'update_snooze_version';

/**
 * 강제/권장 업데이트 게이트.
 * - 네이티브 설치 버전(Application.nativeApplicationVersion)을 서버 설정과 비교.
 * - current < minSupported → 'force'(차단). minSupported ≤ current < latest → 'recommended'(스누즈 가능).
 * - 설정/버전 조회 실패 시 'ok'로 fail-open(백엔드 장애로 유저를 잠그지 않는다).
 * - 포그라운드 복귀(AppState active) 시 재평가.
 */
export function useVersionGate() {
  const [status, setStatus] = useState<GateStatus>('loading');
  const [config, setConfig] = useState<PlatformConfig | null>(null);

  const evaluate = useCallback(async () => {
    const current = Application.nativeApplicationVersion;
    const platform = Platform.OS === 'android' ? 'android' : 'ios';
    const cfg = await fetchAppConfig();
    const pc = cfg?.[platform] ?? null;
    setConfig(pc);

    if (!current || !pc) {
      setStatus('ok'); // fail-open
      return;
    }
    if (compareVersions(current, pc.minSupported) < 0) {
      setStatus('force');
      return;
    }
    if (compareVersions(current, pc.latest) < 0) {
      const snoozed = await AsyncStorage.getItem(SNOOZE_KEY).catch(() => null);
      setStatus(snoozed === pc.latest ? 'ok' : 'recommended');
      return;
    }
    setStatus('ok');
  }, []);

  useEffect(() => {
    void evaluate();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void evaluate();
    });
    return () => sub.remove();
  }, [evaluate]);

  // 권장 업데이트를 이번 latest 버전에 대해 스누즈(다음 새 버전 전까지 다시 안 띄움).
  const dismissRecommended = useCallback(async () => {
    if (config?.latest) {
      await AsyncStorage.setItem(SNOOZE_KEY, config.latest).catch(() => {});
    }
    setStatus('ok');
  }, [config]);

  return { status, storeUrl: config?.storeUrl ?? null, dismissRecommended };
}
