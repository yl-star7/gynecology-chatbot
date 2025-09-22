

/**
 * 의료 안전성 검증 및 컴플라이언스 시스템
 *
 * 한국 의료법, 개인정보보호법, HIPAA 준수
 * 부인과 전문 안전성 가이드라인 적용
 */

export interface MedicalSafetyConfig {
  strictMode: boolean; // 엄격 모드 (병원용 vs 일반용)
  emergencyDetection: boolean;
  drugInteractionCheck: boolean;
  pregnancySafetyCheck: boolean;
  complianceLogging: boolean;
}

export interface SafetyViolation {
  type: 'emergency' | 'drug_interaction' | 'pregnancy_risk' | 'medical_advice' | 'personal_data';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  action: 'block_response' | 'add_warning' | 'log_only' | 'require_disclaimer';
  context?: string;
}

export interface ComplianceAudit {
  messageId: string;
  timestamp: Date;
  userId?: string;
  query: string;
  response: string;
  safetyViolations: SafetyViolation[];
  medicalEntities: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

const DEFAULT_SAFETY_CONFIG: MedicalSafetyConfig = {
  strictMode: true,
  emergencyDetection: true,
  drugInteractionCheck: true,
  pregnancySafetyCheck: true,
  complianceLogging: true,
};

/**
 * 의료 안전성 검증 클래스
 */
export class MedicalSafetyValidator {
  private config: MedicalSafetyConfig;
  private auditLog: ComplianceAudit[] = [];

  constructor(config: Partial<MedicalSafetyConfig> = {}) {
    this.config = { ...DEFAULT_SAFETY_CONFIG, ...config };
  }

  /**
   * 사용자 쿼리 안전성 사전 검증
   */
  async validateQuery(query: string, context?: ChatContext): Promise<{
    isValid: boolean;
    violations: SafetyViolation[];
    warnings: MedicalWarning[];
  }> {
    const violations: SafetyViolation[] = [];
    const warnings: MedicalWarning[] = [];

    // 1. 응급상황 감지
    if (this.config.emergencyDetection) {
      const emergencyViolations = this.detectEmergencySymptoms(query);
      violations.push(...emergencyViolations);
    }

    // 2. 개인정보 감지
    const privacyViolations = this.detectPersonalInformation(query);
    violations.push(...privacyViolations);

    // 3. 부적절한 의료 조언 요청 감지
    const adviceViolations = this.detectInappropriateMedicalAdvice(query);
    violations.push(...adviceViolations);

    // 4. 임신 관련 위험 요소 감지
    if (this.config.pregnancySafetyCheck && context?.pregnancyWeek) {
      const pregnancyViolations = this.detectPregnancyRisks(query, context);
      violations.push(...pregnancyViolations);
    }

    // 5. 약물 상호작용 체크
    if (this.config.drugInteractionCheck && context?.medications) {
      const drugViolations = await this.checkDrugInteractions(query, context.medications);
      violations.push(...drugViolations);
    }
    // 경고 생성
    for (const violation of violations) {
      if (violation.action === 'add_warning' || violation.action === 'require_disclaimer') {
        warnings.push({
          severity: violation.severity === 'critical' ? 'urgent' :
                   violation.severity === 'high' ? 'warning' : 'info',
          message: violation.message,
          action: violation.action === 'require_disclaimer' ?
                 '본 서비스는 의료진 상담을 대체할 수 없습니다. 정확한 진단과 치료를 위해서는 반드시 의료기관을 방문하시기 바랍니다.' :
                 undefined,
        });
      }
    }

    const isValid = !violations.some(v => v.action === 'block_response');

    return { isValid, violations, warnings };
  }

