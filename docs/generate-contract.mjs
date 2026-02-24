import JSZip from 'jszip';
import { readFile, writeFile } from 'fs/promises';

// ============================================================
// blank.hwpx 템플릿 기반 HWPX 계약서 생성
// 전략: header.xml 등 모든 파일 유지, section0.xml만 교체
// ============================================================

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// --- 네임스페이스 (blank.hwpx 원본 그대로) ---
const NS_DECL = [
  'xmlns:ha="http://www.hancom.co.kr/hwpml/2011/app"',
  'xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph"',
  'xmlns:hp10="http://www.hancom.co.kr/hwpml/2016/paragraph"',
  'xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section"',
  'xmlns:hc="http://www.hancom.co.kr/hwpml/2011/core"',
  'xmlns:hh="http://www.hancom.co.kr/hwpml/2011/head"',
  'xmlns:hhs="http://www.hancom.co.kr/hwpml/2011/history"',
  'xmlns:hm="http://www.hancom.co.kr/hwpml/2011/master-page"',
  'xmlns:hpf="http://www.hancom.co.kr/schema/2011/hpf"',
  'xmlns:dc="http://purl.org/dc/elements/1.1/"',
  'xmlns:opf="http://www.idpf.org/2007/opf/"',
  'xmlns:ooxmlchart="http://www.hancom.co.kr/hwpml/2016/ooxmlchart"',
  'xmlns:hwpunitchar="http://www.hancom.co.kr/hwpml/2016/HwpUnitChar"',
  'xmlns:epub="http://www.idpf.org/2007/ops"',
  'xmlns:config="urn:oasis:names:tc:opendocument:xmlns:config:1.0"',
].join(' ');

// --- secPr (blank.hwpx 원본 그대로 복사) ---
const SEC_PR = `<hp:secPr id="" textDirection="HORIZONTAL" spaceColumns="1134" tabStop="8000" tabStopVal="4000" tabStopUnit="HWPUNIT" outlineShapeIDRef="1" memoShapeIDRef="0" textVerticalWidthHead="0" masterPageCnt="0"><hp:grid lineGrid="0" charGrid="0" wonggojiFormat="0"/><hp:startNum pageStartsOn="BOTH" page="0" pic="0" tbl="0" equation="0"/><hp:visibility hideFirstHeader="0" hideFirstFooter="0" hideFirstMasterPage="0" border="SHOW_ALL" fill="SHOW_ALL" hideFirstPageNum="0" hideFirstEmptyLine="0" showLineNumber="0"/><hp:lineNumberShape restartType="0" countBy="0" distance="0" startNumber="0"/><hp:pagePr landscape="WIDELY" width="59528" height="84186" gutterType="LEFT_ONLY"><hp:margin header="4252" footer="4252" gutter="0" left="5669" right="5669" top="2834" bottom="2834"/></hp:pagePr><hp:footNotePr><hp:autoNumFormat type="DIGIT" userChar="" prefixChar="" suffixChar=")" supscript="0"/><hp:noteLine length="-1" type="SOLID" width="0.12 mm" color="#000000"/><hp:noteSpacing betweenNotes="283" belowLine="567" aboveLine="850"/><hp:numbering type="CONTINUOUS" newNum="1"/><hp:placement place="EACH_COLUMN" beneathText="0"/></hp:footNotePr><hp:endNotePr><hp:autoNumFormat type="DIGIT" userChar="" prefixChar="" suffixChar=")" supscript="0"/><hp:noteLine length="14692344" type="SOLID" width="0.12 mm" color="#000000"/><hp:noteSpacing betweenNotes="0" belowLine="567" aboveLine="850"/><hp:numbering type="CONTINUOUS" newNum="1"/><hp:placement place="END_OF_DOCUMENT" beneathText="0"/></hp:endNotePr><hp:pageBorderFill type="BOTH" borderFillIDRef="1" textBorder="PAPER" headerInside="0" footerInside="0" fillArea="PAPER"><hp:offset left="1417" right="1417" top="1417" bottom="1417"/></hp:pageBorderFill><hp:pageBorderFill type="EVEN" borderFillIDRef="1" textBorder="PAPER" headerInside="0" footerInside="0" fillArea="PAPER"><hp:offset left="1417" right="1417" top="1417" bottom="1417"/></hp:pageBorderFill><hp:pageBorderFill type="ODD" borderFillIDRef="1" textBorder="PAPER" headerInside="0" footerInside="0" fillArea="PAPER"><hp:offset left="1417" right="1417" top="1417" bottom="1417"/></hp:pageBorderFill></hp:secPr>`;

