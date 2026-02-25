import { ChevronRight } from "lucide-react";

interface StepperProps {
    steps: { label: string; description?: string }[];
    currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
    return (
        <div className="flex flex-col md:flex-row gap-4 mb-8">
            {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;

                return (
                    <div key={index} className="flex items-center flex-1">
                        <div className="flex flex-col flex-1 relative">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors
                                        ${isCompleted ? "border-primary bg-primary text-primary-foreground" : ""}
                                        ${isCurrent ? "border-primary bg-background text-primary" : ""}
                                        ${!isCompleted && !isCurrent ? "border-muted-foreground/30 bg-muted text-muted-foreground" : ""}
                                    `}
                                >
                                    {index + 1}
                                </div>
                                <div className="flex flex-col">
                                    <span className={`text-sm font-medium ${isCurrent || isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                                        {step.label}
                                    </span>
                                </div>
                            </div>
                        </div>
                        {index < steps.length - 1 && (
                            <ChevronRight className="hidden md:block h-5 w-5 text-muted-foreground/50 mx-2" />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
