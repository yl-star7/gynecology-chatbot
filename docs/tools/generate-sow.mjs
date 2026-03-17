import { HwpxExporter } from 'hwpx-ts';
import JSZip from 'jszip';
import { readFile, writeFile } from 'fs/promises';

// ============================================================
// SOW 데이터 (여기만 수정하면 SOW 재생성)
// ============================================================
const SOW = {
  // 문서 정보
  docVersion: 'v0.3',
  docDate: '2026-02-24',
  quoteExpiry: '2026-03-07',
  docType: '계약 부속서',

  // 프로젝트
  projectName: '모성간호 챗봇',
  purpose: '임산부(예비맘) 대상 AI 기반 모성간호 상담 챗봇 웹 서비스 구축',
  platform: '웹 기반 (모바일 반응형)',

  // 당사자
  vendor: {
    company: '주식회사 룸821',
    ceo: '강정석',
  },
  client: {
    name: '이예림',
    title: '교수님',
  },

  // 일정
  schedule: {
    startDate: '2026년 3월 14일',
    devStart: '3월 14일',
    devEnd: '3월 21일',
    devPeriod: '약 1주',
    qcStart: '3월 22일',
    qcEnd: '4월 10일',
    qcPeriod: '약 3주',
    deliveryDate: '2026년 4월 10일',
    freeAsEnd: '2026년 4월 30일',
    freeAsNote: '납품 후 약 3주',
  },

  // 마일스톤
  milestones: [
    { stage: 'M0. 킥오프', period: '3/14', output: '요구사항 최종 확정, 일정 합의', note: '착수 미팅' },
    { stage: 'M1. 개발 완료', period: '3/14 ~ 3/21', output: '전체 기능 개발 (인증, 채팅 AI, 관리자, 인프라)', note: '1주' },
    { stage: 'M2. QC 1차', period: '3/22 ~ 3/31', output: 'E2E 테스트, 시나리오 테스트', note: '' },
    { stage: 'M3. QC 2차 + 수정', period: '4/1 ~ 4/10', output: '버그 수정, 재테스트, 최종 검수', note: '' },
    { stage: 'M4. 최종 납품', period: '4/10', output: '운영 환경 배포, 산출물 전달', note: '납품일' },
  ],

  // 결제
  payment: {
    method: '일시납',
    total: 14_454_000,
    supply: 13_140_000,
    vat: 1_314_000,
    bank: '기업은행 054-157695-04-016 (주식회사 룸821)',
  },

  // 개발 항목 (비용 + 범위 + 상세 테이블)
  items: [
    {
      no: 1,
      name: '프로젝트 매니징',
      qty: 1, unit: 1_000_000, total: 1_000_000,
      category: '필수',
      details: [
        ['범위', '웹 기반 모바일 반응형 서비스 총괄 관리'],
        ['PM 관리', '개발 진행 모니터링, 주간 진행 보고, 이슈 관리'],
        ['커뮤니케이션', '발주자와의 정기 미팅 및 피드백 반영'],
        ['일정 관리', '마일스톤 관리, QC 일정 조율, 리스크 대응'],
      ],
      note: '필수항목',
    },
    {
      no: 2,
      name: '회원가입 및 관리자 패널',
      qty: 1, unit: 400_000, total: 400_000,
      category: '필수',
      detailHeaders: ['기능', '상세 내용', '비고'],
      details: [
        ['전화번호 인증 로그인', '전화번호 기반 본인인증 로그인/회원가입', 'SMS 인증 비용 포함'],
        ['세션 관리', '로그인 세션 유지 1년', '자동 로그인'],
        ['관리자 인증', '관리자 전용 로그인 및 접근 제어', ''],
      ],
      note: '필수항목. SMS 본인인증 발송 비용은 본 계약 금액에 포함됩니다.',
    },
    {
      no: 3,
      name: '관리자 페이지 (디자인 포함)',
      qty: 1, unit: 2_200_000, total: 2_200_000,
      category: '필수',
      detailHeaders: ['기능', '상세 내용', '비고'],
      details: [
        ['유저 채팅 조회', '사용자별 채팅 내역 열람', '상담 품질 관리'],
        ['사용량 모니터링', '일별/주별 채팅량, 활성 유저 수 대시보드', '시각화 차트'],
        ['로그인 횟수 조회', '사용자별 접속 이력 및 통계', ''],
        ['업로드 자료 관리', '이미지 및 태그, 팩트 DB 관리, 카드뉴스 업로드/편집/삭제', 'CMS'],
        ['설문 DB 관리', '주관식/객관식 설문 생성·관리 (분기점 없음)', ''],
        ['로그인 관리', '사용자 계정 활성화/비활성화, 역할 관리', ''],
      ],
      note: '필수항목. UI/UX 디자인 포함.',
    },
    {
      no: 4,
      name: '채팅 AI 웹 개발 (디자인 포함)',
      qty: 1, unit: 3_800_000, total: 3_800_000,
      category: '필수',
      detailHeaders: ['기능', '상세 내용', '비고'],
      details: [
        ['AI 가드레일 (앞단)', '입력 필터링 - 욕설, 비윤리적 질문, 서비스 무관 질문 차단', '안전장치'],
        ['AI 가드레일 (뒷단)', '의학적 팩트체크 (RAG 기반), "의학적 조언 아님" 고지', '안전장치'],
        ['채팅 내 렌더링', '이미지, 카드뉴스, 설문지 등 멀티미디어 메시지 표시', ''],
        ['감정 분석 캐릭터', '사용자 감정 상태에 따른 C간호사 캐릭터 표정 변화', '기쁨/위로/걱정 등'],
        ['데일리 로그 기록', '유저 채팅 내역 일별 자동 기록 및 감정 로그 저장', ''],
        ['채팅 저장', '대화 내역 저장/조회 기능', ''],
        ['페르소나 + RAG', '임산부 주수별 맞춤 페르소나 부여, 의료 데이터 RAG 기반 답변 생성', '핵심 기능'],
      ],
      note: '필수항목. UI/UX 디자인 포함.',
    },
    {
      no: 5,
      name: '채팅 AI - 워크플로우 구성',
      qty: 1, unit: 2_500_000, total: 2_500_000,
      category: '',
      detailHeaders: ['항목', '상세 내용', '비고'],
      details: [
        ['워크플로우 설계', 'Block Based 대화 흐름 설계 (노코드 기반)', ''],
        ['모델 최적화', 'AI 모델 내부 최적화 (모델 설정은 수급자 재량)', '모델 선택 불가'],
        ['대화 시나리오', '감정 체크인, 주수별 정보 제공, 상담 분기 등 시나리오 구현', ''],
      ],
      note: '대화체 수정 없이 기본 값 적용 시 추가 비용 없음 (0원).',
    },
    {
      no: 6,
      name: '이미지 세팅 비용',
      qty: 500, unit: 500, total: 250_000,
      category: '',
      detailHeaders: ['항목', '상세 내용', '비고'],
      details: [
        ['초기 세팅', '캐릭터/감정 이미지 초기 500개 세팅', '500개 × 500원'],
        ['수수료', '초기 디자인 얼라인 비용 및 운영비 포함 (40%)', ''],
        ['변경 비용', '이미지 변경/추가 시 동일 단가 적용', ''],
      ],
      note: null,
    },
    {
      no: 7,
      name: '서버 비용 (도메인 연결 및 서버)',
      qty: 6, unit: 150_000, total: 900_000,
      category: '필수',
      detailHeaders: ['항목', '상세 내용', '비고'],
      details: [
        ['서버 인스턴스', '기본 서버 사양 웹 애플리케이션 서버', '기본 사양'],
        ['운영 기간', '6개월 (2026년 3월 ~ 8월)', '월 150,000원'],
        ['포함 사항', '도메인 연결, SSL, DB 인스턴스, 환경 구성', ''],
      ],
      note: '필수항목. 6개월 이후 서버 비용은 별도 협의.',
    },
    {
      no: 8,
      name: '웹사이트 도메인 비용 (1년)',
      qty: 1, unit: 50_000, total: 50_000,
      category: '필수',
      detailHeaders: ['항목', '상세 내용', '비고'],
      details: [
        ['도메인 등록', '.com 또는 .kr 도메인 1년 등록', '가비아 기준'],
      ],
      note: '필수항목.',
    },
    {
      no: 9,
      name: '푸시 알림 문자 비용',
      qty: 10_000, unit: 14, total: 140_000,
      category: '',
      detailHeaders: ['항목', '상세 내용', '비고'],
      details: [
        ['대상', '50명 × 200일 기준', '베타 테스트 + 운영'],
        ['단가', '건당 14원 × 10,000건', ''],
        ['수수료', '테스트 비용 및 운영비 포함 (40%)', ''],
        ['알림 예시', '[**주차 *일자] 정보를 확인하세요', '주수별 맞춤 알림'],
      ],
      note: null,
    },
    {
      no: 10,
      name: '생성형 AI API 비용 (6개월)',
      qty: 6, unit: 100_000, total: 600_000,
      category: '필수',
      detailHeaders: ['항목', '상세 내용', '비고'],
      details: [
        ['채팅 API', 'Gemini AI 대화 생성 비용', ''],
        ['AI 서버 비용', 'AI 모델 서빙 및 추론 비용', ''],
        ['운영 기간', '6개월 (월 100,000원)', ''],
      ],
      note: '필수항목.',
    },
    {
      no: 11,
      name: '생성형 AI API - 검색 API (6개월)',
      qty: 6, unit: 50_000, total: 300_000,
      category: '',
      detailHeaders: ['항목', '상세 내용', '비고'],
      details: [
        ['웹 검색 API', '제한된 데이터 소스 내 답변 보강을 위한 검색 기능', ''],
        ['운영 기간', '6개월 (월 50,000원)', ''],
      ],
      note: null,
    },
  ],

  // 유지보수
  maintenance: {
    freeAs: {
      end: '2026년 4월 30일',
      scope: '초기 계약 범위 내 버그 수정 및 안정화',
      excludes: [
        '초기 계약 범위에 포함되지 않은 추가 기능 개발',
        '디자인 변경',
        '새로운 요구사항 반영',
      ],
    },
    paidAs: {
      months: 2,
      price: 500_000,
      scope: [
        '운영 중 발생하는 버그 수정 및 기술 지원',
        '서버 모니터링 및 장애 대응',
        '초기 계약 범위 외 추가 기능 개발은 별도 견적',
      ],
    },
    costTableNo: { free: 13, paid: 14 },
  },

  // 납품물
  deliverables: [
    { category: '소스코드', item: '전체 프로젝트 소스코드 (Git 저장소)' },
    { category: '배포 환경', item: '운영 서버 배포 완료 상태' },
    { category: '관리자 계정', item: '관리자 페이지 접근 계정' },
    { category: '기술 문서', item: '시스템 구성도, API 문서, 배포 가이드' },
    { category: '사용자 가이드', item: '관리자 페이지 사용 매뉴얼' },
  ],

  // 기타 사항
  notes: [
    `본 문서는 견적서(유효기간 {{quoteExpiry}})를 기반으로 작성된 계약 부속서이며, 양측 서명으로 효력이 발생합니다.`,
    '프로젝트 세부 내용이 변경될 경우 상호 협의하에 일정 및 비용 조정이 필요할 수 있습니다.',
    '작업 기간은 영업일 기준이며, 영업일 외 작업이 필요한 경우 별도 협의가 필요합니다.',
    '계약 이후 진행상황에 변동이 생기면 추가 견적이 발생할 수 있으며, 금액은 양측 협의로 결정됩니다.',
    '발주자 측의 자료 제공 지연, 피드백 지연 등으로 인한 일정 지연은 수급자의 책임이 아닙니다.',
    '6개월 이후(2026년 9월~) 서버 운영 비용 및 AI API 비용은 별도 협의하여 결정합니다.',
  ],

  // 변경 이력
  changelog: [
    { version: 'v0.1', date: '2026-02-24', change: '초안 작성 (구 견적서 기반)', author: '강정석' },
    { version: 'v0.2', date: '2026-02-24', change: '신규 견적서 기반 전면 업데이트', author: '강정석' },
    { version: 'v0.3', date: '2026-02-24', change: '일시납, 납품일 확정(4/10), 일정 재조정', author: '강정석' },
  ],
};

