import styles from './TextPage.module.css';

type Props = {
  title: string | null;
  content: string;
  pageIndex: number;
  totalPages: number;
};

/** 챕터 본문 한 페이지 (text-page.tsx 대응). 첫 페이지에 챕터 제목 + 드롭캡. */
export function TextPage({ title, content, pageIndex, totalPages }: Props) {
  const isFirst = pageIndex === 0;
  const paragraphs = content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className={styles.page}>
      <div className={styles.scroll}>
        {isFirst && title && <div className={styles.chapterTitle}>{title}</div>}
        <div className={styles.prose}>
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
      <div className={styles.pageNum}>{pageIndex + 1} / {totalPages}</div>
    </div>
  );
}
