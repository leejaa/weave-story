import { useState } from 'react';
import type { ChapterOption } from '@/lib/types';
import type { ChoiceSelection } from '@/features/reading/api';
import { READING_COPY } from '@/features/reading/copy';
import { Spinner } from '@/components/ui';
import styles from './ChoicePage.module.css';

type Props = {
  situation: string | null;
  question: string | null;
  options: ChapterOption[];
  choosing: boolean;
  onChoose: (selection: ChoiceSelection) => void;
};

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');
const marker = (i: number) => String.fromCharCode(65 + i); // A, B, C

/** 챕터 끝 결정 화면 (choice-page.tsx 대응). */
export function ChoicePage({ situation, question, options, choosing, onChoose }: Props) {
  // 'choices': A·B·직접입력 버튼 / 'input': 직접입력란만 크게 확장.
  const [mode, setMode] = useState<'choices' | 'input'>('choices');
  const [selected, setSelected] = useState<number | null>(null);
  const [custom, setCustom] = useState('');

  const hasCustom = custom.trim().length > 0;
  const canConfirm = (mode === 'input' ? hasCustom : selected !== null) && !choosing;

  const enterInput = () => {
    setSelected(null);
    setMode('input');
  };

  const confirm = () => {
    if (!canConfirm) return;
    onChoose(mode === 'input' ? { customInput: custom.trim() } : { choiceIndex: selected! });
  };

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        {situation && <p className={styles.situation}>{situation}</p>}
        <h2 className={styles.question}>{question || READING_COPY.choice.defaultQuestion}</h2>
      </div>

      {mode === 'choices' ? (
        <div className={styles.choices}>
          {options.map((opt) => {
            const isSel = selected === opt.index;
            const faded = selected !== null && !isSel;
            return (
              <button
                key={opt.index}
                className={cx(styles.tile, isSel && styles.tileSel, faded && styles.tileFaded)}
                onClick={() => setSelected(isSel ? null : opt.index)}
              >
                <span className={cx(styles.marker, isSel && styles.markerSel)}>{marker(opt.index)}</span>
                <span className={styles.tileText}>{opt.text}</span>
              </button>
            );
          })}
          <button className={styles.tile} onClick={enterInput}>
            <span className={styles.marker}>✎</span>
            <span className={styles.tileText}>{READING_COPY.choice.customButton}</span>
          </button>
        </div>
      ) : (
        <div className={styles.inputMode}>
          <button className={styles.back} onClick={() => setMode('choices')}>
            ‹ {READING_COPY.choice.backToChoices}
          </button>
          <textarea
            className={cx(styles.input, styles.inputLarge, hasCustom && styles.inputActive)}
            placeholder={READING_COPY.choice.inputPlaceholder}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            autoFocus
          />
        </div>
      )}

      <button className={cx(styles.cta, canConfirm && styles.ctaActive)} disabled={!canConfirm} onClick={confirm}>
        {choosing ? <Spinner size={20} tone="light" /> : READING_COPY.choice.continue}
      </button>
    </div>
  );
}