// ============================================================
// 헬퍼
// ============================================================
const fmt = (n) => n.toLocaleString('ko-KR');
const D = SOW;
const V = D.vendor;
const CL = D.client;
const S = D.schedule;
const P = D.payment;
const M = D.maintenance;

// ============================================================
// SOW 생성
// ============================================================
const templatePath = '/Users/jskang/Downloads/blank.hwpx';
const outputPath = '/Users/jskang/si/gynecology-chatbot/docs/SOW_모성간호챗봇.hwpx';

const doc = new HwpxExporter();

// ── 제목 ──
doc.addHeading(`${D.projectName} 프로젝트 - 개발 범위 명세서`, 1, 'center');
doc.addLineBreak();

// ── 문서 정보 ──
doc.addTable([
  ['항목', '내용'],
  ['문서 분류', D.docType],
  ['문서 버전', D.docVersion],
  ['작성일', D.docDate],
  ['견적 유효기간', D.quoteExpiry],
  ['수급자', `${V.company} (대표 ${V.ceo})`],
  ['발주자', `${CL.name} ${CL.title}`],
], { header: true });
doc.addLineBreak();

// ── 1. 프로젝트 개요 ──
doc.addHeading('1. 프로젝트 개요', 2);
doc.addTable([
  ['항목', '내용'],
  ['프로젝트명', D.projectName],
  ['목적', D.purpose],
  ['플랫폼', D.platform],
  ['착수일', S.startDate],
  ['총 계약 금액', `${fmt(P.total)}원 (VAT 포함)`],
], { header: true });
doc.addLineBreak();

