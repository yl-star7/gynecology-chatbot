import { HwpxExporter } from 'hwpx-ts';
import JSZip from 'jszip';
import { readFile, writeFile } from 'fs/promises';

// ============================================================
// 계약 데이터 (여기만 수정하면 계약서 재생성)
// ============================================================
const CONTRACT = {
  // 프로젝트
  projectName: '모성간호 챗봇',
  softwareName: '모성간호 챗봇',

  // 발주자
  client: {
    name: '이예림',
    org: '가톨릭대학교 간호대학',
    contact: '',
  },

  // 수급자
  vendor: {
    company: '주식회사 룸821',
    ceo: '강정석',
    bizNo: '285-87-02954',
    contact: '010-2678-4241',
    address: '서울특별시 서대문구 연세로 2다길 20, 211호',
    email: 'contact-us@room821.im',
    bank: '기업은행 054-157695-04-016',
  },

  // 일정
  schedule: {
    startDate: '2026년 3월 14일',
    devEnd: '2026년 3월 21일',
    devPeriod: '약 1주',
    qcStart: '2026년 3월 22일',
    qcEnd: '2026년 4월 10일',
    qcPeriod: '약 2.5주',
    deliveryDate: '2026년 4월 10일 (금)',
    freeAsEnd: '2026년 4월 30일',
  },

  // 결제
  payment: {
    total: 14_454_000,
    totalKr: '일천사백사십오만사천',
    supply: 13_140_000,
    vat: 1_314_000,
    installments: [
      { label: '1차 지급', due: '계약 체결 시', percent: 70, amount: 10_117_800 },
      { label: '2차 지급', due: '최종 검수 완료 후', percent: 30, amount: 4_336_200 },
    ],
  },

  // 권리 제한
  rights: {
    reuseRestrictionYears: '2년',
  },

  // 비용 항목 (제3조 테이블 + 제2조 범위)
  items: [
    {
      no: 1, name: '프로젝트 매니징', qty: 1, unit: 1_000_000, total: 1_000_000,
      scope: ['개발 진행 모니터링, 주간 진행 보고, 이슈 관리', '발주자와의 정기 미팅 및 피드백 반영'],
    },
    {
      no: 2, name: '회원가입 및 관리자 패널', qty: 1, unit: 400_000, total: 400_000,
      scope: ['전화번호 기반 본인인증 로그인/회원가입 (SMS 인증)', '로그인 세션 유지 (자동 로그인)', '관리자 전용 로그인 및 접근 제어'],
    },
    {
      no: 3, name: '관리자 페이지 (디자인 포함)', qty: 1, unit: 2_200_000, total: 2_200_000,
      scope: ['유저 채팅 조회, 사용량 모니터링, 로그인 횟수 조회', '업로드 자료 관리 (이미지/태그, 팩트 DB, 카드뉴스)', '설문 DB 관리 (주관식/객관식, 분기점 없음)', '사용자 계정 관리 (활성화/비활성화, 역할 관리)'],
    },
    {
      no: 4, name: '채팅 AI 웹 개발 비용 (디자인 포함)', qty: 1, unit: 3_800_000, total: 3_800_000,
      scope: ['AI 가드레일 (앞단: 입력 필터링 / 뒷단: 팩트체크, 의학적 조언 아님 고지)', '채팅 내 렌더링 (이미지, 카드뉴스, 설문지 등 멀티미디어)', '감정 분석 기반 캐릭터 표정 변화', '유저 채팅 데일리 로그 기록 및 감정 로그 저장', '대화 내역 저장/조회', '임산부 주수별 페르소나 부여 및 RAG 기반 답변 생성'],
    },
    {
      no: 5, name: '채팅 AI - 워크플로우 구성', qty: 1, unit: 2_500_000, total: 2_500_000,
      scope: ['Block Based 대화 흐름 설계 (노코드 기반)', 'AI 모델 내부 최적화 (모델 설정은 수급자 재량)', '감정 체크인, 주수별 정보 제공, 상담 분기 등 시나리오 구현'],
    },
    {
      no: 6, name: '이미지 세팅 비용', qty: 500, unit: 500, total: 250_000,
      scope: ['캐릭터/감정 이미지 초기 500개 세팅'],
    },
    {
      no: 7, name: '서버 비용 (6개월)', qty: 6, unit: 150_000, total: 900_000,
      scope: ['웹 애플리케이션 서버 및 DB 인스턴스', '도메인 연결, SSL, 환경 구성'],
    },
    {
      no: 8, name: '웹사이트 도메인 (1년)', qty: 1, unit: 50_000, total: 50_000,
      scope: ['도메인 등록'],
    },
    {
      no: 9, name: '푸시 알림 문자 비용', qty: 10_000, unit: 14, total: 140_000,
      scope: ['주수별 맞춤 푸시 알림 발송 (10,000건)'],
    },
    {
      no: 10, name: '생성형 AI API 비용 (6개월)', qty: 6, unit: 100_000, total: 600_000,
      scope: ['채팅 AI 대화 생성 및 추론 비용'],
    },
    {
      no: 11, name: '생성형 AI API - 검색 API (6개월)', qty: 6, unit: 50_000, total: 300_000,
      scope: ['제한된 데이터 소스 내 답변 보강을 위한 검색 기능'],
    },
    { no: 12, name: '무상 A/S (2026.4.30까지)', qty: 1, unit: 0, total: 0 },
    { no: 13, name: '추가 유지보수 (2개월)', qty: 2, unit: 500_000, total: 1_000_000 },
  ],

  // 유지보수
  maintenance: {
    freeAsEnd: '2026년 4월 30일까지',
    extendedSupportMonths: 2,
  },

  // 운영비 포함 기간
  operationPeriod: '2026년 3월~8월',

  // 개인정보 위탁 범위
  personalData: ['이용자 전화번호', '채팅 내역', '감정 데이터', '임신 관련 건강 정보'],

  // 납품물
  deliverables: [
    '전체 프로젝트 소스코드 (Git 저장소)',
    '운영 서버 배포 완료 상태',
    '관리자 페이지 접근 계정',
    '기술 문서 (시스템 구성도, API 문서, 배포 가이드)',
    '관리자 페이지 사용 매뉴얼',
  ],

  // 관할 법원
  court: '서울중앙지방법원',
};

