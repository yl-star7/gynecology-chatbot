import type { ChatContext } from '@/types/chat';

/**
 * 임신 단계별 개인화 서비스
 *
 * 임신 주수에 따른 맞춤형 정보 제공
 * 개인별 위험 요소 고려
 * 단계별 검사 및 관리 가이드
 */

export interface PregnancyStageInfo {
  stage: 'preconception' | 'first_trimester' | 'second_trimester' | 'third_trimester' | 'postpartum';
  week?: number;
  title: string;
  description: string;
  keyMilestones: string[];
  importantTasks: string[];
  commonSymptoms: string[];
  redFlags: string[];
  recommendedTests: string[];
  nutritionFocus: string[];
  exerciseGuidelines: string[];
  nextStagePreview?: string;
}

export interface PersonalizedRecommendations {
  dailyTips: string[];
  weeklyFocus: string;
  upcomingMilestones: string[];
  customWarnings: string[];
  nutritionPlan: NutritionPlan;
  exercisePlan: ExercisePlan;
  checklistItems: ChecklistItem[];
}

export interface NutritionPlan {
  calories: { min: number; max: number };
  keyNutrients: { name: string; amount: string; sources: string[] }[];
  supplementRecommendations: string[];
  foodsToAvoid: string[];
  mealSuggestions: string[];
}

export interface ExercisePlan {
  weeklyMinutes: number;
  recommendedActivities: string[];
  intensityLevel: 'low' | 'moderate' | 'high';
  activitiesToAvoid: string[];
  specialConsiderations: string[];
}

export interface ChecklistItem {
  category: 'medical' | 'preparation' | 'lifestyle' | 'administrative';
  item: string;
  dueWeek?: number;
  urgency: 'high' | 'medium' | 'low';
  completed?: boolean;
}

export interface RiskFactorAssessment {
  age: 'low' | 'moderate' | 'high';
  bmi: 'underweight' | 'normal' | 'overweight' | 'obese';
  medical_history: 'low' | 'moderate' | 'high';
  lifestyle: 'low' | 'moderate' | 'high';
  overall: 'low' | 'moderate' | 'high';
  recommendations: string[];
}

/**
 * 임신 단계별 정보 데이터베이스
 */
