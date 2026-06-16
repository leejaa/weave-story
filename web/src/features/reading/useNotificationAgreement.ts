import { useState } from 'react';
import { requestNotificationAgreement } from '@apps-in-toss/web-framework';

const STORAGE_KEY = 'weave_notify_agreed';
const AGREEMENT_CODE = import.meta.env.VITE_TOSS_NOTIFY_AGREEMENT_CODE ?? '2620';

export function useNotificationAgreement() {
  const [agreed, setAgreed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [requesting, setRequesting] = useState(false);

  const request = () => {
    if (agreed || requesting) return;
    setRequesting(true);
    const cleanup = requestNotificationAgreement({
      options: { templateCode: AGREEMENT_CODE },
      onEvent: ({ type }) => {
        if (type === 'newAgreement' || type === 'alreadyAgreed') {
          try { localStorage.setItem(STORAGE_KEY, 'true'); } catch { /* ignore */ }
          setAgreed(true);
        }
        setRequesting(false);
        cleanup();
      },
      onError: () => {
        setRequesting(false);
        cleanup();
      },
    });
  };

  return { agreed, requesting, request };
}
