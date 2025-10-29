
"use client";

import { useState } from "react";
import WelcomeStep from "@/components/interview/welcome-step";
import AptitudeStep from "@/components/interview/aptitude-step";
import AptitudeResultsStep from "@/components/interview/aptitude-results-step";
import CodingStep from "@/components/interview/coding-step";
import HRStep from "@/components/interview/hr-step";
import FeedbackStep from "@/components/interview/feedback-step";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useUser } from "@/firebase";
import { Proctoring } from "@/components/interview/proctoring";
import { analyzeVideo, AnalyzeVideoOutput } from "@/ai/flows/analyze-video";


type InterviewStep = "welcome" | "aptitude" | "aptitude-results" | "coding" | "hr" | "feedback" | "failed";

export type HRAnalysis = {
  conversation: { speaker: 'user' | 'ai'; text: string }[];
}

export type ProctoringAnalysis = AnalyzeVideoOutput & {
  tabSwitches: number;
}

export type InterviewData = {
  jobTitle: string;
  aptitudeScore?: number;
  codingScore?: number;
  hrAnalysis?: HRAnalysis;
  proctoringAnalysis?: ProctoringAnalysis,
  finalFeedback?: string;
  overallScore?: number;
};

export default function InterviewPage() {
  const [currentStep, setCurrentStep] = useState<InterviewStep>("welcome");
  const [interviewData, setInterviewData] = useState<InterviewData>({ jobTitle: 'Software Engineer' });
  const [isProctoringActive, setIsProctoringActive] = useState(false);
  const { user, isUserLoading } = useUser();

  const updateInterviewData = (data: Partial<InterviewData>) => {
    setInterviewData((prev) => ({ ...prev, ...data }));
  };

  const handleProctoringVisibilityChange = (status: { tabSwitches: number }) => {
    setInterviewData(prev => ({
      ...prev,
      proctoringAnalysis: {
        ...prev.proctoringAnalysis,
        tabSwitches: status.tabSwitches,
        malpracticeDetected: (prev.proctoringAnalysis?.malpracticeDetected || false) || status.tabSwitches > 0,
      } as ProctoringAnalysis
    }))
  }

  const handleVideoData = async (videoDataUri: string) => {
    // Analyze the complete video at the end of the interview
    if (currentStep === 'feedback') {
        try {
            const analysis = await analyzeVideo({ videoDataUri });
            setInterviewData(prev => ({
                ...prev,
                proctoringAnalysis: {
                    ...prev.proctoringAnalysis,
                    ...analysis,
                    malpracticeDetected: (prev.proctoringAnalysis?.tabSwitches || 0) > 0 || analysis.malpracticeDetected,
                }
            }))
        } catch (error) {
            console.error("Failed to analyze video:", error);
        }
    }
  }


  const renderStep = () => {
    if (isUserLoading) {
      return <div>Loading user...</div>
    }
    if (!user) {
      return <div>Please sign in to start an interview.</div>
    }
    
    switch (currentStep) {
      case "welcome":
        return <WelcomeStep onNext={() => {
          setIsProctoringActive(true);
          setCurrentStep("aptitude");
        }} />;
      case "aptitude":
        return (
          <AptitudeStep
            onNext={(score) => {
              updateInterviewData({ aptitudeScore: score });
              setCurrentStep("aptitude-results");
            }}
          />
        );
      case "aptitude-results":
        return (
            <AptitudeResultsStep 
                score={interviewData.aptitudeScore || 0}
                onNext={() => {
                    if ((interviewData.aptitudeScore || 0) >= 70) {
                        setCurrentStep("coding");
                    } else {
                        setCurrentStep("failed");
                    }
                }}
            />
        )
      case "coding":
        return (
          <CodingStep
            onNext={(score) => {
              updateInterviewData({ codingScore: score });
              setCurrentStep("hr");
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
        return <FeedbackStep interviewData={interviewData} userId={user.uid} />;
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
          <span className="text-sm text-muted-foreground capitalize">{currentStep.replace('-', ' ')} Round</span>
        </div>
      </header>
      <main className="flex-grow flex items-center justify-center p-6">
        {isProctoringActive && currentStep !== 'feedback' && (
            <Proctoring 
                onVisibilityChange={handleProctoringVisibilityChange}
                onVideoData={handleVideoData}
            />
        )}
        <div className="w-full max-w-4xl mx-auto">
          {renderStep()}
        </div>
      </main>
    </div>
  );
}