// --- charPrIDRef 맵핑 (header.xml 기존 정의 활용) ---
// 0: 10pt 본문 (바탕)
// 7: 12pt (소제목)
// 9: 14pt (견고딕14, 중제목)

// --- paraPrIDRef 맵핑 ---
// 1: JUSTIFY (바탕글 기본)
// 22: JUSTIFY (secPr 포함 첫 문단용)

let paraId = 2613180041; // 템플릿과 동일한 시작 ID

function nextId() {
  return paraId++;
}

// 첫 번째 문단 (secPr + colPr 포함, 템플릿 구조 그대로)
function firstPara() {
  return `<hp:p id="${nextId()}" paraPrIDRef="22" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0"><hp:run charPrIDRef="7">${SEC_PR}<hp:ctrl><hp:colPr id="" type="NEWSPAPER" layout="LEFT" colCount="1" sameSz="1" sameGap="0"/></hp:ctrl></hp:run><hp:run charPrIDRef="0"><hp:t></hp:t></hp:run></hp:p>`;
}

// 일반 본문 문단
function textPara(text, charPr = 0, paraPr = 1, style = 0) {
  return `<hp:p id="${nextId()}" paraPrIDRef="${paraPr}" styleIDRef="${style}" pageBreak="0" columnBreak="0" merged="0"><hp:run charPrIDRef="${charPr}"><hp:t>${esc(text)}</hp:t></hp:run></hp:p>`;
}

// 빈 문단
function emptyPara() {
  return `<hp:p id="${nextId()}" paraPrIDRef="1" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0"><hp:run charPrIDRef="0"><hp:t></hp:t></hp:run></hp:p>`;
}

