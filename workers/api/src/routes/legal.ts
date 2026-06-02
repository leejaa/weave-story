// Privacy Policy & Terms of Service served as localized HTML (ko/en/ja) from the
// worker so the app and App Store Connect can link to functional URLs.

const SUPPORT_EMAIL = 'leejahun0@gmail.com';
const EFFECTIVE_DATE = '2026-06-02';
const APP_NAME = 'Weave Story';

export type LegalLang = 'ko' | 'en' | 'ja';

export function normalizeLang(input?: string | null): LegalLang {
  const l = (input ?? '').slice(0, 2).toLowerCase();
  return l === 'en' || l === 'ja' ? l : 'ko';
}

const CONTACT_LABEL: Record<LegalLang, string> = {
  ko: '문의',
  en: 'Contact',
  ja: 'お問い合わせ',
};

function page(lang: LegalLang, title: string, body: string): string {
  return `<!doctype html><html lang="${lang}"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${title} · ${APP_NAME}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Hiragino Sans","Segoe UI",sans-serif;line-height:1.7;color:#1f2421;max-width:720px;margin:0 auto;padding:32px 20px 80px;}
  h1{font-size:1.5rem;margin-bottom:4px;} h2{font-size:1.1rem;margin-top:28px;}
  .meta{color:#6b726c;font-size:.85rem;margin-bottom:24px;}
  a{color:#2f6f4e;} ul{padding-left:18px;} li{margin:4px 0;}
</style></head><body>${body}
<p class="meta" style="margin-top:40px">${CONTACT_LABEL[lang]}: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
</body></html>`;
}