  /**
   * AI 응답 안전성 검증
   */
  async validateResponse(
    response: string,
    query: string,
    context?: ChatContext
  ): Promise<{
    isValid: boolean;
    violations: SafetyViolation[];
    sanitizedResponse?: string;
    requiredWarnings: MedicalWarning[];
  }> {
    const violations: SafetyViolation[] = [];
    const requiredWarnings: MedicalWarning[] = [];

    // 1. 진단/처방 언급 검사
    const diagnosticViolations = this.detectDiagnosticStatements(response);
    violations.push(...diagnosticViolations);

    // 2. 약물 추천 검사
    const medicationViolations = this.detectMedicationRecommendations(response);
    violations.push(...medicationViolations);

    // 3. 응급상황 대응 적절성 검사
    const emergencyResponseViolations = this.validateEmergencyResponse(response, query);
    violations.push(...emergencyResponseViolations);

    // 4. 임신 단계별 적절성 검사
    if (context?.pregnancyWeek) {
      const pregnancyStageViolations = this.validatePregnancyStageAppropriate(
        response,
        context.pregnancyWeek
      );
      violations.push(...pregnancyStageViolations);
    }

    // 5. 의료진 상담 권고 누락 검사
    const consultationViolations = this.checkMedicalConsultationRecommendation(response, query);
    violations.push(...consultationViolations);

    // 응답 삭제/수정이 필요한 경우
    let sanitizedResponse = response;
    if (violations.some(v => v.action === 'block_response')) {
      sanitizedResponse = this.generateSafeAlternativeResponse(query, violations);
    }

    // 필수 경고 생성
    for (const violation of violations) {
      if (violation.action === 'add_warning') {
        requiredWarnings.push({
          severity: violation.severity === 'critical' ? 'urgent' :
                   violation.severity === 'high' ? 'warning' : 'info',
          message: violation.message,
        });
      }
    }

    const isValid = !violations.some(v => v.action === 'block_response');

    return {
      isValid,
      violations,
      sanitizedResponse: sanitizedResponse !== response ? sanitizedResponse : undefined,
      requiredWarnings
    };
  }

  /**
   * 응급상황 증상 감지
   */
  private detectEmergencySymptoms(text: string): SafetyViolation[] {
    const violations: SafetyViolation[] = [];

    const criticalSymptoms = [
      // 출혈 관련
      { pattern: /대량.*출혈|많은.*출혈|심한.*출혈/gi, context: '대량 출혈' },
      { pattern: /의식.*잃|기절|실신/gi, context: '의식 소실' },
      { pattern: /호흡.*곤란|숨.*쉬기.*어려|질식/gi, context: '호흡곤란' },
      { pattern: /경련|발작|떨림.*심한/gi, context: '경련/발작' },

      // 임신 관련 응급상황
      { pattern: /양수.*터짐|양수.*파열|물.*터짐/gi, context: '양수 파열' },
      { pattern: /태동.*없음|태동.*멈춤|아기.*움직이지.*않음/gi, context: '태동 감소/소실' },
      { pattern: /조기.*진통|37주.*이전.*진통/gi, context: '조기 진통' },
      { pattern: /고혈압.*위험|자간전증|자간증/gi, context: '임신중독증' },
    ];

    for (const symptom of criticalSymptoms) {
      if (symptom.pattern.test(text)) {
        violations.push({
          type: 'emergency',
          severity: 'critical',
          message: `${symptom.context} 증상이 감지되었습니다. 즉시 응급실을 방문하시거나 119에 연락하세요.`,
          action: 'add_warning',
          context: symptom.context,
        });
      }
    }

    return violations;
  }

  /**
   * 개인정보 감지
   */
  private detectPersonalInformation(text: string): SafetyViolation[] {
    const violations: SafetyViolation[] = [];

    const personalDataPatterns = [
      { pattern: /\d{6}-[1-4]\d{6}/, type: '주민등록번호' },
      { pattern: /010-\d{4}-\d{4}|01[016789]-\d{3,4}-\d{4}/, type: '휴대폰번호' },
      { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, type: '이메일' },
      { pattern: /(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주).*구.*동.*번지/, type: '상세주소' },
    ];

    for (const pattern of personalDataPatterns) {
      if (pattern.pattern.test(text)) {
        violations.push({
          type: 'personal_data',
          severity: 'high',
          message: `개인정보(${pattern.type})가 포함되어 있습니다. 개인정보는 포함하지 말아주세요.`,
          action: 'add_warning',
        });
      }
    }

    return violations;
  }