// ============================================================
// 헬퍼
// ============================================================
const fmt = (n) => n.toLocaleString('ko-KR');
const C = CONTRACT;
const V = C.vendor;
const CL = C.client;
const S = C.schedule;
const P = C.payment;
const clientDisplayName = CL.org ? `${CL.org} ${CL.name}` : CL.name;

// ============================================================
// 계약서 생성
// ============================================================
const templatePath = '/Users/jskang/Downloads/blank.hwpx';
const outputPath = '/Users/jskang/si/gynecology-chatbot/docs/계약서_모성간호챗봇.hwpx';

const doc = new HwpxExporter();

// 제목
doc.addHeading('소프트웨어 개발 용역 계약서', 1, 'center');
doc.addLineBreak();

// 전문
doc.addParagraph(`${V.company} (이하 "수급자"라 한다)과 ${clientDisplayName} (이하 "발주자"라 한다)은 아래와 같이 소프트웨어 개발 용역 계약(이하 "본 계약"이라 한다)을 체결한다.`);
doc.addLineBreak();

// 당사자 정보
doc.addTable([
  ['구분', '항목', '내용'],
  ['발주자', '성명', CL.name],
  ['발주자', '소속', CL.org],
  ['발주자', '연락처', CL.contact],
  ['수급자', '상호', V.company],
  ['수급자', '대표이사', V.ceo],
  ['수급자', '사업자등록번호', V.bizNo],
  ['수급자', '연락처', V.contact],
  ['수급자', '주소', V.address],
  ['수급자', '이메일', V.email],
], { header: true });
doc.addLineBreak();

// 제1조
doc.addHeading('제1조 (목적)', 2);
doc.addParagraph(`본 계약은 발주자가 수급자에게 "${C.softwareName}" 소프트웨어(이하 "본 소프트웨어"라 한다)의 개발을 위탁하고, 수급자가 이를 수행함에 있어 양 당사자 간의 권리와 의무를 규정함을 목적으로 한다.`);
doc.addLineBreak();

// 제2조 (개발 범위) - items 데이터에서 자동 생성
doc.addHeading('제2조 (개발 범위)', 2);
doc.addParagraph('수급자가 개발하여 납품할 본 소프트웨어의 범위는 다음과 같으며, 세부 내역은 별첨 "개발 범위 명세서(SOW)"에 따른다.');
doc.addLineBreak();

