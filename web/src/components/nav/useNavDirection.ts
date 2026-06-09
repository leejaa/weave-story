import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * 화면 전환 방향 감지.
 * react-router(history)가 history.state.idx 에 스택 깊이를 유지하므로
 * 이전 idx 와 비교해 push(+1)/pop(-1) 를 판정한다. (useNavigationType 의 POP 한계 회피)
 * idx 는 z-index 로도 써서 push 는 새 화면이 위, pop 은 나가는 화면이 위가 되게 한다.
 */
export function useNavDirection() {
  const location = useLocation();
  const idx = (window.history.state?.idx as number | undefined) ?? 0;
  const prevIdx = useRef(idx);
  const dir = idx >= prevIdx.current ? 1 : -1;

  useEffect(() => {
    prevIdx.current = idx;
  }, [idx, location.key]);

  return { dir, idx };
}