const PREGNANCY_STAGES: { [key: string]: PregnancyStageInfo } = {
  preconception: {
    stage: 'preconception',
    title: '임신 준비기',
    description: '건강한 임신을 위한 사전 준비 단계입니다.',
    keyMilestones: [
      '배란일 계산 및 추적',
      '엽산 보충제 시작',
      '건강한 체중 달성',
      '금연/금주 실천'
    ],
    importantTasks: [
      '산전 검사 받기',
      '예방접종 상태 확인',
      '만성질환 관리',
      '건강한 생활습관 구축'
    ],
    commonSymptoms: [
      '규칙적인 월경',
      '배란통',
      '기초체온 변화',
      '가임기 증상'
    ],
    redFlags: [
      '월경 불규칙',
      '심한 생리통',
      '비정상 출혈',
      '만성 골반통'
    ],
    recommendedTests: [
      '풍진 항체 검사',
      '갑상선 기능 검사',
      '혈액형 검사',
      '성병 검사',
      '자궁경부암 검사'
    ],
    nutritionFocus: [
      '엽산 400-800μg/일',
      '철분 18mg/일',
      '칼슘 1000mg/일',
      '비타민 D 600IU/일'
    ],
    exerciseGuidelines: [
      '주 150분 중등도 유산소 운동',
      '주 2회 근력 운동',
      '적정 체중 유지',
      '스트레스 관리'
    ],
    nextStagePreview: '임신 확인 후 첫 산전 진료까지 중요한 초기 관리'
  },

  first_trimester: {
    stage: 'first_trimester',
    title: '임신 초기 (1-12주)',
    description: '태아의 주요 장기가 형성되는 중요한 시기입니다.',
    keyMilestones: [
      '심장박동 확인 (6-8주)',
      '첫 산전 진료 (8-10주)',
      '입덧 시작 및 관리',
      '기형아 검사 상담 (10-12주)'
    ],
    importantTasks: [
      '산전 비타민 복용',
      '금주/금연 철저',
      '엽산 섭취 증량',
      '정기 산전 진료'
    ],
    commonSymptoms: [
      '입덧 (메스꺼움, 구토)',
      '유방 팽만감',
      '피로감',
      '잦은 소변',
      '기분 변화'
    ],
    redFlags: [
      '심한 구토 (하루 3회 이상)',
      '질 출혈',
      '심한 복통',
      '고열 (38도 이상)',
      '지속적인 두통'
    ],
    recommendedTests: [
      '임신 초기 기본 검사',
      '기형아 선별검사',
      '자궁경부 세포검사',
      '감염성 질환 검사'
    ],
    nutritionFocus: [
      '엽산 600-800μg/일',
      '철분 27mg/일',
      'DHA 200mg/일',
      '비타민 B6 (입덧 완화)'
    ],
    exerciseGuidelines: [
      '가벼운 유산소 운동',
      '임산부 요가',
      '걷기 30분/일',
      '고강도 운동 피하기'
    ],
    nextStagePreview: '안정적인 중기로 접어들며 태동 시작 준비'
  },

  second_trimester: {
    stage: 'second_trimester',
    title: '임신 중기 (13-27주)',
    description: '가장 안정적인 시기로 태동을 처음 느끼게 됩니다.',
    keyMilestones: [
      '성별 확인 가능 (15-18주)',
      '양수검사 시기 (15-20주)',
      '태동 시작 (18-22주)',
      '기형아 정밀초음파 (20-24주)'
    ],
    importantTasks: [
      '정기 산전 진료',
      '체중 관리',
      '태동 모니터링',
      '출산 준비 교육'
    ],
    commonSymptoms: [
      '태동 감지',
      '배 불러옴',
      '허리 통증',
      '다리 부종',
      '임신선 생성'
    ],
    redFlags: [
      '태동 감소/소실',
      '질 출혈',
      '조기 진통',
      '심한 두통',
      '시야 장애'
    ],
    recommendedTests: [
      '기형아 정밀초음파',
      '양수검사 (고위험군)',
      '임신성 당뇨 선별검사',
      '빈혈 검사'
    ],
    nutritionFocus: [
      '칼로리 +340kcal/일',
      '단백질 71g/일',
      '칼슘 1000mg/일',
      '철분 27mg/일'
    ],
    exerciseGuidelines: [
      '중등도 유산소 운동',
      '수영 (권장)',
      '임산부 필라테스',
      '복부 운동 피하기'
    ],
    nextStagePreview: '출산을 위한 준비와 조산 예방에 집중하는 후기'
  },

  third_trimester: {
    stage: 'third_trimester',
    title: '임신 후기 (28-40주)',
    description: '출산을 준비하며 태아가 빠르게 성장하는 시기입니다.',
    keyMilestones: [
      '조산 위험 모니터링 (28-34주)',
      '태아 성장 집중 (32-36주)',
      '출산 준비 완료 (36-40주)',
      '진통 시작 및 분만'
    ],
    importantTasks: [
      '병원 가방 준비',
      '태동 카운트',
      '회음부 마사지',
      '수유 준비'
    ],
    commonSymptoms: [
      '숨가쁨',
      '허리 통증 증가',
      '불면증',
      '브락스톤 힉스 수축',
      '골반 압박감'
    ],
    redFlags: [
      '조기 진통 (37주 이전)',
      '양수 파열',
      '태동 급감',
      '심한 부종',
      '혈압 상승'
    ],
    recommendedTests: [
      '태아 안녕 검사',
      '그룹 B 연쇄상구균 검사',
      '혈압/단백뇨 모니터링',
      '태아 성장 평가'
    ],
    nutritionFocus: [
      '칼로리 +450kcal/일',
      '단백질 증가',
      '수분 충분 섭취',
      '나트륨 제한'
    ],
    exerciseGuidelines: [
      '가벼운 걷기',
      '호흡법 연습',
      '골반저근 운동',
      '격렬한 운동 금지'
    ],
    nextStagePreview: '산후 회복 및 신생아 돌봄 준비'
  },

  postpartum: {
    stage: 'postpartum',
    title: '산후 조리기 (0-8주)',
    description: '출산 후 몸의 회복과 신생아 돌봄을 위한 중요한 시기입니다.',
    keyMilestones: [
      '산후 출혈 모니터링 (0-2주)',
      '모유수유 정착 (2-4주)',
      '산후 우울증 주의 (2-8주)',
      '산후 검진 (6주)'
    ],
    importantTasks: [
      '충분한 휴식',
      '균형잡힌 영양 섭취',
      '모유수유 또는 분유 수유',
      '신생아 건강 모니터링'
    ],
    commonSymptoms: [
      '오로 (산후 분비물)',
      '유방 팽만',
      '회음부 불편감',
      '감정 기복',
      '수면 부족'
    ],
    redFlags: [
      '대량 출혈',
      '고열',
      '심한 복통',
      '호흡곤란',
      '심한 우울감'
    ],
    recommendedTests: [
      '산후 6주 검진',
      '자궁 회복 상태 확인',
      '혈압 체크',
      '빈혈 검사'
    ],
    nutritionFocus: [
      '수유시 +500kcal/일',
      '단백질 71g/일',
      '칼슘 1200mg/일',
      '충분한 수분 섭취'
    ],
    exerciseGuidelines: [
      '6주 후 점진적 운동 시작',
      '골반저근 운동',
      '가벼운 산책',
      '무리한 운동 금지'
    ]
  }
};