for (const item of C.items) {
  if (!item.scope) continue; // A/S 항목은 scope 없음 → 제7조에서 처리
  doc.addParagraph(`${item.no}. ${item.name}`);
  for (const s of item.scope) {
    doc.addParagraph(`   - ${s}`);
  }
  doc.addLineBreak();
}
doc.addParagraph('※ 기타 발주자가 요청하는 기능은 계약 범위에 자동 포함되지 아니하며, 범위, 일정, 비용에 대하여 양 당사자가 상호 협의 후 서면 합의한 경우에 한해 반영한다.');
doc.addParagraph('※ 하자보수 및 추가 유지보수에 관한 사항은 제7조에 따른다.');
doc.addLineBreak();

// 제3조 (계약 금액) - items 데이터에서 자동 생성
doc.addHeading('제3조 (계약 금액)', 2);
doc.addParagraph('본 계약의 총 금액은 다음과 같다.');
doc.addLineBreak();

const tableRows = [['No.', '항목', '수량', '단가(원)', '금액(원)']];
for (const item of C.items) {
  tableRows.push([
    String(item.no),
    item.name,
    fmt(item.qty),
    fmt(item.unit),
    fmt(item.total),
  ]);
}
tableRows.push(['', '공급가액', '', '', fmt(P.supply)]);
tableRows.push(['', '부가세 (10%)', '', '', fmt(P.vat)]);
tableRows.push(['', '총 계약 금액 (VAT 포함)', '', '', fmt(P.total)]);
doc.addTable(tableRows, { header: true });
doc.addLineBreak();

// 제4조
doc.addHeading('제4조 (대금 지급)', 2);
doc.addParagraph(`발주자는 총 계약 금액 금 ${fmt(P.total)}원(${P.totalKr}원)을 아래와 같이 분할 지급한다.`);
P.installments.forEach((installment) => {
  doc.addParagraph(`  - ${installment.label}: ${installment.due}, 총 계약 금액의 ${installment.percent}% (${fmt(installment.amount)}원)`);
});
doc.addParagraph(`  - 입금 계좌: ${V.bank} (예금주: ${V.company})`);
doc.addLineBreak();

// 제5조
doc.addHeading('제5조 (개발 기간 및 납품)', 2);
doc.addParagraph('① 본 소프트웨어의 개발 기간 및 납품 일정은 다음과 같다.');
doc.addParagraph(`  1. 착수일: ${S.startDate}`);
doc.addParagraph(`  2. 개발 기간: ${S.startDate} ~ ${S.devEnd} (${S.devPeriod})`);
doc.addParagraph(`  3. QC(품질 검증) 기간: ${S.qcStart} ~ ${S.qcEnd} (${S.qcPeriod}, 발주자 피드백 반영 포함)`);
doc.addParagraph(`  4. 최종 납품일: ${S.deliveryDate}`);
doc.addParagraph('② 수급자는 납품일까지 다음 산출물을 발주자에게 인도한다.');
C.deliverables.forEach((d, i) => doc.addParagraph(`  ${i + 1}. ${d}`));
doc.addParagraph('③ 발주자 측의 자료 제공 지연, 피드백 지연, 요구사항 변경 등으로 인한 일정 지연은 수급자의 귀책사유로 보지 아니하며, 양 당사자 협의하에 납품일을 조정할 수 있다.');
doc.addLineBreak();

// 제6조
doc.addHeading('제6조 (검수)', 2);
doc.addParagraph('① 발주자는 수급자로부터 납품물을 인수한 날로부터 7영업일 이내에 검수를 완료하여야 한다.');
doc.addParagraph('② 검수 기간 내에 발주자가 서면으로 이의를 제기하지 않을 경우, 검수에 합격한 것으로 간주한다.');
doc.addParagraph('③ 검수 결과 하자가 발견된 경우, 수급자는 발주자와 협의하여 합리적인 기간 내에 이를 보수한다.');
doc.addLineBreak();

// 제7조
doc.addHeading('제7조 (하자보수 및 유지보수)', 2);
doc.addParagraph(`① 무상 하자보수: 수급자는 ${C.maintenance.freeAsEnd} 본 계약 범위 내의 하자에 대하여 무상으로 보수한다.`);
doc.addParagraph(`② 추가 유지보수: 무상 하자보수 기간 종료 후 ${C.maintenance.extendedSupportMonths}개월간의 추가 유지보수는 본 계약 금액에 포함되어 별도 추가 과금 없이 제공한다.`);
doc.addParagraph('③ 다음 사항은 위 하자보수 및 추가 유지보수에 포함되지 아니하며, 별도 비용이 발생한다.');
doc.addParagraph('  1. 초기 계약 범위에 포함되지 않은 추가 기능 개발');
doc.addParagraph('  2. 디자인 변경');
doc.addParagraph('  3. 새로운 요구사항 반영');
doc.addParagraph('  4. 발주자의 귀책사유로 인한 장애');
doc.addLineBreak();

