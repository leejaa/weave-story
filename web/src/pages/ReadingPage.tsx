import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useReading } from '@/features/reading/useReading';
import { buildPages, type ReadingPage as RPage } from '@/features/reading/build-pages';
import { useReadingProgress } from '@/features/reading/useReadingProgress';
import { ChapterRibbon } from '@/components/reading/ChapterRibbon';
import { ReadingPager } from '@/components/reading/ReadingPager';
import { TextPage } from '@/components/reading/TextPage';
import { ChoiceEntryPage } from '@/components/reading/ChoiceEntryPage';
import { ChoicePage } from '@/components/reading/ChoicePage';
import { InterventionPage } from '@/components/reading/InterventionPage';
import { GeneratingPage } from '@/components/reading/GeneratingPage';
import { ChapterErrorPage } from '@/components/reading/ChapterErrorPage';
import { EndPage } from '@/components/reading/EndPage';
import { BookFlip } from '@/components/reading/BookFlip';
import styles from './ReadingPage.module.css';

export function ReadingPage() {
  const navigate = useNavigate();
  const { threadId = '' } = useParams();
  const { thread, isLoading, choosing, retrying, choose, retry } = useReading(threadId);
  const { getRestoredOnce, save } = useReadingProgress(threadId);

  const observerRef = useRef<ResizeObserver | null>(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [targetIndex, setTargetIndex] = useState(0);

  // 콜백 ref: .content 가 (로딩 종료 후) 마운트되는 시점에 측정/관찰을 시작한다.
  // useLayoutEffect([]) 는 로딩 중(.content 미존재) 1회만 돌아 측정이 영영 0으로 남는 문제를 방지.
  const setContentEl = useCallback((el: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!el) return;
    const measure = () => setDims({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    observerRef.current = ro;
  }, []);

  const pages = useMemo(
    () => (thread ? buildPages(thread, dims.width, dims.height) : []),
    [thread, dims.width, dims.height],
  );

  // 자동 이동: 완료 → 끝, 생성중이면 그 페이지, 복귀 시 저장 위치, 아니면 현재 챕터 첫 페이지
  const curChapter = thread?.currentChapter ?? 1;
  const status = thread?.status;
  useEffect(() => {
    // dims.width=0이면 paginate가 챕터를 1페이지로 뭉쳐 잘못된 page count로 실행됨.
    // 실제 dims가 반영된 뒤 한 번만 복원하기 위해 건너뜀.
    if (!pages.length || dims.width === 0) return;
    if (status === 'completed') return setTargetIndex(pages.length - 1);
    const gen = pages.findIndex((p) => p.type === 'generating');
    if (gen >= 0) return setTargetIndex(gen);
    const restored = getRestoredOnce();
    if (restored !== null && restored < pages.length) return setTargetIndex(restored);
    const firstCur = pages.findIndex((p) => p.type === 'text' && p.chapterNumber === curChapter);
    if (firstCur >= 0) setTargetIndex(firstCur);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curChapter, status, pages.length]);

  // 현재 보이는 페이지 위치 저장 (뒤로갔다 복귀 시 복원용)
  useEffect(() => {
    save(visibleIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleIndex]);

  if (isLoading || !thread) {
    return <BookFlip fullscreen size={124} />;
  }

  const visiblePage = pages[visibleIndex];
  const ribbonChapter = visiblePage && 'chapterNumber' in visiblePage ? visiblePage.chapterNumber : curChapter;

  const renderPage = (p: RPage, i: number) => {
    switch (p.type) {
      case 'text':
        return <TextPage title={p.title} content={p.content} pageIndex={p.pageIndex} totalPages={p.totalPages} />;
      case 'entry':
        return <ChoiceEntryPage situation={p.situation} question={p.question} onOpen={() => setTargetIndex(i + 1)} />;
      case 'choice':
        return (
          <ChoicePage
            situation={p.situation}
            question={p.question}
            options={p.options}
            choosing={choosing}
            onChoose={(sel) => choose(p.chapterNumber, sel)}
          />
        );
      case 'intervention':
        return <InterventionPage text={p.text} />;
      case 'generating':
        return <GeneratingPage />;
      case 'error':
        return <ChapterErrorPage onRetry={retry} onBack={() => navigate(-1)} retrying={retrying} />;
      case 'end':
        return <EndPage />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.screen}>
      <ChapterRibbon
        title={thread.title ?? '이야기'}
        chapter={ribbonChapter}
        totalChapters={thread.estimatedChapters}
        onBack={() => navigate(-1)}
      />
      <div className={styles.content} ref={setContentEl}>
        {dims.width > 0 && (
          <ReadingPager
            slides={pages.map((p, i) => renderPage(p, i))}
            width={dims.width}
            targetIndex={targetIndex}
            onVisibleChange={setVisibleIndex}
          />
        )}
      </div>
    </div>
  );
}
