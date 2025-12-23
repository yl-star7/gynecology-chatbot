"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingStep } from "./OnboardingStep";
import { OnboardingProgress } from "./OnboardingProgress";
import type { OnboardingData } from "@gynecology-chatbot/types";

const STEPS = [
    {
        id: "pregnancy-status",
        title: "임신 상태",
        description: "현재 상태를 알려주세요",
    },
    {
        id: "personal-info",
        title: "기본 정보",
        description: "맞춤 상담을 위한 정보",
    },
    {
        id: "preferences",
        title: "대화 스타일",
        description: "AI 상담 스타일 선택",
    },
];

export function OnboardingFlow() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [data, setData] = useState<Partial<OnboardingData>>({});

    const handleStepComplete = (stepData: Partial<OnboardingData>) => {
        setData((prev) => ({ ...prev, ...stepData }));

        if (currentStep < STEPS.length - 1) {
            setCurrentStep((prev) => prev + 1);
        } else {
            handleSubmit({ ...data, ...stepData });
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    const handleSubmit = async (finalData: Partial<OnboardingData>) => {
        setIsSubmitting(true);

        try {
            const response = await fetch("/api/onboarding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: { ...finalData, completedAt: new Date().toISOString() } }),
            });

            if (!response.ok) {
                throw new Error("Failed to save onboarding data");
            }

            router.push("/chat");
        } catch (error) {
            console.error("Onboarding error:", error);
            alert("온보딩 저장 중 오류가 발생했습니다. 다시 시도해주세요.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-maternal-soft to-white flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-lg mx-auto w-full">
                <div className="w-full mb-8">
                    <OnboardingProgress
                        currentStep={currentStep}
                        totalSteps={STEPS.length}
                    />
                </div>

                <div className="w-full bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        {STEPS[currentStep].title}
                    </h2>
                    <p className="text-gray-500 mb-6">
                        {STEPS[currentStep].description}
                    </p>

                    <OnboardingStep
                        stepId={STEPS[currentStep].id}
                        data={data}
                        onComplete={handleStepComplete}
                        onBack={handleBack}
                        isFirstStep={currentStep === 0}
                        isLastStep={currentStep === STEPS.length - 1}
                        isSubmitting={isSubmitting}
                    />
                </div>
            </div>
        </div>
    );
}