const PRIVACY: Record<LegalLang, { title: string; body: string }> = {
  ko: {
    title: '개인정보처리방침',
    body: `<h1>개인정보처리방침</h1>
<p class="meta">${APP_NAME} · 시행일 ${EFFECTIVE_DATE}</p>
<p>${APP_NAME}(이하 "서비스")는 AI 기반 인터랙티브 소설 앱입니다. 본 방침은 서비스가 수집·이용·보관하는 개인정보를 설명합니다.</p>
<h2>1. 수집하는 정보</h2>
<ul>
  <li><b>계정 정보</b>: Apple 또는 Google 로그인 시 제공되는 이메일, 이름, 프로필 이미지.</li>
  <li><b>이용자 생성 콘텐츠</b>: 사용자가 입력한 이야기 설정(프롬프트)과 그로부터 생성된 챕터 텍스트.</li>
  <li><b>구매 기록</b>: 인앱 결제(크레딧) 거래 식별자와 지급 내역. 결제 수단 정보는 Apple이 처리하며 서비스는 저장하지 않습니다.</li>
  <li><b>진단 정보</b>: 오류 및 안정성 개선을 위한 비식별 진단 로그.</li>
</ul>
<h2>2. 이용 목적</h2>
<ul>
  <li>서비스 제공(로그인, 이야기 생성·저장, 이어 읽기).</li>
  <li>인앱 결제 처리 및 크레딧 지급.</li>
  <li>오류 진단, 품질 개선, 부정 이용 방지.</li>
  <li>이용자가 신고한 콘텐츠의 검토 및 조치.</li>
</ul>
<h2>3. 제3자 처리위탁 및 국외 이전</h2>
<p>서비스 운영을 위해 다음 처리자를 이용하며, 일부는 국외에 위치할 수 있습니다.</p>
<ul>
  <li>Apple, Google — 로그인 인증, 인앱 결제.</li>
  <li>Cloudflare — 애플리케이션 호스팅.</li>
  <li>Neon — 데이터베이스.</li>
  <li>AI 생성 제공자(Anthropic 등) — 이야기 텍스트 생성.</li>
  <li>Sentry — 오류 진단.</li>
</ul>
<h2>4. 보관 및 삭제</h2>
<p>개인정보는 서비스 이용 기간 동안 보관되며, 앱 내 <b>회원 탈퇴</b> 시 계정과 생성 콘텐츠, 구매 기록 등 관련 데이터가 즉시 영구 삭제됩니다.</p>
<h2>5. 이용자의 권리</h2>
<p>이용자는 자신의 정보 열람·삭제를 요청할 수 있으며, 앱 내 회원 탈퇴로 직접 삭제할 수 있습니다.</p>
<h2>6. 아동</h2>
<p>본 서비스는 만 14세 미만 아동을 대상으로 하지 않습니다.</p>
<h2>7. 변경</h2>
<p>본 방침은 변경될 수 있으며, 변경 시 본 페이지에 게시합니다.</p>`,
  },
  en: {
    title: 'Privacy Policy',
    body: `<h1>Privacy Policy</h1>
<p class="meta">${APP_NAME} · Effective ${EFFECTIVE_DATE}</p>
<p>${APP_NAME} ("the Service") is an AI-powered interactive fiction app. This policy explains the personal data the Service collects, uses, and retains.</p>
<h2>1. Information we collect</h2>
<ul>
  <li><b>Account</b>: email, name, and profile image provided when you sign in with Apple or Google.</li>
  <li><b>User-generated content</b>: the story setup (prompts) you enter and the chapter text generated from it.</li>
  <li><b>Purchase records</b>: in-app purchase (credit) transaction identifiers and grant history. Payment details are handled by Apple and are not stored by the Service.</li>
  <li><b>Diagnostics</b>: de-identified diagnostic logs used to fix errors and improve stability.</li>
</ul>
<h2>2. How we use it</h2>
<ul>
  <li>Providing the service (sign-in, story generation and storage, resuming reading).</li>
  <li>Processing in-app purchases and granting credits.</li>
  <li>Diagnosing errors, improving quality, and preventing abuse.</li>
  <li>Reviewing and acting on content you report.</li>
</ul>
<h2>3. Third parties and international transfer</h2>
<p>We use the following processors to operate the Service; some may be located outside your country.</p>
<ul>
  <li>Apple, Google — sign-in authentication and in-app purchases.</li>
  <li>Cloudflare — application hosting.</li>
  <li>Neon — database.</li>
  <li>AI generation providers (e.g. Anthropic) — story text generation.</li>
  <li>Sentry — error diagnostics.</li>
</ul>
<h2>4. Retention and deletion</h2>
<p>Personal data is retained while you use the Service. Using <b>Delete account</b> in the app permanently deletes your account, generated content, purchase records, and related data immediately.</p>
<h2>5. Your rights</h2>
<p>You may request access to or deletion of your data, and can delete it directly via Delete account in the app.</p>
<h2>6. Children</h2>
<p>The Service is not directed to children under 14.</p>
<h2>7. Changes</h2>
<p>This policy may change; updates will be posted on this page.</p>`,
  },
  ja: {
    title: 'プライバシーポリシー',
    body: `<h1>プライバシーポリシー</h1>
<p class="meta">${APP_NAME} · 施行日 ${EFFECTIVE_DATE}</p>
<p>${APP_NAME}（以下「本サービス」）はAIを活用したインタラクティブ小説アプリです。本ポリシーは、本サービスが収集・利用・保管する個人情報について説明します。</p>
<h2>1. 収集する情報</h2>
<ul>
  <li><b>アカウント情報</b>: AppleまたはGoogleでのログイン時に提供されるメールアドレス、名前、プロフィール画像。</li>
  <li><b>ユーザー生成コンテンツ</b>: ユーザーが入力した物語の設定（プロンプト）と、それにより生成されたチャプターのテキスト。</li>
  <li><b>購入履歴</b>: アプリ内課金（クレジット）の取引識別子と付与履歴。決済情報はAppleが処理し、本サービスは保存しません。</li>
  <li><b>診断情報</b>: 不具合の修正と安定性向上のための非識別の診断ログ。</li>
</ul>
<h2>2. 利用目的</h2>
<ul>
  <li>サービスの提供（ログイン、物語の生成・保存、続きの閲覧）。</li>
  <li>アプリ内課金の処理とクレジットの付与。</li>
  <li>不具合の診断、品質改善、不正利用の防止。</li>
  <li>ユーザーが報告したコンテンツの確認と対応。</li>
</ul>
<h2>3. 第三者への委託および国外移転</h2>
<p>本サービスの運営のため、以下の処理者を利用します。一部は国外に所在する場合があります。</p>
<ul>
  <li>Apple、Google — ログイン認証、アプリ内課金。</li>
  <li>Cloudflare — アプリケーションのホスティング。</li>
  <li>Neon — データベース。</li>
  <li>AI生成プロバイダ（Anthropic等） — 物語テキストの生成。</li>
  <li>Sentry — エラー診断。</li>
</ul>
<h2>4. 保管および削除</h2>
<p>個人情報はサービス利用期間中保管され、アプリ内の<b>アカウント削除</b>により、アカウント、生成コンテンツ、購入履歴などの関連データが直ちに完全に削除されます。</p>
<h2>5. ユーザーの権利</h2>
<p>ユーザーは自身の情報の閲覧・削除を請求でき、アプリ内のアカウント削除から直接削除できます。</p>
<h2>6. 児童について</h2>
<p>本サービスは14歳未満の児童を対象としていません。</p>
<h2>7. 変更</h2>
<p>本ポリシーは変更されることがあり、変更時は本ページに掲載します。</p>`,
  },
};