/**
 * 임신 개인화 서비스 클래스
 */
export class PregnancyPersonalizationService {
  /**
   * 임신 주수에 따른 단계 정보 조회
   */
  getStageInfo(week?: number): PregnancyStageInfo {
    if (!week) {
      return PREGNANCY_STAGES.preconception;
    }

    if (week <= 12) {
      return { ...PREGNANCY_STAGES.first_trimester, week };
    } else if (week <= 27) {
      return { ...PREGNANCY_STAGES.second_trimester, week };
    } else if (week <= 40) {
      return { ...PREGNANCY_STAGES.third_trimester, week };
    } else {
      return PREGNANCY_STAGES.postpartum;
    }
  }

  /**
   * 개인화된 추천사항 생성
   */
  generatePersonalizedRecommendations(
    context: ChatContext,
    userAge?: number,
    userBMI?: number
  ): PersonalizedRecommendations {
    const stage = this.getStageInfo(context.pregnancyWeek);
    const riskAssessment = this.assessRiskFactors(context, userAge, userBMI);

    return {
      dailyTips: this.generateDailyTips(stage, context, riskAssessment),
      weeklyFocus: this.getWeeklyFocus(stage, context.pregnancyWeek),
      upcomingMilestones: this.getUpcomingMilestones(context.pregnancyWeek || 0),
      customWarnings: this.generateCustomWarnings(context, riskAssessment),
      nutritionPlan: this.createNutritionPlan(stage, context, userBMI),
      exercisePlan: this.createExercisePlan(stage, context, riskAssessment),
      checklistItems: this.generateChecklist(stage, context.pregnancyWeek),
    };
  }

  /**
   * 위험 요소 평가
   */
  private assessRiskFactors(
    context: ChatContext,
    age?: number,
    bmi?: number
  ): RiskFactorAssessment {
    // 나이 위험도
    const ageRisk = !age ? 'low' :
      age < 18 || age > 35 ? 'high' :
      age > 30 ? 'moderate' : 'low';

    // BMI 위험도
    const bmiCategory = !bmi ? 'normal' :
      bmi < 18.5 ? 'underweight' :
      bmi > 30 ? 'obese' :
      bmi > 25 ? 'overweight' : 'normal';

    // 병력 위험도
    const medicalRisk = context.previousConditions && context.previousConditions.length > 0 ? 'high' : 'low';

    // 생활습관 위험도 (약물 복용 등으로 추정)
    const lifestyleRisk = context.medications && context.medications.length > 2 ? 'moderate' : 'low';

    // 종합 위험도
    const risks = [ageRisk, medicalRisk, lifestyleRisk];
    const overall = risks.includes('high') ? 'high' :
      risks.includes('moderate') ? 'moderate' : 'low';

    const recommendations = [];
    if (ageRisk === 'high') {
      recommendations.push('고위험 임신으로 분류되어 더 자주 산전 진료가 필요합니다.');
    }
    if (bmiCategory === 'obese') {
      recommendations.push('체중 관리를 위한 영양사 상담을 권장합니다.');
    }
    if (medicalRisk === 'high') {
      recommendations.push('기존 질환에 대한 전문의 협진이 필요할 수 있습니다.');
    }

    return {
      age: ageRisk,
      bmi: bmiCategory,
      medical_history: medicalRisk,
      lifestyle: lifestyleRisk,
      overall,
      recommendations
    };
  }