// ── 2. 개발 범위 및 구체적 내용 ──
doc.addHeading('2. 개발 범위 및 구체적 내용', 2);
doc.addLineBreak();

for (const item of D.items) {
  // 소제목
  doc.addHeading(`2.${item.no} ${item.name} (${fmt(item.total)}원)`, 3);

  // 상세 테이블
  const headers = item.detailHeaders || ['항목', '상세 내용'];
  const rows = [headers, ...item.details];
  doc.addTable(rows, { header: true });

  // 비고
  if (item.note) {
    doc.addParagraph(`※ ${item.note}`);
  }
  doc.addLineBreak();
}

// ── 3. 개발 일정 ──
doc.addHeading('3. 개발 일정', 2);
doc.addLineBreak();

doc.addHeading('3.1 전체 일정', 3);
doc.addTable([
  ['구분', '기간', '비고'],
  ['착수일', S.startDate, ''],
  ['개발 기간', `${S.devStart} ~ ${S.devEnd}`, `핵심 기능 개발 (${S.devPeriod})`],
  ['QC 기간', `${S.qcStart} ~ ${S.qcEnd}`, `E2E 테스트, 시나리오 테스트, 버그 수정, 발주자 피드백 반영 (${S.qcPeriod})`],
  ['납품일', S.deliveryDate, '전체 기능 완료 및 운영 배포'],
  ['무상 A/S 종료', S.freeAsEnd, S.freeAsNote],
], { header: true });
doc.addLineBreak();