// 제8조
doc.addHeading('제8조 (지적재산권)', 2);
doc.addParagraph('① 본 소프트웨어의 소스코드 및 산출물에 대한 저작재산권은 검수 완료 및 대금 완납 시 발주자에게 귀속된다.');
doc.addParagraph('② 단, 수급자가 본 계약 이전에 보유하고 있던 기술, 라이브러리, 프레임워크 등 기존 지적재산권은 수급자에게 귀속되며, 발주자에게 본 소프트웨어 운영에 필요한 범위 내에서 비독점적 사용권을 부여한다.');
doc.addParagraph(`③ 수급자는 본 프로젝트를 통해 개발된 소프트웨어, 소스코드, 데이터베이스 구조, 알고리즘, 프로그램 구조, 설계 문서, UI/UX 등 프로젝트 고유 산출물을 이용하여 동일하거나 실질적으로 유사한 서비스를 직접 개발하거나 제3자에게 제공하는 행위를 계약 종료일로부터 ${C.rights.reuseRestrictionYears}간 하지 아니한다. 다만 수급자가 본 계약 이전부터 보유한 라이브러리, 프레임워크, 개발 도구 및 일반화 가능한 기술 자산의 사용은 제한하지 아니한다.`);
doc.addParagraph('④ 수급자는 본 소프트웨어 개발 과정에서 취득한 발주자의 업무 노하우 등을 제3자에게 유출하지 아니한다.');
doc.addLineBreak();

// 제9조
doc.addHeading('제9조 (비밀유지)', 2);
doc.addParagraph('① 양 당사자는 본 계약의 이행 과정에서 알게 된 상대방의 기술 정보, 사업 정보, 개인정보 등 일체의 비밀 정보를 본 계약의 목적 외에 사용하거나 제3자에게 공개하여서는 아니 된다.');
doc.addParagraph('② 본 조의 의무는 계약 종료 후에도 2년간 유효하다.');
doc.addLineBreak();

// 제10조
doc.addHeading('제10조 (개인정보 보호)', 2);
doc.addParagraph('① 수급자는 본 소프트웨어 개발 및 운영 과정에서 처리하는 개인정보에 대하여 「개인정보 보호법」 등 관련 법령을 준수한다.');
doc.addParagraph('② 본 소프트웨어가 의료 관련 정보를 다루는 특성상, 수급자는 이용자의 건강 정보에 대한 보안 조치를 취하며, 해당 정보를 목적 외로 활용하지 아니한다.');
doc.addParagraph('③ 수급자는 개인정보 처리에 관한 기술적·관리적 보호조치를 취한다.');
doc.addLineBreak();

// 제11조
doc.addHeading('제11조 (개인정보 처리 위탁)', 2);
doc.addParagraph('① 발주자는 본 소프트웨어 운영에 필요한 개인정보 처리 업무를 수급자에게 위탁하며, 수급자는 「개인정보 보호법」 제26조에 따라 수탁자로서의 의무를 준수한다.');
doc.addParagraph('② 수급자의 개인정보 처리 위탁 범위는 다음과 같다.');
doc.addParagraph('  1. 위탁 업무: 챗봇 시스템 개발, 운영 및 유지보수');
doc.addParagraph(`  2. 처리하는 개인정보: ${C.personalData.join(', ')}`);
doc.addParagraph('③ 수급자는 위탁받은 개인정보를 제3자에게 제공하거나 목적 외로 이용할 수 없다.');
doc.addParagraph('④ 수급자는 개인정보 보안사고 발생 시 즉시 발주자에게 통지한다.');
doc.addParagraph('⑤ 계약 종료 시 수급자는 위탁받은 개인정보를 지체 없이 파기하거나 발주자에게 반환한다.');
doc.addLineBreak();