  /**
   * 부적절한 의료 조언 요청 감지
   */
  private detectInappropriateMedicalAdvice(text: string): SafetyViolation[] {
    const violations: SafetyViolation[] = [];

    const inappropriatePatterns = [
      /수술.*해야.*하나|수술.*받아야.*하나/gi,
      /약.*처방|처방전.*써.*줘|약.*추천.*해.*줘/gi,
      /진단.*해.*줘|병명.*알려.*줘|진단명.*뭐야/gi,
      /치료.*방법.*알려.*줘|어떻게.*치료/gi,
    ];

    for (const pattern of inappropriatePatterns) {
      if (pattern.test(text)) {
        violations.push({
          type: 'medical_advice',
          severity: 'medium',
          message: '정확한 진단, 처방, 치료는 의료기관에서만 가능합니다.',
          action: 'require_disclaimer',
        });
        break; // 하나만 감지해도 충분
      }
    }

    return violations;
  }

  /**
   * 임신 관련 위험 요소 감지
   */
  private detectPregnancyRisks(text: string, context: ChatContext): SafetyViolation[] {
    const violations: SafetyViolation[] = [];
    const week = context.pregnancyWeek!;

    // 임신 단계별 위험 요소
    if (week <= 12) {
      // 임신 초기
      const earlyRisks = [
        /사우나|찜질방|온천/gi,
        /술|담배|흡연/gi,
        /카페인.*많이|커피.*많이/gi,
        /생선회|날.*고기|생.*계란/gi,
      ];

      for (const risk of earlyRisks) {
        if (risk.test(text)) {
          violations.push({
            type: 'pregnancy_risk',
            severity: 'medium',
            message: '임신 초기에는 특별한 주의가 필요한 활동입니다.',
            action: 'add_warning',
          });
          break;
        }
      }
    }

    if (week >= 28) {
      // 임신 후기
      const lateRisks = [
        /등.*대고.*자기|바로.*누워/gi,
        /무거운.*것.*들기/gi,
        /장거리.*여행|비행기.*여행/gi,
      ];

      for (const risk of lateRisks) {
        if (risk.test(text)) {
          violations.push({
            type: 'pregnancy_risk',
            severity: 'medium',
            message: '임신 후기에는 각별한 주의가 필요한 활동입니다.',
            action: 'add_warning',
          });
          break;
        }
      }
    }

    return violations;
  }

  /**
   * 약물 상호작용 체크
   */
  private async checkDrugInteractions(query: string, medications: string[]): Promise<SafetyViolation[]> {
    const violations: SafetyViolation[] = [];

    // 임신 중 금지 약물
    const pregnancyProhibited = [
      '와파린', '테트라사이클린', '이소트레티노인', 'ACE억제제',
      '안지오텐신수용체차단제', '리튬', '발프로산',
    ];

    // 쿼리에서 약물명 추출
    const mentionedDrugs = this.extractMedicationNames(query);

    for (const drug of mentionedDrugs) {
      if (pregnancyProhibited.some(prohibited =>
        drug.toLowerCase().includes(prohibited.toLowerCase())
      )) {
        violations.push({
          type: 'drug_interaction',
          severity: 'high',
          message: `${drug}은 임신 중 사용에 주의가 필요한 약물입니다. 반드시 의사와 상담하세요.`,
          action: 'add_warning',
        });
      }
    }

    return violations;
  }

  /**
   * 약물명 추출
   */
  private extractMedicationNames(text: string): string[] {
    const commonMedications = [
      '타이레놀', '애드빌', '아스피린', '부루펜', '낙센',
      '엽산', '철분', '비타민', '오메가3', '유산균',
      '항생제', '소염제', '진통제', '해열제',
    ];

    return commonMedications.filter(med =>
      new RegExp(med, 'gi').test(text)
    );
  }

  /**
   * 진단/처방 언급 검사
   */
  private detectDiagnosticStatements(response: string): SafetyViolation[] {
    const violations: SafetyViolation[] = [];

    const diagnosticPatterns = [
      /당신은.*병에.*걸렸|확실히.*병|진단.*결과/gi,
      /이.*약을.*드세요|.*mg.*복용|처방.*드립니다/gi,
      /수술.*필요합니다|수술.*받으셔야/gi,
    ];

    for (const pattern of diagnosticPatterns) {
      if (pattern.test(response)) {
        violations.push({
          type: 'medical_advice',
          severity: 'high',
          message: 'AI는 진단이나 처방을 할 수 없습니다.',
          action: 'block_response',
        });
        break;
      }
    }

    return violations;
  }