doc.addHeading('3.2 마일스톤', 3);
const msRows = [['단계', '기간', '산출물', '비고']];
for (const m of D.milestones) {
  msRows.push([m.stage, m.period, m.output, m.note]);
}
doc.addTable(msRows, { header: true });
doc.addLineBreak();

doc.addHeading('3.3 주요 일정 요약', 3);
doc.addTable([
  ['항목', '일자'],
  ['계약 체결', '2026년 3월 (협의)'],
  ['착수일', S.startDate],
  ['개발 완료', `2026년 ${S.devEnd}`],
  ['최종 납품', S.deliveryDate],
  ['무상 A/S 종료', S.freeAsEnd],
  ['유상 A/S 종료', '유상 A/S 계약 종료일 기준'],
], { header: true });
doc.addLineBreak();

// ── 4. 비용 총괄 ──
doc.addHeading('4. 비용 총괄', 2);
doc.addLineBreak();

doc.addHeading('4.1 개발 비용', 3);
const costRows = [['No.', '항목', '수량', '단가 (원)', '금액 (원)', '구분']];
for (const item of D.items) {
  costRows.push([
    String(item.no),
    item.name,
    fmt(item.qty),
    fmt(item.unit),
    fmt(item.total),
    item.category || '',
  ]);
}
doc.addTable(costRows, { header: true });
doc.addLineBreak();

doc.addHeading('4.2 유지보수 비용', 3);
doc.addTable([
  ['No.', '항목', '수량', '단가 (원)', '금액 (원)', '비고'],
  [String(M.costTableNo.free), 'A/S 가능 기간 (무상)', '1', '0', '0', `${M.freeAs.end}까지, 필수`],
  [String(M.costTableNo.paid), '추가 A/S 가능 기간', `${M.paidAs.months}개월`, fmt(M.paidAs.price), fmt(M.paidAs.months * M.paidAs.price), ''],
], { header: true });
doc.addLineBreak();

