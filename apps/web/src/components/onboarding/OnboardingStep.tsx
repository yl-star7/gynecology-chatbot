"use client";

import { useState } from "react";
import type { OnboardingData } from "@gynecology-chatbot/types";

interface OnboardingStepProps {
    stepId: string;
    data: Partial<OnboardingData>;
    onComplete: (data: Partial<OnboardingData>) => void;
    onBack: () => void;
    isFirstStep: boolean;
    isLastStep: boolean;
    isSubmitting: boolean;
}

export function OnboardingStep({
    stepId,
    data,
    onComplete,
    onBack,
    isFirstStep,
    isLastStep,
    isSubmitting,
}: OnboardingStepProps) {
    const [stepData, setStepData] = useState<Partial<OnboardingData>>(data);

    const handleNext = () => {
        onComplete(stepData);
    };

    return (
        <div className="space-y-6">
            {stepId === "pregnancy-status" && (
                <PregnancyStatusStep data={stepData} onChange={setStepData} />
            )}
            {stepId === "personal-info" && (
                <PersonalInfoStep data={stepData} onChange={setStepData} />
            )}
            {stepId === "preferences" && (
                <PreferencesStep data={stepData} onChange={setStepData} />
            )}

            <div className="flex gap-3 pt-4">
                {!isFirstStep && (
                    <button
                        onClick={onBack}
                        className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                    >
                        이전
                    </button>
                )}
                <button
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-maternal-primary to-maternal-secondary text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {isSubmitting ? "저장 중..." : isLastStep ? "완료" : "다음"}
                </button>
            </div>
        </div>
    );
}

// Pregnancy Status Step
function PregnancyStatusStep({
    data,
    onChange,
}: {
    data: Partial<OnboardingData>;
    onChange: (data: Partial<OnboardingData>) => void;
}) {
    const options = [
        { value: "pregnant", label: "🤰 임신 중", description: "현재 임신 상태예요" },
        { value: "trying", label: "💕 임신 준비 중", description: "임신을 계획하고 있어요" },
        { value: "general", label: "💡 일반 상담", description: "여성 건강 상담이 필요해요" },
    ];

    return (
        <div className="space-y-3">
            {options.map((option) => (
                <button
                    key={option.value}
                    onClick={() => onChange({ ...data, pregnancyStatus: option.value as OnboardingData["pregnancyStatus"] })}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${data.pregnancyStatus === option.value
                            ? "border-maternal-primary bg-maternal-soft"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                >
                    <div className="font-medium text-gray-800">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                </button>
            ))}

            {data.pregnancyStatus === "pregnant" && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        현재 임신 주차
                    </label>
                    <select
                        value={data.pregnancyWeek || ""}
                        onChange={(e) => onChange({ ...data, pregnancyWeek: Number(e.target.value) })}
                        className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-maternal-primary focus:border-transparent"
                    >
                        <option value="">선택해주세요</option>
                        {Array.from({ length: 42 }, (_, i) => i + 1).map((week) => (
                            <option key={week} value={week}>
                                {week}주차
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
}

// Personal Info Step
function PersonalInfoStep({
    data,
    onChange,
}: {
    data: Partial<OnboardingData>;
    onChange: (data: Partial<OnboardingData>) => void;
}) {
    const ageGroups = [
        { value: "20s", label: "20대" },
        { value: "30s", label: "30대" },
        { value: "40s", label: "40대" },
        { value: "50+", label: "50대 이상" },
    ];

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    연령대
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {ageGroups.map((age) => (
                        <button
                            key={age.value}
                            onClick={() => onChange({ ...data, ageGroup: age.value as OnboardingData["ageGroup"] })}
                            className={`p-3 rounded-xl border-2 font-medium transition-all ${data.ageGroup === age.value
                                    ? "border-maternal-primary bg-maternal-soft text-maternal-primary"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                        >
                            {age.label}
                        </button>
                    ))}
                </div>
            </div>

            {data.pregnancyStatus === "pregnant" && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        첫 임신인가요?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => onChange({ ...data, firstPregnancy: true })}
                            className={`p-3 rounded-xl border-2 font-medium transition-all ${data.firstPregnancy === true
                                    ? "border-maternal-primary bg-maternal-soft"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                        >
                            네, 첫 임신이에요
                        </button>
                        <button
                            onClick={() => onChange({ ...data, firstPregnancy: false })}
                            className={`p-3 rounded-xl border-2 font-medium transition-all ${data.firstPregnancy === false
                                    ? "border-maternal-primary bg-maternal-soft"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                        >
                            아니요
                        </button>
                    </div>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    예상 출산일 (선택사항)
                </label>
                <input
                    type="date"
                    value={data.dueDate || ""}
                    onChange={(e) => onChange({ ...data, dueDate: e.target.value })}
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-maternal-primary focus:border-transparent"
                />
            </div>
        </div>
    );
}

// Preferences Step
function PreferencesStep({
    data,
    onChange,
}: {
    data: Partial<OnboardingData>;
    onChange: (data: Partial<OnboardingData>) => void;
}) {
    const styles = [
        {
            value: "friendly",
            label: "💕 따뜻하고 친근하게",
            description: "이모지 사용, 공감 표현 많이",
        },
        {
            value: "formal",
            label: "👩‍⚕️ 전문적이고 상세하게",
            description: "의학적 정보와 근거 중심",
        },
        {
            value: "concise",
            label: "⚡ 간결하고 핵심만",
            description: "짧고 명확한 답변",
        },
    ];

    return (
        <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">
                AI가 어떤 스타일로 대화했으면 좋겠나요?
            </p>
            {styles.map((style) => (
                <button
                    key={style.value}
                    onClick={() => onChange({ ...data, preferredCommunicationStyle: style.value as OnboardingData["preferredCommunicationStyle"] })}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${data.preferredCommunicationStyle === style.value
                            ? "border-maternal-primary bg-maternal-soft"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                >
                    <div className="font-medium text-gray-800">{style.label}</div>
                    <div className="text-sm text-gray-500">{style.description}</div>
                </button>
            ))}
        </div>
    );
}