  /**
   * 약물 추천 검사
   */
  private detectMedicationRecommendations(response: string): SafetyViolation[] {
    const violations: SafetyViolation[] = [];

    const medicationPatterns = [
      /.*드시면.*됩니다|.*복용하세요|.*먹으시면/gi,
      /.*약국에서.*사서|.*mg.*드세요/gi,
    ];

    for (const pattern of medicationPatterns) {
      if (pattern.test(response)) {
        violations.push({
          type: 'medical_advice',
          severity: 'medium',
          message: '약물 복용은 반드시 의사의 처방에 따라야 합니다.',
          action: 'add_warning',
        });
        break;
      }
    }

    return violations;
  }

  /**
   * 응급상황 대응 적절성 검사
   */
  private validateEmergencyResponse(response: string, query: string): SafetyViolation[] {
    const violations: SafetyViolation[] = [];

    // 응급상황 쿼리인지 확인
    const isEmergencyQuery = /심한.*출혈|의식.*잃|호흡.*곤란|경련/gi.test(query);

    if (isEmergencyQuery) {
      // 응급상황에 대한 적절한 대응이 포함되어야 함
      const hasEmergencyResponse = /즉시.*병원|응급실|119/gi.test(response);

      if (!hasEmergencyResponse) {
        violations.push({
          type: 'emergency',
          severity: 'critical',
          message: '응급상황에 대한 적절한 대응 지침이 누락되었습니다.',
          action: 'block_response',
        });
      }
    }

    return violations;
  }

  /**
   * 임신 단계별 적절성 검사
   */
  private validatePregnancyStageAppropriate(response: string, week: number): SafetyViolation[] {
    const violations: SafetyViolation[] = [];

    // 예: 임신 초기인데 태동에 대한 답변을 하는 경우
    if (week <= 16 && /태동|아기.*움직임/gi.test(response)) {
      violations.push({
        type: 'pregnancy_risk',
        severity: 'low',
        message: '현재 임신 주수에 적합하지 않은 정보가 포함되어 있을 수 있습니다.',
        action: 'add_warning',
      });
    }

    return violations;
  }

  /**
   * 의료진 상담 권고 누락 검사
   */
  private checkMedicalConsultationRecommendation(response: string, query: string): SafetyViolation[] {
    const violations: SafetyViolation[] = [];

    const requiresConsultation = [
      /통증|아픔|불편/gi,
      /출혈|피|혈/gi,
      /증상|이상/gi,
      /검사|진단/gi,
    ];

    const hasConsultationAdvice = /의사.*상담|병원.*방문|전문의.*진료/gi.test(response);

    if (requiresConsultation.some(pattern => pattern.test(query)) && !hasConsultationAdvice) {
      violations.push({
        type: 'medical_advice',
        severity: 'medium',
        message: '의료진 상담 권고가 필요합니다.',
        action: 'add_warning',
      });
    }

    return violations;
  }

  /**
   * 안전한 대체 응답 생성
   */
  private generateSafeAlternativeResponse(query: string, violations: SafetyViolation[]): string {
    const criticalViolations = violations.filter(v => v.severity === 'critical');

    if (criticalViolations.length > 0) {
      return `죄송합니다. 귀하의 문의는 즉시 의료진의 도움이 필요할 수 있는 상황으로 판단됩니다.

🚨 **즉시 조치가 필요합니다:**
- 가장 가까운 응급실을 방문하시거나
- 119에 즉시 연락하세요

본 AI 서비스는 응급상황에 대한 즉각적인 의료 처치를 제공할 수 없습니다. 안전을 위해 즉시 전문 의료진의 도움을 받으시기 바랍니다.`;
    }

    return `죄송합니다. 안전한 의료 정보 제공을 위해 귀하의 문의에 대해 직접적인 답변을 드리기 어렵습니다.

대신 다음과 같이 안내드립니다:
- 정확한 진단과 치료는 의료기관에서만 가능합니다
- 담당 의사와 직접 상담하시기 바랍니다
- 응급상황이라면 즉시 119에 연락하세요

다른 일반적인 건강 정보나 임신 관련 궁금증이 있으시면 다시 문의해 주세요.`;
  }