  /**
   * 일일 맞춤 팁 생성
   */
  private generateDailyTips(
    stage: PregnancyStageInfo,
    context: ChatContext,
    risk: RiskFactorAssessment
  ): string[] {
    const tips = [];
    const week = context.pregnancyWeek || 0;

    // 주수별 기본 팁
    if (week <= 12) {
      tips.push('엽산 보충제를 꾸준히 복용하세요.');
      tips.push('입덧이 있다면 소량씩 자주 드세요.');
      tips.push('충분한 휴식을 취하세요.');
    } else if (week <= 27) {
      tips.push('태동을 느끼기 시작하면 기록해보세요.');
      tips.push('적정 체중 증가를 유지하세요.');
      tips.push('편안한 운동을 꾸준히 하세요.');
    } else if (week <= 40) {
      tips.push('병원 가방을 미리 준비해두세요.');
      tips.push('태동을 매일 체크하세요.');
      tips.push('진통의 신호를 알아두세요.');
    }

    // 위험도별 추가 팁
    if (risk.overall === 'high') {
      tips.push('정기 산전 진료를 절대 놓치지 마세요.');
      tips.push('이상 증상 발생시 즉시 병원에 연락하세요.');
    }

    // 증상별 맞춤 팁
    if (context.symptoms?.includes('입덧')) {
      tips.push('생강차나 레몬물이 입덧 완화에 도움될 수 있습니다.');
    }
    if (context.symptoms?.includes('변비')) {
      tips.push('섬유질이 풍부한 음식과 충분한 수분 섭취를 하세요.');
    }

    return tips.slice(0, 4); // 최대 4개
  }

  /**
   * 주간 집중 사항
   */
  private getWeeklyFocus(stage: PregnancyStageInfo, week?: number): string {
    if (!week) return '임신 준비를 위한 건강관리';

    const weeklyFocus: { [key: number]: string } = {
      4: '임신 확인 및 엽산 복용 시작',
      8: '첫 산전 진료 및 기본 검사',
      12: '기형아 검사 상담 및 입덧 관리',
      16: '태동 준비 및 체중 관리',
      20: '정밀 초음파 및 성별 확인',
      24: '임신성 당뇨 검사',
      28: '조산 예방 및 태동 모니터링',
      32: '출산 준비 교육 참석',
      36: '분만 계획 수립',
      40: '출산 대기 및 진통 신호 주의'
    };

    // 가장 가까운 주차의 포커스 반환
    const nearestWeek = Object.keys(weeklyFocus)
      .map(Number)
      .reduce((prev, curr) =>
        Math.abs(curr - week) < Math.abs(prev - week) ? curr : prev
      );

    return weeklyFocus[nearestWeek] || stage.description;
  }

  /**
   * 다가오는 중요 시점들
   */
  private getUpcomingMilestones(currentWeek: number): string[] {
    const milestones = [
      { week: 6, event: '심장박동 확인 가능' },
      { week: 8, event: '첫 산전 진료' },
      { week: 12, event: '기형아 검사 시기' },
      { week: 16, event: '성별 확인 가능' },
      { week: 20, event: '정밀 초음파 검사' },
      { week: 24, event: '임신성 당뇨 검사' },
      { week: 28, event: '7개월 안정기 진입' },
      { week: 32, event: '조산 생존율 높아짐' },
      { week: 36, event: '정산아 분류' },
      { week: 40, event: '예정일 도래' },
    ];

    return milestones
      .filter(m => m.week > currentWeek && m.week <= currentWeek + 8)
      .map(m => `${m.week}주: ${m.event}`)
      .slice(0, 3);
  }