// ============================================================
// 계약서 내용 구성 (텍스트 기반, 테이블 없이)
// ============================================================
function buildContractSection() {
  const p = []; // 문단 배열

  // 첫 문단 (secPr 포함)
  p.push(firstPara());

  // 제목
  p.push(emptyPara());
  p.push(textPara('소프트웨어 개발 용역 계약서', 9, 1, 0));
  p.push(emptyPara());

  // 전문
  p.push(textPara('주식회사 룸821 (이하 "수급자"라 한다)과 이예림 (이하 "발주자"라 한다)은 아래와 같이 소프트웨어 개발 용역 계약(이하 "본 계약"이라 한다)을 체결한다.'));
  p.push(emptyPara());

  // 당사자 정보
  p.push(textPara('【발주자】'));
  p.push(textPara('  성명: 이예림'));
  p.push(textPara('  소속:'));
  p.push(textPara('  연락처:'));
  p.push(emptyPara());
  p.push(textPara('【수급자】'));
  p.push(textPara('  상호: 주식회사 룸821'));
  p.push(textPara('  대표자: 강정석'));
  p.push(textPara('  사업자등록번호: 285-87-02954'));
  p.push(textPara('  연락처: 010-2678-4241'));
  p.push(textPara('  주소: 서울특별시 서대문구 연세로 2다길 20, 211호'));
  p.push(textPara('  이메일: contact-us@room821.im'));
  p.push(emptyPara());

  // 제1조
  p.push(textPara('제1조 (목적)', 7));
  p.push(textPara('본 계약은 발주자가 수급자에게 "모성간호 챗봇" 소프트웨어(이하 "본 소프트웨어"라 한다)의 개발을 위탁하고, 수급자가 이를 수행함에 있어 양 당사자 간의 권리와 의무를 규정함을 목적으로 한다.'));
  p.push(emptyPara());

  // 제2조
  p.push(textPara('제2조 (개발 범위)', 7));
  p.push(textPara('수급자가 개발하여 납품할 본 소프트웨어의 범위는 다음과 같으며, 세부 내역은 별첨 "개발 범위 명세서(SOW)"에 따른다.'));
  p.push(textPara('  1. 임산부 대상 AI 기반 모성간호 상담 챗봇 웹 서비스 (모바일 반응형)'));
  p.push(textPara('  2. 전화번호 인증 기반 회원가입 및 로그인 시스템'));
  p.push(textPara('  3. 관리자 페이지 (유저 모니터링, 자료 관리, 설문 관리)'));
  p.push(textPara('  4. AI 채팅 시스템 (가드레일, 감정 분석, RAG 기반 답변, 워크플로우)'));
  p.push(textPara('  5. 서버 인프라, 도메인, 푸시 알림, AI API 연동'));
  p.push(emptyPara());

  // 제3조
  p.push(textPara('제3조 (계약 금액)', 7));
  p.push(textPara('본 계약의 총 금액은 다음과 같다.'));
  p.push(emptyPara());
  p.push(textPara('  No.  항목                                      수량      단가(원)      금액(원)'));
  p.push(textPara('  ─────────────────────────────────────────────────────────────────────────'));
  p.push(textPara('   1   프로젝트 매니징                              1    1,000,000    1,000,000'));
  p.push(textPara('   2   회원가입 및 관리자 패널                      1      400,000      400,000'));
  p.push(textPara('   3   관리자 페이지 (디자인 포함)                  1    2,200,000    2,200,000'));
  p.push(textPara('   4   채팅 AI 웹 개발 비용                        1    3,800,000    3,800,000'));
  p.push(textPara('   5   채팅 AI - 워크플로우 구성                    1    2,500,000    2,500,000'));
  p.push(textPara('   6   이미지 세팅 비용                           500          500      250,000'));
  p.push(textPara('   7   서버 비용 (6개월)                            6      150,000      900,000'));
  p.push(textPara('   8   웹사이트 도메인 (1년)                        1       50,000       50,000'));
  p.push(textPara('   9   푸시 알림 문자 비용                     10,000           14      140,000'));
  p.push(textPara('  10   생성형 AI API 비용 (6개월)                   6      100,000      600,000'));
  p.push(textPara('  11   생성형 AI API - 검색 API (6개월)             6       50,000      300,000'));
  p.push(textPara('  12   무상 A/S (2026.4.30까지)                     1            0            0'));
  p.push(textPara('  13   추가 A/S (2개월)                             2      500,000    1,000,000'));
  p.push(textPara('  ─────────────────────────────────────────────────────────────────────────'));
  p.push(textPara('       공급가액                                                     13,140,000'));
  p.push(textPara('       부가세 (10%)                                                  1,314,000'));
  p.push(textPara('       총 계약 금액 (VAT 포함)                                      14,454,000'));
  p.push(emptyPara());

  // 제4조
  p.push(textPara('제4조 (대금 지급)', 7));
  p.push(textPara('발주자는 본 계약 체결과 동시에 총 계약 금액 금 14,454,000원(일천사백사십오만사천원)을 일시납으로 수급자에게 지급한다.'));
  p.push(textPara('  - 입금 계좌: 기업은행 054-157695-04-016 (예금주: 주식회사 룸821)'));
  p.push(emptyPara());

  // 제5조
  p.push(textPara('제5조 (개발 기간 및 납품)', 7));
  p.push(textPara('① 본 소프트웨어의 개발 기간 및 납품 일정은 다음과 같다.'));
  p.push(textPara('  1. 착수일: 2026년 3월 14일'));
  p.push(textPara('  2. 개발 기간: 2026년 3월 14일 ~ 2026년 3월 21일 (약 1주)'));
  p.push(textPara('  3. QC(품질 검증) 기간: 2026년 3월 22일 ~ 2026년 4월 10일 (약 3주, 발주자 피드백 반영 포함)'));
  p.push(textPara('  4. 최종 납품일: 2026년 4월 10일 (금)'));
  p.push(textPara('② 수급자는 납품일까지 다음 산출물을 발주자에게 인도한다.'));
  p.push(textPara('  1. 전체 프로젝트 소스코드 (Git 저장소)'));
  p.push(textPara('  2. 운영 서버 배포 완료 상태'));
  p.push(textPara('  3. 관리자 페이지 접근 계정'));
  p.push(textPara('  4. 기술 문서 (시스템 구성도, API 문서, 배포 가이드)'));
  p.push(textPara('  5. 관리자 페이지 사용 매뉴얼'));
  p.push(textPara('③ 발주자 측의 자료 제공 지연, 피드백 지연, 요구사항 변경 등으로 인한 일정 지연은 수급자의 귀책사유로 보지 아니하며, 양 당사자 협의하에 납품일을 조정할 수 있다.'));
  p.push(emptyPara());

  // 제6조
  p.push(textPara('제6조 (검수)', 7));
  p.push(textPara('① 발주자는 수급자로부터 납품물을 인수한 날로부터 7영업일 이내에 검수를 완료하여야 한다.'));
  p.push(textPara('② 검수 기간 내에 발주자가 서면으로 이의를 제기하지 않을 경우, 검수에 합격한 것으로 간주한다.'));
  p.push(textPara('③ 검수 결과 하자가 발견된 경우, 수급자는 발주자와 협의하여 합리적인 기간 내에 이를 보수한다.'));
  p.push(emptyPara());

  // 제7조
  p.push(textPara('제7조 (하자보수 및 유지보수)', 7));
  p.push(textPara('① 무상 하자보수: 수급자는 납품일로부터 2026년 4월 30일까지 본 계약 범위 내의 하자에 대하여 무상으로 보수한다.'));
  p.push(textPara('② 유상 유지보수: 무상 하자보수 기간 종료 후 2개월간(월 500,000원) 유상 유지보수를 제공한다.'));
  p.push(textPara('③ 다음 사항은 무상 하자보수에 포함되지 아니하며, 별도 비용이 발생한다.'));
  p.push(textPara('  1. 초기 계약 범위에 포함되지 않은 추가 기능 개발'));
  p.push(textPara('  2. 디자인 변경'));
  p.push(textPara('  3. 새로운 요구사항 반영'));
  p.push(textPara('  4. 발주자의 귀책사유로 인한 장애'));
  p.push(emptyPara());

  // 제8조
  p.push(textPara('제8조 (지적재산권)', 7));
  p.push(textPara('① 본 소프트웨어의 소스코드 및 산출물에 대한 저작재산권은 대금 완납 시 발주자에게 귀속된다.'));
  p.push(textPara('② 단, 수급자가 본 계약 이전에 보유하고 있던 기술, 라이브러리, 프레임워크 등 기존 지적재산권은 수급자에게 귀속되며, 발주자에게 본 소프트웨어 운영에 필요한 범위 내에서 비독점적 사용권을 부여한다.'));
  p.push(textPara('③ 수급자는 본 소프트웨어 개발 과정에서 취득한 발주자의 업무 노하우 등을 제3자에게 유출하지 아니한다.'));
  p.push(emptyPara());

  // 제9조
  p.push(textPara('제9조 (비밀유지)', 7));
  p.push(textPara('① 양 당사자는 본 계약의 이행 과정에서 알게 된 상대방의 기술 정보, 사업 정보, 개인정보 등 일체의 비밀 정보를 본 계약의 목적 외에 사용하거나 제3자에게 공개하여서는 아니 된다.'));
  p.push(textPara('② 본 조의 의무는 계약 종료 후에도 2년간 유효하다.'));
  p.push(emptyPara());

  // 제10조
  p.push(textPara('제10조 (개인정보 보호)', 7));
  p.push(textPara('① 수급자는 본 소프트웨어 개발 및 운영 과정에서 처리하는 개인정보에 대하여 「개인정보 보호법」 등 관련 법령을 준수한다.'));
  p.push(textPara('② 본 소프트웨어가 의료 관련 정보를 다루는 특성상, 수급자는 이용자의 건강 정보에 대한 보안 조치를 취하며, 해당 정보를 목적 외로 활용하지 아니한다.'));
  p.push(textPara('③ 수급자는 개인정보 처리에 관한 기술적·관리적 보호조치를 취한다.'));
  p.push(emptyPara());

  // 제11조
  p.push(textPara('제11조 (개인정보 처리 위탁)', 7));
  p.push(textPara('① 발주자는 본 소프트웨어 운영에 필요한 개인정보 처리 업무를 수급자에게 위탁하며, 수급자는 「개인정보 보호법」 제26조에 따라 수탁자로서의 의무를 준수한다.'));
  p.push(textPara('② 수급자의 개인정보 처리 위탁 범위는 다음과 같다.'));
  p.push(textPara('  1. 위탁 업무: 챗봇 시스템 개발, 운영 및 유지보수'));
  p.push(textPara('  2. 처리하는 개인정보: 이용자 전화번호, 채팅 내역, 감정 데이터, 임신 관련 건강 정보'));
  p.push(textPara('③ 수급자는 위탁받은 개인정보를 제3자에게 제공하거나 목적 외로 이용할 수 없다.'));
  p.push(textPara('④ 수급자는 개인정보 보안사고 발생 시 즉시 발주자에게 통지한다.'));
  p.push(textPara('⑤ 계약 종료 시 수급자는 위탁받은 개인정보를 지체 없이 파기하거나 발주자에게 반환한다.'));
  p.push(emptyPara());

  // 제12조
  p.push(textPara('제12조 (의료 정보 면책)', 7));
  p.push(textPara('① 본 소프트웨어는 「의료법」상 의료행위에 해당하지 아니하며, 의학적 진단·처방을 제공하지 아니한다.'));
  p.push(textPara('② 본 소프트웨어의 AI 응답은 참고용 정보이며, 이용자에게 전문 의료진 상담을 권고하는 안내 문구를 UI에 표시한다.'));
  p.push(textPara('③ 이용자가 본 소프트웨어의 정보에 의존하여 발생한 의료적 피해에 대하여 수급자는 기술적 결함에 한하여 책임을 부담하며, 의료 정보의 정확성에 대한 최종 판단은 발주자의 책임으로 한다.'));
  p.push(textPara('④ 본 소프트웨어에 입력·저장·표시되는 의료 데이터, 팩트 DB, 설문 내용, 카드뉴스 등 일체의 콘텐츠는 발주자가 제공·관리하며, 해당 데이터의 정확성, 적법성 및 이로 인해 발생하는 책임은 전적으로 발주자에게 귀속된다. 수급자는 데이터의 기술적 저장·전송·표시에 대한 책임만을 부담한다.'));
  p.push(emptyPara());

  // 제13조
  p.push(textPara('제13조 (운영 비용)', 7));
  p.push(textPara('① 본 계약 금액에는 서버 비용(6개월, 2026년 3월~8월), AI API 비용(6개월), SMS 본인인증 비용, 푸시 알림 비용이 포함되어 있다.'));
  p.push(textPara('② 상기 포함 기간 종료 이후의 운영 비용은 양 당사자가 별도 협의하여 결정한다.'));
  p.push(emptyPara());

  // 제14조
  p.push(textPara('제14조 (계약 변경)', 7));
  p.push(textPara('① 본 계약의 내용을 변경하고자 할 경우 양 당사자의 서면 합의에 의한다.'));
  p.push(textPara('② 개발 범위, 기능, 디자인 등의 변경으로 추가 비용이 발생하는 경우, 양 당사자가 협의하여 금액을 결정한다.'));
  p.push(emptyPara());

  // 제15조
  p.push(textPara('제15조 (계약 해제 및 해지)', 7));
  p.push(textPara('① 양 당사자는 상대방이 본 계약의 중요한 의무를 위반하고, 서면 최고 후 14일 이내에 시정하지 아니하는 경우 본 계약을 해제 또는 해지할 수 있다.'));
  p.push(textPara('② 발주자의 사유로 계약을 해지하는 경우, 수급자가 이미 수행한 작업에 대한 비용은 반환하지 아니한다.'));
  p.push(textPara('③ 수급자의 귀책사유로 계약이 해지되는 경우, 수급자는 기 수령한 대금 중 미이행 부분에 해당하는 금액을 발주자에게 반환한다.'));
  p.push(emptyPara());

  // 제16조
  p.push(textPara('제16조 (손해배상)', 7));
  p.push(textPara('양 당사자는 본 계약의 위반으로 상대방에게 손해를 끼친 경우 그 손해를 배상할 책임이 있다. 단, 수급자의 손해배상 총액은 본 계약의 총 계약 금액을 초과하지 아니한다.'));
  p.push(emptyPara());

  // 제17조
  p.push(textPara('제17조 (불가항력)', 7));
  p.push(textPara('천재지변, 전쟁, 정부 규제, 전염병 등 양 당사자의 통제 범위를 벗어난 사유로 인하여 본 계약의 이행이 지연 또는 불가능하게 된 경우, 해당 당사자는 그 책임을 면한다.'));
  p.push(emptyPara());

  // 제18조
  p.push(textPara('제18조 (분쟁 해결)', 7));
  p.push(textPara('① 본 계약과 관련하여 분쟁이 발생한 경우 양 당사자는 원만한 합의를 위해 성실히 협의한다.'));
  p.push(textPara('② 협의가 이루어지지 않는 경우 서울중앙지방법원을 관할 법원으로 한다.'));
  p.push(emptyPara());

  // 제19조
  p.push(textPara('제19조 (기타)', 7));
  p.push(textPara('① 본 계약에 명시되지 않은 사항은 「소프트웨어산업 진흥법」, 「민법」 등 관련 법령 및 상관례에 따른다.'));
  p.push(textPara('② 본 계약은 2부를 작성하여 양 당사자가 각 1부씩 보관한다.'));
  p.push(textPara('③ 본 계약의 별첨 문서(개발 범위 명세서)는 본 계약의 일부를 구성한다.'));
  p.push(emptyPara());
  p.push(emptyPara());

  // 날짜
  p.push(textPara('2026년       월       일'));
  p.push(emptyPara());
  p.push(emptyPara());

  // 서명란
  p.push(textPara('【발주자】'));
  p.push(textPara('  상호/성명:  이예림'));
  p.push(textPara('  연락처:'));
  p.push(textPara('  서명:'));
  p.push(emptyPara());
  p.push(textPara('【수급자】'));
  p.push(textPara('  상호/성명:  주식회사 룸821 / 강정석'));
  p.push(textPara('  연락처:  010-2678-4241'));
  p.push(textPara('  서명:'));
  p.push(emptyPara());
  p.push(emptyPara());

  // 별첨 안내
  p.push(textPara('별첨: 개발 범위 명세서 (DEVELOPMENT_SOW)'));

  return p.join('');
}