  /**
   * 컴플라이언스 감사 로그 생성
   */
  async logComplianceAudit(
    messageId: string,
    userId: string | undefined,
    query: string,
    response: string,
    violations: SafetyViolation[]
  ): Promise<void> {
    if (!this.config.complianceLogging) return;

    const audit: ComplianceAudit = {
      messageId,
      timestamp: new Date(),
      userId: userId ? this.anonymizeUserId(userId) : undefined,
      query: this.sanitizeQueryForLogging(query),
      response: this.sanitizeResponseForLogging(response),
      safetyViolations: violations,
      medicalEntities: this.extractMedicationNames(query + ' ' + response),
      riskLevel: this.calculateRiskLevel(violations),
    };

    this.auditLog.push(audit);

    // 실제 구현에서는 보안 로그 시스템에 저장
    if (process.env.NODE_ENV === 'production') {
      await this.saveToSecureAuditLog(audit);
    }
  }

  /**
   * 사용자 ID 익명화
   */
  private anonymizeUserId(userId: string): string {
    // 실제 구현에서는 암호화 해시 사용
    return `anon_${userId.substring(0, 8)}...`;
  }

  /**
   * 로깅용 쿼리 삭제 처리
   */
  private sanitizeQueryForLogging(query: string): string {
    // 개인정보 제거
    return query
      .replace(/\d{6}-[1-4]\d{6}/g, '[주민번호]')
      .replace(/010-\d{4}-\d{4}/g, '[휴대폰]')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[이메일]');
  }

  /**
   * 로깅용 응답 삭제 처리
   */
  private sanitizeResponseForLogging(response: string): string {
    // 민감한 의료 정보는 요약만 로깅
    return response.length > 500 ? response.substring(0, 500) + '...' : response;
  }

  /**
   * 위험도 계산
   */
  private calculateRiskLevel(violations: SafetyViolation[]): 'low' | 'medium' | 'high' | 'critical' {
    if (violations.some(v => v.severity === 'critical')) return 'critical';
    if (violations.some(v => v.severity === 'high')) return 'high';
    if (violations.some(v => v.severity === 'medium')) return 'medium';
    return 'low';
  }

  /**
   * 보안 감사 로그 저장 (실제 구현)
   */
  private async saveToSecureAuditLog(audit: ComplianceAudit): Promise<void> {
    // 실제 구현에서는 암호화된 로그 시스템에 저장
    console.log('Compliance audit logged:', {
      messageId: audit.messageId,
      timestamp: audit.timestamp,
      riskLevel: audit.riskLevel,
      violationCount: audit.safetyViolations.length,
    });
  }

  /**
   * 감사 로그 조회 (관리자용)
   */
  getAuditLogs(
    startDate?: Date,
    endDate?: Date,
    riskLevel?: ComplianceAudit['riskLevel']
  ): ComplianceAudit[] {
    return this.auditLog.filter(log => {
      if (startDate && log.timestamp < startDate) return false;
      if (endDate && log.timestamp > endDate) return false;
      if (riskLevel && log.riskLevel !== riskLevel) return false;
      return true;
    });
  }

  /**
   * 설정 업데이트
   */
  updateConfig(config: Partial<MedicalSafetyConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 현재 설정 조회
   */
  getConfig(): MedicalSafetyConfig {
    return { ...this.config };
  }
}

// 기본 인스턴스 내보내기
export const medicalSafetyValidator = new MedicalSafetyValidator();

// 의료 면책 조항
export const MEDICAL_DISCLAIMER = `
⚠️ **중요한 안내사항**

본 AI 챗봇은 일반적인 의료 정보 제공을 목적으로 하며, 의료진의 진단이나 치료를 대체할 수 없습니다.

• 개인의 증상과 상황에 따라 적절한 처치가 다를 수 있습니다
• 정확한 진단과 치료를 위해서는 반드시 의료기관을 방문하시기 바랍니다
• 응급상황이라면 즉시 119에 연락하거나 응급실을 방문하세요
• 약물 복용이나 치료 변경은 반드시 담당 의사와 상의하시기 바랍니다

이 서비스는 한국 의료법 및 개인정보보호법을 준수합니다.
`;