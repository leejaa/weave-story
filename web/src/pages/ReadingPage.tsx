import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useReading } from '@/features/reading/useReading';
import { buildPages, type ReadingPage as RPage } from '@/features/reading/build-pages';
import { ChapterRibbon } from '@/components/reading/ChapterRibbon';
import { ReadingPager } from '@/components/reading/ReadingPager';
import { TextPage } from '@/components/reading/TextPage';
import { ChoicePage } from '@/components/reading/ChoicePage';
import { GeneratingPage } from '@/components/reading/GeneratingPage';
import { EndPage } from '@/components/reading/EndPage';
import { Spinner } from '@/components/ui';
import styles from './ReadingPage.module.css';

export function ReadingPage() {
  const navigate = useNavigate();
  const { threadId = '' } = useParams();
  const { thread, isLoading, choosing, choose } = useReading(threadId);

  const contentRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [targetIndex, setTargetIndex] = useState(0);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const measure = () => setDims({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pages = useMemo(
    () => (thread ? buildPages(thread, dims.width, dims.height) : []),
    [thread, dims.width, dims.height],
  );

  // 자동 이동: 완료 → 끝, 생성중이면 그 페이지, 아니면 현재 챕터 첫 페이지
  const curChapter = thread?.currentChapter ?? 1;
  const status = thread?.status;
  useEffect(() => {
    if (!pages.length) return;
    if (status === 'completed') return setTargetIndex(pages.length - 1);
    const gen = pages.findIndex((p) => p.type === 'generating');
    if (gen >= 0) return setTargetIndex(gen);
    const firstCur = pages.findIndex((p) => p.type === 'text' && p.chapterNumber === curChapter);
    if (firstCur >= 0) setTargetIndex(firstCur);
  }, [curChapter, status, pages.length]);

  if (isLoading || !thread) {
    return <div className={styles.loading}><Spinner size={28} tone="thread" /></div>;
  }

  const visiblePage = pages[visibleIndex];
  const ribbonChapter = visiblePage && 'chapterNumber' in visiblePage ? visiblePage.chapterNumber : curChapter;

  const renderPage = (p: RPage) => {
    switch (p.type) {
      case 'text':
        return <TextPage title={p.title} content={p.content} pageIndex={p.pageIndex} totalPages={p.totalPages} />;
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
      case 'generating':
        return <GeneratingPage />;
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
      <div className={styles.content} ref={contentRef}>
        {dims.width > 0 && (
          <ReadingPager
            slides={pages.map(renderPage)}
            width={dims.width}
            targetIndex={targetIndex}
            onVisibleChange={setVisibleIndex}
          />
        )}
      </div>
    </div>
  );
}