doc.addHeading('4.3 합계', 3);
doc.addTable([
  ['구분', '금액 (원)'],
  ['공급가액', fmt(P.supply)],
  ['부가세 (10%)', fmt(P.vat)],
  ['최종 합계 (VAT 포함)', fmt(P.total)],
], { header: true });
doc.addLineBreak();

// ── 5. A/S 및 유지보수 ──
doc.addHeading('5. A/S 및 유지보수', 2);
doc.addLineBreak();

doc.addHeading(`5.1 무상 A/S (${M.freeAs.end}까지)`, 3);
doc.addParagraph(`- ${M.freeAs.scope}`);
doc.addParagraph('- 아래 사항은 무상 A/S에 포함되지 않으며 별도 비용이 발생합니다:');
for (const ex of M.freeAs.excludes) {
  doc.addParagraph(`    - ${ex}`);
}
doc.addLineBreak();

doc.addHeading(`5.2 유상 A/S (${M.paidAs.months}개월, 월 ${fmt(M.paidAs.price)}원)`, 3);
for (const s of M.paidAs.scope) {
  doc.addParagraph(`- ${s}`);
}
doc.addLineBreak();

// ── 6. 납품물 ──
doc.addHeading('6. 납품물', 2);
const delRows = [['구분', '산출물']];
for (const d of D.deliverables) {
  delRows.push([d.category, d.item]);
}
doc.addTable(delRows, { header: true });
doc.addLineBreak();

// ── 7. 결제 조건 ──
doc.addHeading('7. 결제 조건', 2);
doc.addTable([
  ['구분', '비율', '금액 (원)', '시점'],
  [P.method, '100%', fmt(P.total), '계약 체결 시'],
], { header: true });
doc.addParagraph(`※ 입금 계좌: ${P.bank}`);
doc.addLineBreak();

// ── 8. 기타 사항 ──
doc.addHeading('8. 기타 사항', 2);
D.notes.forEach((note, i) => {
  const text = note.replace('{{quoteExpiry}}', D.quoteExpiry);
  doc.addParagraph(`${i + 1}. ${text}`);
});
doc.addLineBreak();

// ── 9. 서명 ──
doc.addHeading('9. 서명', 2);
doc.addTable([
  ['', '수급자', '발주자'],
  ['상호/성명', `${V.company} / ${V.ceo}`, `/ ${CL.name}`],
  ['서명', '', ''],
  ['날짜', '2026년    월    일', '2026년    월    일'],
], { header: true });
doc.addLineBreak();

// ── 변경 이력 ──
doc.addHeading('변경 이력', 2);
const clRows = [['버전', '일자', '변경 내용', '작성자']];
for (const c of D.changelog) {
  clRows.push([c.version, c.date, c.change, c.author]);
}
doc.addTable(clRows, { header: true });

// ============================================================
// 빌드: Exporter → section0.xml 추출 → blank.hwpx에 병합
// ============================================================
const exporterResult = await doc.build();
const exporterZip = await JSZip.loadAsync(exporterResult);
const generatedSection = await exporterZip.file('Contents/section0.xml').async('string');

const templateBytes = await readFile(templatePath);
const templateZip = await JSZip.loadAsync(templateBytes);

const templateSection = await templateZip.file('Contents/section0.xml').async('string');
const secPrMatch = templateSection.match(/<hp:secPr[\s\S]*?<\/hp:secPr>/);
const secPr = secPrMatch?.[0] || '';

let finalSection = generatedSection;
if (secPr) {
  const firstRunClose = finalSection.indexOf('>', finalSection.indexOf('<hp:run'));
  if (firstRunClose > 0) {
    finalSection = finalSection.substring(0, firstRunClose + 1) + secPr + finalSection.substring(firstRunClose + 1);
  }
}

const templateNsMatch = templateSection.match(/<hs:sec\s+([^>]*?)>/);
const generatedNsMatch = finalSection.match(/<hs:sec\s+([^>]*?)>/);
if (templateNsMatch && generatedNsMatch) {
  finalSection = finalSection.replace(`<hs:sec ${generatedNsMatch[1]}>`, `<hs:sec ${templateNsMatch[1]}>`);
}

templateZip.file('Contents/section0.xml', finalSection);

const output = await templateZip.generateAsync({
  type: 'uint8array',
  compression: 'DEFLATE',
  compressionOptions: { level: 6 },
});

await writeFile(outputPath, output);
console.log(`HWPX 생성 완료: ${outputPath} (${output.length} bytes)`);
