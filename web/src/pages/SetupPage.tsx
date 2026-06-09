import { useLocation, useNavigate } from 'react-router-dom';
import { MEDIA } from '@/lib/media';
import { SETUP_COPY } from '@/features/setup/copy';
import { useStorySetup } from '@/features/setup/useStorySetup';
import { SetupHeader } from '@/components/setup/SetupHeader';
import { PromptInput } from '@/components/setup/PromptInput';
import { SubmitButton } from '@/components/setup/SubmitButton';
import { WritingOverlay } from '@/components/setup/WritingOverlay';
import styles from './SetupPage.module.css';

type SetupState = { prompt?: string };

/** 스토리 셋업 — 프롬프트 입력 후 첫 챕터 생성 (story-prompt-screen.tsx 대응). */
export function SetupPage() {
  const navigate = useNavigate();
  const initial = ((useLocation().state ?? {}) as SetupState).prompt ?? '';
  const { prompt, setPrompt, canSubmit, isPending, error, submit } = useStorySetup(initial);

  return (
    <div className={styles.container}>
      <div className={styles.bg} aria-hidden>
        <img className={styles.bgImg} src={MEDIA.setupBg} alt="" />
        <div className={styles.warmWash} />
        <div className={styles.readabilityWash} />
      </div>
      <SetupHeader onBack={() => navigate('/')} />

      <div className={styles.scroll}>
        <div className={styles.intro}>
          <h1 className={styles.headline}>{SETUP_COPY.headline}</h1>
          <p className={styles.subtext}>{SETUP_COPY.subtext}</p>
        </div>

        <div className={styles.writingGroup}>
          <PromptInput value={prompt} placeholder={SETUP_COPY.placeholder} onChange={setPrompt} />

          <p className={styles.hint}>{SETUP_COPY.hint}</p>

          {error && <div className={styles.errorBox}>{error}</div>}

          <SubmitButton
            label={SETUP_COPY.startBtn}
            pendingLabel={SETUP_COPY.preparingBtn}
            canSubmit={canSubmit}
            isPending={isPending}
            onPress={submit}
          />
        </div>
      </div>

      {isPending && <WritingOverlay title={SETUP_COPY.loadingTitle} subtitle={SETUP_COPY.loadingSubtitle} />}
    </div>
  );
}
