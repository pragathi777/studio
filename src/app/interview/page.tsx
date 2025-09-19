"use client";

import { useState } from "react";
import WelcomeStep from "@/components/interview/welcome-step";
import AptitudeStep from "@/components/interview/aptitude-step";
import CodingStep from "@/components/interview/coding-step";
import HRStep from "@/components/interview/hr-step";
import FeedbackStep from "@/components/interview/feedback-step";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type InterviewStep = "welcome" | "aptitude" | "coding" | "hr" | "feedback" | "failed";

export type InterviewData = {
  aptitudeScore?: number;
  codingScore?: number;
  hrAnalysis?: any;
  finalFeedback?: string;
};

export default function InterviewPage() {
  const [currentStep, setCurrentStep] = useState<InterviewStep>("welcome");
  const [interviewData, setInterviewData] = useState<InterviewData>({});

  const updateInterviewData = (data: Partial<InterviewData>) => {
    setInterviewData((prev) => ({ ...prev, ...data }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case "welcome":
        return <WelcomeStep onNext={() => setCurrentStep("aptitude")} />;
      case "aptitude":
        return (
          <AptitudeStep
            onNext={(score) => {
              updateInterviewData({ aptitudeScore: score });
              if (score >= 70) { // Cutoff score
                setCurrentStep("coding");
              } else {
                setCurrentStep("failed");
              }
            }}
          />
        );
      case "coding":
        return (
          <CodingStep
            onNext={(score) => {
              updateInterviewData({ codingScore: score });
              if (score >= 60) { // Cutoff score
                setCurrentStep("hr");
              } else {
                setCurrentStep("failed");
              }
            }}
          />
        );
      case "hr":
        return (
          <HRStep
            onNext={(analysis) => {
              updateInterviewData({ hrAnalysis: analysis });
              setCurrentStep("feedback");
            }}
          />
        );
      case "feedback":
        return <FeedbackStep interviewData={interviewData} />;
      case "failed":
        return (
            <Card className="text-center">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-destructive">Round Not Cleared</CardTitle>
                  <CardDescription>Keep practicing and try again!</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mt-2">Unfortunately, you did not meet the cutoff score for this round. Use this as a learning opportunity to strengthen your skills for the next attempt.</p>
                </CardContent>
                <CardContent>
                    <Button asChild>
                        <Link href="/dashboard">Back to Dashboard</Link>
                    </Button>
                </CardContent>
            </Card>
        )
      default:
        return <WelcomeStep onNext={() => setCurrentStep("aptitude")} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-6">
        <Logo />
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground capitalize">{currentStep} Round</span>
        </div>
      </header>
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="w-full max-w-4xl mx-auto">
          {renderStep()}
        </div>
      </main>
    </div>
  );
}