  /**
   * 맞춤형 주의사항
   */
  private generateCustomWarnings(
    context: ChatContext,
    risk: RiskFactorAssessment
  ): string[] {
    const warnings = [];

    if (risk.overall === 'high') {
      warnings.push('고위험 임신으로 분류되어 각별한 주의가 필요합니다.');
    }

    if (context.medications && context.medications.length > 0) {
      warnings.push('복용 중인 약물에 대해 산부인과 의사와 상담하세요.');
    }

    if (context.previousConditions?.includes('당뇨병')) {
      warnings.push('혈당 관리에 특별히 주의하시고 정기적으로 모니터링하세요.');
    }

    if (context.previousConditions?.includes('고혈압')) {
      warnings.push('혈압 변화를 주의깊게 관찰하시고 부종 발생시 즉시 연락하세요.');
    }

    return warnings;
  }

  /**
   * 영양 계획 생성
   */
  private createNutritionPlan(
    stage: PregnancyStageInfo,
    context: ChatContext,
    bmi?: number
  ): NutritionPlan {
    const week = context.pregnancyWeek || 0;

    // 기본 칼로리 (BMI 고려)
    let baseCalories = 2000;
    if (bmi && bmi < 18.5) baseCalories = 2200;
    if (bmi && bmi > 25) baseCalories = 1800;

    // 임신 단계별 추가 칼로리
    let additionalCalories = 0;
    if (week >= 13 && week <= 27) additionalCalories = 340;
    if (week >= 28) additionalCalories = 450;

    const totalCalories = baseCalories + additionalCalories;

    return {
      calories: {
        min: totalCalories - 200,
        max: totalCalories + 200
      },
      keyNutrients: [
        {
          name: '엽산',
          amount: week <= 12 ? '600-800μg' : '600μg',
          sources: ['시금치', '브로콜리', '아스파라거스', '강화 시리얼']
        },
        {
          name: '철분',
          amount: '27mg',
          sources: ['살코기', '두부', '시금치', '건포도']
        },
        {
          name: '칼슘',
          amount: '1000mg',
          sources: ['우유', '요거트', '치즈', '멸치', '참깨']
        },
        {
          name: 'DHA',
          amount: '200mg',
          sources: ['연어', '고등어', '아마씨', 'DHA 보충제']
        }
      ],
      supplementRecommendations: stage.nutritionFocus,
      foodsToAvoid: [
        '생선회, 생굴 등 날것',
        '알코올',
        '카페인 (하루 200mg 이하)',
        '수은 함량 높은 생선',
        '덜 익힌 육류'
      ],
      mealSuggestions: this.generateMealSuggestions(week)
    };
  }

  /**
   * 운동 계획 생성
   */
  private createExercisePlan(
    stage: PregnancyStageInfo,
    context: ChatContext,
    risk: RiskFactorAssessment
  ): ExercisePlan {
    const week = context.pregnancyWeek || 0;

    // 위험도에 따른 운동 강도 조정
    let intensity: 'low' | 'moderate' | 'high' = 'moderate';
    if (risk.overall === 'high' || week >= 36) {
      intensity = 'low';
    }

    return {
      weeklyMinutes: intensity === 'low' ? 75 : 150,
      recommendedActivities: this.getRecommendedActivities(week, intensity),
      intensityLevel: intensity,
      activitiesToAvoid: this.getActivitiesToAvoid(week),
      specialConsiderations: this.getExerciseConsiderations(context, risk)
    };
  }

  /**
   * 권장 운동 활동
   */
  private getRecommendedActivities(week: number, intensity: 'low' | 'moderate' | 'high'): string[] {
    const activities = [];

    if (intensity === 'low') {
      activities.push('느린 속도 걷기', '임산부 요가', '호흡법 연습');
    } else {
      activities.push('빠른 걸음 걷기', '수영', '임산부 필라테스', '고정자전거');
    }

    if (week >= 28) {
      activities.push('골반저근 운동', '회음부 마사지');
    }

    return activities;
  }

  /**
   * 피해야 할 운동
   */
  private getActivitiesToAvoid(week: number): string[] {
    const toAvoid = [
      '접촉 스포츠',
      '높은 강도 운동',
      '누워서 하는 운동 (20주 이후)',
      '복부에 압력을 주는 운동'
    ];

    if (week >= 20) {
      toAvoid.push('바로 누워서 하는 모든 운동');
    }

    if (week >= 28) {
      toAvoid.push('점프나 급격한 방향 전환', '장시간 서있기');
    }

    return toAvoid;
  }

