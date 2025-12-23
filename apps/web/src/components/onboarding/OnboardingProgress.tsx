"use client";

interface OnboardingProgressProps {
    currentStep: number;
    totalSteps: number;
}

export function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
    const progress = ((currentStep + 1) / totalSteps) * 100;

    return (
        <div className="w-full">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>단계 {currentStep + 1} / {totalSteps}</span>
                <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-maternal-primary to-maternal-secondary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