// ============================================================
// 메인: blank.hwpx 로드 → section0.xml만 교체 → 저장
// ============================================================
const templatePath = '/Users/jskang/Downloads/blank.hwpx';
const outputPath = '/Users/jskang/si/gynecology-chatbot/docs/계약서_모성간호챗봇.hwpx';

const templateBytes = await readFile(templatePath);
const zip = await JSZip.loadAsync(templateBytes);

// section0.xml만 교체
const newSection = `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?><hs:sec ${NS_DECL}>${buildContractSection()}</hs:sec>`;
zip.file('Contents/section0.xml', newSection);

// 미리보기 텍스트 업데이트 (선택적)
zip.file('Preview/PrvText.txt', '소프트웨어 개발 용역 계약서\r\n모성간호 챗봇 프로젝트');

const data = await zip.generateAsync({
  type: 'uint8array',
  compression: 'DEFLATE',
  compressionOptions: { level: 6 },
  // mimetype은 압축하지 않아야 함
  encodeFileName: (name) => name,
});

await writeFile(outputPath, data);
console.log(`HWPX 생성 완료: ${outputPath} (${data.length} bytes)`);
console.log('템플릿: blank.hwpx (header.xml, settings.xml 등 모든 원본 유지)');
console.log('교체: section0.xml만 계약서 내용으로 교체');