  /**
   * 운동 시 특별 고려사항
   */
  private getExerciseConsiderations(context: ChatContext, risk: RiskFactorAssessment): string[] {
    const considerations = [];

    if (risk.overall === 'high') {
      considerations.push('운동 전 의사와 상담');
    }

    if (context.symptoms?.includes('어지러움')) {
      considerations.push('어지러움 발생시 즉시 중단');
    }

    considerations.push(
      '충분한 수분 섭취',
      '과열 방지',
      '호흡이 가쁘면 즉시 휴식',
      '규칙적인 강도 유지'
    );

    return considerations;
  }

  /**
   * 식사 제안
   */
  private generateMealSuggestions(week: number): string[] {
    const suggestions = [
      '아침: 통곡물 시리얼 + 우유 + 베리류',
      '점심: 현미밥 + 구운 연어 + 시금치 나물',
      '저녁: 퀴노아 + 두부 스테이크 + 브로콜리'
    ];

    if (week <= 12) {
      suggestions.push('입덧 완화: 생강차 + 크래커');
    }

    if (week >= 28) {
      suggestions.push('변비 예방: 고섬유질 식품 + 충분한 수분');
    }

    return suggestions;
  }

  /**
   * 체크리스트 생성
   */
  private generateChecklist(stage: PregnancyStageInfo, week?: number): ChecklistItem[] {
    const items: ChecklistItem[] = [];

    if (week && week <= 12) {
      items.push(
        { category: 'medical', item: '첫 산전 진료 받기', dueWeek: 8, urgency: 'high' },
        { category: 'lifestyle', item: '엽산 보충제 복용 시작', urgency: 'high' },
        { category: 'preparation', item: '임신 관련 서적 읽기', urgency: 'low' }
      );
    }

    if (week && week >= 13 && week <= 27) {
      items.push(
        { category: 'medical', item: '기형아 정밀초음파', dueWeek: 20, urgency: 'high' },
        { category: 'preparation', item: '출산 준비 교실 신청', dueWeek: 24, urgency: 'medium' },
        { category: 'administrative', item: '출산 휴가 신청', dueWeek: 26, urgency: 'medium' }
      );
    }

    if (week && week >= 28) {
      items.push(
        { category: 'preparation', item: '병원 가방 준비', dueWeek: 35, urgency: 'high' },
        { category: 'medical', item: '그룹 B 연쇄상구균 검사', dueWeek: 36, urgency: 'high' },
        { category: 'preparation', item: '신생아용품 준비', dueWeek: 36, urgency: 'medium' }
      );
    }

    return items;
  }

  /**
   * 질문에 따른 맞춤형 응답 컨텍스트 생성
   */
  generateQueryContext(query: string, context: ChatContext): string {
    const stage = this.getStageInfo(context.pregnancyWeek);
    const recommendations = this.generatePersonalizedRecommendations(context);

    let contextInfo = `\n\n[개인화 정보]`;
    contextInfo += `\n현재 단계: ${stage.title}`;

    if (context.pregnancyWeek) {
      contextInfo += `\n임신 주수: ${context.pregnancyWeek}주`;
      contextInfo += `\n주간 집중사항: ${recommendations.weeklyFocus}`;
    }

    if (recommendations.customWarnings.length > 0) {
      contextInfo += `\n주의사항: ${recommendations.customWarnings.join(', ')}`;
    }

    // 쿼리 관련성에 따른 추가 컨텍스트
    if (query.includes('영양') || query.includes('음식')) {
      contextInfo += `\n영양 요구량: ${recommendations.nutritionPlan.keyNutrients.map(n => `${n.name} ${n.amount}`).join(', ')}`;
    }

    if (query.includes('운동')) {
      contextInfo += `\n권장 운동: ${recommendations.exercisePlan.recommendedActivities.join(', ')}`;
      contextInfo += `\n피해야 할 운동: ${recommendations.exercisePlan.activitiesToAvoid.join(', ')}`;
    }

    if (query.includes('검사')) {
      contextInfo += `\n권장 검사: ${stage.recommendedTests.join(', ')}`;
    }

    return contextInfo;
  }
}

// 기본 인스턴스 내보내기
export const pregnancyPersonalizationService = new PregnancyPersonalizationService();