const TERMS: Record<LegalLang, { title: string; body: string }> = {
  ko: {
    title: '이용약관',
    body: `<h1>이용약관</h1>
<p class="meta">${APP_NAME} · 시행일 ${EFFECTIVE_DATE}</p>
<p>본 약관은 ${APP_NAME}(이하 "서비스") 이용에 관한 조건을 규정합니다. 서비스를 이용함으로써 본 약관에 동의하게 됩니다.</p>
<h2>1. 서비스</h2>
<p>서비스는 이용자가 입력한 설정을 바탕으로 AI가 인터랙티브 소설 챕터를 생성하는 기능을 제공합니다. 생성 결과는 AI에 의해 자동 생성되며 정확성이나 적합성을 보장하지 않습니다.</p>
<h2>2. 크레딧 및 결제</h2>
<ul>
  <li>이야기 생성에는 인앱에서 구매하는 크레딧이 사용됩니다.</li>
  <li>결제 및 환불은 Apple App Store의 정책에 따릅니다.</li>
  <li>크레딧은 서비스 내에서만 사용 가능한 가상 재화이며 현금으로 환급되지 않습니다.</li>
</ul>
<h2>3. 이용자의 의무 (금지 행위)</h2>
<p>이용자는 다음을 생성·요청해서는 안 됩니다.</p>
<ul>
  <li>아동 성착취물 등 불법 콘텐츠.</li>
  <li>타인에 대한 괴롭힘·혐오·차별을 조장하는 콘텐츠.</li>
  <li>실제 범죄나 폭력을 조장·교사하는 콘텐츠.</li>
  <li>기타 관련 법령 또는 Apple App Store 정책에 위반되는 콘텐츠.</li>
</ul>
<p>부적절한 생성물은 앱 내 신고 기능을 통해 신고할 수 있으며, 서비스는 검토 후 콘텐츠 비표시·계정 이용 제한 등의 조치를 취할 수 있습니다.</p>
<h2>4. 콘텐츠의 권리</h2>
<p>이용자가 생성한 콘텐츠는 이용자 본인에게 비공개로 제공되며, 다른 이용자에게 공유되지 않습니다.</p>
<h2>5. 면책</h2>
<p>서비스는 "있는 그대로" 제공되며, AI 생성물로 인해 발생한 결과에 대해 법령이 허용하는 범위에서 책임을 지지 않습니다.</p>
<h2>6. 해지</h2>
<p>이용자는 앱 내 회원 탈퇴로 언제든지 이용을 종료할 수 있습니다.</p>
<h2>7. 준거법</h2>
<p>본 약관은 대한민국 법률에 따릅니다.</p>`,
  },
  en: {
    title: 'Terms of Use',
    body: `<h1>Terms of Use</h1>
<p class="meta">${APP_NAME} · Effective ${EFFECTIVE_DATE}</p>
<p>These terms govern your use of ${APP_NAME} ("the Service"). By using the Service you agree to these terms.</p>
<h2>1. The Service</h2>
<p>The Service generates interactive fiction chapters with AI based on the setup you provide. Output is generated automatically by AI, and we do not guarantee its accuracy or suitability.</p>
<h2>2. Credits and payment</h2>
<ul>
  <li>Generating stories consumes credits purchased in the app.</li>
  <li>Payments and refunds are governed by Apple App Store policies.</li>
  <li>Credits are virtual goods usable only within the Service and are not redeemable for cash.</li>
</ul>
<h2>3. Your obligations (prohibited conduct)</h2>
<p>You must not generate or request:</p>
<ul>
  <li>Illegal content, including child sexual abuse material.</li>
  <li>Content that promotes harassment, hate, or discrimination.</li>
  <li>Content that promotes or instructs real-world crime or violence.</li>
  <li>Any content that violates applicable law or Apple App Store policies.</li>
</ul>
<p>Objectionable output can be reported via the in-app report feature; we may review and take action such as hiding content or restricting account access.</p>
<h2>4. Content rights</h2>
<p>Content you generate is provided privately to you and is not shared with other users.</p>
<h2>5. Disclaimer</h2>
<p>The Service is provided "as is." To the extent permitted by law, we are not liable for outcomes arising from AI-generated output.</p>
<h2>6. Termination</h2>
<p>You may end your use at any time via Delete account in the app.</p>
<h2>7. Governing law</h2>
<p>These terms are governed by the laws of the Republic of Korea.</p>`,
  },
  ja: {
    title: '利用規約',
    body: `<h1>利用規約</h1>
<p class="meta">${APP_NAME} · 施行日 ${EFFECTIVE_DATE}</p>
<p>本規約は${APP_NAME}（以下「本サービス」）の利用条件を定めます。本サービスを利用することで、本規約に同意したものとみなされます。</p>
<h2>1. 本サービス</h2>
<p>本サービスは、ユーザーが入力した設定に基づきAIがインタラクティブ小説のチャプターを生成する機能を提供します。生成結果はAIにより自動生成され、その正確性や適合性を保証しません。</p>
<h2>2. クレジットと決済</h2>
<ul>
  <li>物語の生成には、アプリ内で購入するクレジットを使用します。</li>
  <li>決済および返金はApple App Storeのポリシーに従います。</li>
  <li>クレジットは本サービス内でのみ利用可能な仮想財であり、現金への払い戻しはできません。</li>
</ul>
<h2>3. ユーザーの義務（禁止行為）</h2>
<p>ユーザーは以下を生成・要求してはなりません。</p>
<ul>
  <li>児童性的虐待コンテンツ等の違法なコンテンツ。</li>
  <li>他者への嫌がらせ・ヘイト・差別を助長するコンテンツ。</li>
  <li>現実の犯罪や暴力を助長・教唆するコンテンツ。</li>
  <li>その他、関連法令またはApple App Storeのポリシーに違反するコンテンツ。</li>
</ul>
<p>不適切な生成物はアプリ内の報告機能から報告でき、本サービスは確認のうえ、コンテンツの非表示やアカウント利用制限等の措置を講じることがあります。</p>
<h2>4. コンテンツの権利</h2>
<p>ユーザーが生成したコンテンツはユーザー本人に非公開で提供され、他のユーザーには共有されません。</p>
<h2>5. 免責</h2>
<p>本サービスは「現状有姿」で提供されます。法令が認める範囲で、AI生成物に起因する結果について責任を負いません。</p>
<h2>6. 解約</h2>
<p>ユーザーはアプリ内のアカウント削除からいつでも利用を終了できます。</p>
<h2>7. 準拠法</h2>
<p>本規約は大韓民国の法律に準拠します。</p>`,
  },
};

export function privacyPage(lang: LegalLang): string {
  return page(lang, PRIVACY[lang].title, PRIVACY[lang].body);
}

export function termsPage(lang: LegalLang): string {
  return page(lang, TERMS[lang].title, TERMS[lang].body);
}