// 제12조
doc.addHeading('제12조 (의료 정보 면책)', 2);
doc.addParagraph('① 본 소프트웨어는 「의료법」상 의료행위에 해당하지 아니하며, 의학적 진단·처방을 제공하지 아니한다.');
doc.addParagraph('② 본 소프트웨어의 AI 응답은 참고용 정보이며, 이용자에게 전문 의료진 상담을 권고하는 안내 문구를 UI에 표시한다.');
doc.addParagraph('③ 이용자가 본 소프트웨어의 정보에 의존하여 발생한 의료적 피해에 대하여 수급자는 기술적 결함에 한하여 책임을 부담하며, 의료 정보의 정확성에 대한 최종 판단은 발주자의 책임으로 한다.');
doc.addParagraph('④ 본 소프트웨어에 입력·저장·표시되는 의료 데이터, 팩트 DB, 설문 내용, 카드뉴스 등 일체의 콘텐츠는 발주자가 제공·관리하며, 해당 데이터의 정확성, 적법성 및 이로 인해 발생하는 책임은 전적으로 발주자에게 귀속된다. 수급자는 데이터의 기술적 저장·전송·표시에 대한 책임만을 부담한다.');
doc.addLineBreak();

// 제13조
doc.addHeading('제13조 (운영 비용)', 2);
doc.addParagraph(`① 본 계약 금액에는 서버 비용(6개월, ${C.operationPeriod}), AI API 비용(6개월), SMS 본인인증 비용, 푸시 알림 비용이 포함되어 있다.`);
doc.addParagraph('② 상기 포함 기간 종료 이후의 운영 비용은 양 당사자가 별도 협의하여 결정한다.');
doc.addLineBreak();

// 제14조
doc.addHeading('제14조 (계약 변경)', 2);
doc.addParagraph('① 본 계약의 내용을 변경하고자 할 경우 양 당사자의 서면 합의에 의한다.');
doc.addParagraph('② 개발 범위, 기능, 디자인 등의 변경으로 추가 비용이 발생하는 경우, 양 당사자가 협의하여 금액을 결정한다.');
doc.addLineBreak();

// 제15조
doc.addHeading('제15조 (계약 해제 및 해지)', 2);
doc.addParagraph('① 양 당사자는 상대방이 본 계약의 중요한 의무를 위반하고, 서면 최고 후 14일 이내에 시정하지 아니하는 경우 본 계약을 해제 또는 해지할 수 있다.');
doc.addParagraph('② 발주자의 사유로 계약을 해지하는 경우, 수급자가 이미 수행한 작업에 대한 비용은 반환하지 아니한다.');
doc.addParagraph('③ 수급자의 귀책사유로 계약이 해지되는 경우, 수급자는 기 수령한 대금 중 미이행 부분에 해당하는 금액을 발주자에게 반환한다.');
doc.addLineBreak();

// 제16조
doc.addHeading('제16조 (손해배상)', 2);
doc.addParagraph(`양 당사자는 본 계약의 위반으로 상대방에게 손해를 끼친 경우 그 손해를 배상할 책임이 있다. 단, 수급자의 손해배상 총액은 본 계약의 총 계약 금액을 초과하지 아니한다.`);
doc.addLineBreak();

// 제17조
doc.addHeading('제17조 (불가항력)', 2);
doc.addParagraph('천재지변, 전쟁, 정부 규제, 전염병 등 양 당사자의 통제 범위를 벗어난 사유로 인하여 본 계약의 이행이 지연 또는 불가능하게 된 경우, 해당 당사자는 그 책임을 면한다.');
doc.addLineBreak();

// 제18조
doc.addHeading('제18조 (분쟁 해결)', 2);
doc.addParagraph('① 본 계약과 관련하여 분쟁이 발생한 경우 양 당사자는 원만한 합의를 위해 성실히 협의한다.');
doc.addParagraph(`② 협의가 이루어지지 않는 경우 ${C.court}을 관할 법원으로 한다.`);
doc.addLineBreak();

// 제19조
doc.addHeading('제19조 (기타)', 2);
doc.addParagraph('① 본 계약에 명시되지 않은 사항은 「소프트웨어산업 진흥법」, 「민법」 등 관련 법령 및 상관례에 따른다.');
doc.addParagraph('② 본 계약은 2부를 작성하여 양 당사자가 각 1부씩 보관한다.');
doc.addParagraph('③ 본 계약의 별첨 문서(개발 범위 명세서)는 본 계약의 일부를 구성한다.');
doc.addLineBreak();
doc.addLineBreak();

// 날짜 + 서명
doc.addParagraph('2026년       월       일');
doc.addLineBreak();

doc.addTable([
  ['', '발주자', '수급자'],
  ['기관/성명', clientDisplayName, `${V.company} 대표이사 ${V.ceo}`],
  ['연락처', CL.contact, V.contact],
  ['서명', '', ''],
], { header: true });
doc.addLineBreak();

doc.addParagraph('별첨: 개발 범위 명세서 (DEVELOPMENT_SOW)');

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
