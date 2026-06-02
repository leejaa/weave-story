// Privacy Policy & Terms of Service served as simple HTML from the worker so the
// app and App Store Connect can link to functional URLs (/privacy, /terms).

const SUPPORT_EMAIL = 'leejahun0@gmail.com';
const EFFECTIVE_DATE = '2026년 6월 2일';
const APP_NAME = 'Weave Story';

function page(title: string, body: string): string {
  return `<!doctype html><html lang="ko"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${title} · ${APP_NAME}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Segoe UI",sans-serif;line-height:1.7;color:#1f2421;max-width:720px;margin:0 auto;padding:32px 20px 80px;}
  h1{font-size:1.5rem;margin-bottom:4px;} h2{font-size:1.1rem;margin-top:28px;}
  .meta{color:#6b726c;font-size:.85rem;margin-bottom:24px;}
  a{color:#2f6f4e;} ul{padding-left:18px;} li{margin:4px 0;}
</style></head><body>${body}
<p class="meta" style="margin-top:40px">문의: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
</body></html>`;
}

export function privacyPage(): string {
  return page('개인정보처리방침', `
<h1>개인정보처리방침</h1>
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
<p>본 방침은 변경될 수 있으며, 변경 시 본 페이지에 게시합니다.</p>
`);
}

export function termsPage(): string {
  return page('이용약관', `
<h1>이용약관</h1>
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
<p>본 약관은 대한민국 법률에 따릅니다.</p>
`);
}
