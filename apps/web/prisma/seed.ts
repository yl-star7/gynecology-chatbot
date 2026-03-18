import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // ============ AI Personas ============
    console.log('Creating AI personas...');

    const personas = [
        {
            id: 'default',
            name: '따뜻한 친구',
            description: '친근하고 따뜻한 말투로 대화하는 AI 채팅 어시스턴트',
            systemPrompt: `당신은 임신부와 여성 건강에 특화된 AI 채팅 어시스턴트입니다.
항상 따뜻하고 공감하는 말투로 대화하세요.
이모지를 적절히 사용하여 친근감을 주세요.
의료 정보는 정확하게 전달하되, 쉬운 말로 설명하세요.
응급 상황이 의심되면 즉시 병원 방문을 권유하세요.`,
            tone: 'warm',
            emojiEnabled: true,
            isActive: true,
        },
        {
            id: 'professional',
            name: '전문 채팅',
            description: '의학적 정보를 상세하게 설명하는 전문가 스타일',
            systemPrompt: `당신은 부인과 전문의 수준의 지식을 갖춘 AI 의료 채팅 어시스턴트입니다.
의학적 근거를 바탕으로 정확한 정보를 제공하세요.
전문 용어는 괄호로 설명을 추가하세요.
출처나 가이드라인을 언급하면 신뢰도가 높아집니다.
응급 상황 판단 시 즉시 병원 방문을 강력히 권유하세요.`,
            tone: 'professional',
            emojiEnabled: false,
            isActive: true,
        },
        {
            id: 'concise',
            name: '간결한 답변',
            description: '핵심만 간결하게 전달하는 스타일',
            systemPrompt: `당신은 임신부를 위한 AI 채팅 어시스턴트입니다.
답변은 짧고 명확하게 작성하세요.
불필요한 수식어를 피하고 핵심 정보만 전달하세요.
필요시 불릿 포인트로 정리하세요.
응급 상황 시 즉시 병원 방문을 권유하세요.`,
            tone: 'concise',
            emojiEnabled: false,
            isActive: true,
        },
    ];

    for (const persona of personas) {
        await prisma.aIPersona.upsert({
            where: { id: persona.id },
            update: persona,
            create: persona,
        });
    }
    console.log(`✅ Created ${personas.length} personas`);

    // ============ Proactive Trigger Types ============
    console.log('Creating proactive trigger types...');

    const triggerTypes = [
        {
            id: 'daily_check',
            name: '매일 안부 인사',
            description: '매일 아침 9시에 사용자 안부를 묻는 메시지',
            cronExpression: '0 9 * * *',
            messageTemplate: `사용자의 임신 {pregnancy_week}주차에 맞는 따뜻한 인사와 함께 
오늘 기분을 물어보세요. 2-3개의 선택지를 함께 제공하세요.
예: "좋아요 😊", "그냥 그래요", "좀 힘들어요 😢"`,
            isActive: true,
        },
        {
            id: 'weekly_milestone',
            name: '주차별 마일스톤',
            description: '새로운 임신 주차 시작 시 정보 제공',
            cronExpression: '0 10 * * 1',  // 매주 월요일 10시
            messageTemplate: `사용자가 새로운 임신 주차에 진입했음을 축하하고,
이번 주차에 예상되는 변화와 주의사항을 알려주세요.
태아 발달 정보도 포함하세요.`,
            isActive: true,
        },
        {
            id: 'symptom_follow_up',
            name: '증상 추적',
            description: '이전에 보고된 증상에 대한 후속 질문',
            cronExpression: null,  // 수동 트리거
            messageTemplate: `이전에 {symptom} 증상을 말씀하셨는데,
오늘은 어떠신가요? 호전되셨는지 궁금해요.`,
            isActive: true,
        },
        {
            id: 'checkup_reminder',
            name: '검진 리마인더',
            description: '예정된 산전 검진 알림',
            cronExpression: '0 18 * * *',  // 매일 저녁 6시 체크
            messageTemplate: `다가오는 산전 검진 일정을 알려주세요.
검진 전 준비사항이나 궁금한 점을 물어보세요.`,
            isActive: true,
        },
    ];

    for (const trigger of triggerTypes) {
        await prisma.proactiveTriggerType.upsert({
            where: { id: trigger.id },
            update: trigger,
            create: trigger,
        });
    }
    console.log(`✅ Created ${triggerTypes.length} trigger types`);

    // ============ Sample Survey Template ============
    console.log('Creating sample survey template...');

    const sampleSurvey = {
        title: '12주차 정기 체크인',
        description: '임신 12주차 산모님을 위한 건강 체크 설문입니다.',
        pregnancyWeekMin: 12,
        pregnancyWeekMax: 13,
        formSchema: {
            version: '1.0',
            sections: [
                {
                    id: 'mood',
                    title: '오늘의 기분',
                    questions: [
                        {
                            id: 'q1',
                            type: 'single_choice',
                            label: '오늘 전반적인 기분은 어떠세요?',
                            options: ['좋아요 😊', '보통이에요', '힘들어요 😢'],
                            required: true,
                        },
                        {
                            id: 'q2',
                            type: 'scale',
                            label: '피로도를 표현해주세요',
                            min: 1,
                            max: 5,
                            minLabel: '괜찮아요',
                            maxLabel: '매우 피곤해요',
                            required: true,
                        },
                    ],
                },
                {
                    id: 'symptoms',
                    title: '증상 체크',
                    questions: [
                        {
                            id: 'q3',
                            type: 'multi_choice',
                            label: '최근 경험한 증상을 선택해주세요',
                            options: ['입덧', '피로감', '두통', '요통', '부종', '없음'],
                            required: false,
                        },
                        {
                            id: 'q4',
                            type: 'text',
                            label: '다른 궁금한 점이 있으신가요?',
                            placeholder: '자유롭게 작성해주세요',
                            required: false,
                        },
                    ],
                },
            ],
        },
        schemaVersion: '1.0',
        isAiAssisted: true,
        aiFollowUpPrompt: '사용자의 응답을 바탕으로 공감하는 메시지와 함께 추가 질문 1-2개를 생성하세요.',
        isActive: true,
    };

    // Create survey if not exists
    const existingSurvey = await prisma.surveyTemplate.findFirst({
        where: { title: sampleSurvey.title },
    });

    if (!existingSurvey) {
        await prisma.surveyTemplate.create({
            data: sampleSurvey,
        });
    }
    console.log('✅ Created sample survey template');

    console.log('\n🎉 Seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
