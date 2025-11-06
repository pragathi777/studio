
"use client";

import { useState, useEffect } from "react";
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
import { analyzeFacialExpressions, AnalyzeFacialExpressionsOutput } from "@/ai/flows/analyze-facial-expressions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";


type InterviewStep = "welcome" | "aptitude" | "aptitude-results" | "coding" | "hr" | "feedback" | "failed";

export type HRAnalysis = {
  conversation: { speaker: 'user' | 'ai'; text: string }[];
}

export type ProctoringAnalysis = AnalyzeFacialExpressionsOutput & {
  tabSwitches: number;
  proctoringSummary: string;
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
  const [videoDataUri, setVideoDataUri] = useState<string | null>(null);
  const { user, isUserLoading } = useUser();
  const router = useRouter();


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
  
  const handleVideoData = (dataUri: string) => {
    setVideoDataUri(dataUri);
  }
  
  const handleEndInterview = () => {
    router.push('/dashboard');
  }

  useEffect(() => {
    const analyze = async () => {
      if (currentStep === 'feedback' && videoDataUri) {
          try {
              const analysis = await analyzeFacialExpressions({ videoDataUri });
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
          } finally {
            // To prevent re-analyzing
            setVideoDataUri(null);
          }
      }
    }
    analyze();
  }, [currentStep, videoDataUri]);
  

  useEffect(() => {
    if (isProctoringActive) {
      const preventDefault = (e: Event) => e.preventDefault();

      const handleContextMenu = (e: MouseEvent) => preventDefault(e);
      const handleCopy = (e: ClipboardEvent) => preventDefault(e);
      const handlePaste = (e: ClipboardEvent) => preventDefault(e);

      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('copy', handleCopy);
      document.addEventListener('paste', handlePaste);

      return () => {
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('copy', handleCopy);
        document.removeEventListener('paste', handlePaste);
      };
    }
  }, [isProctoringActive]);


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
                        setIsProctoringActive(false);
                        setCurrentStep("feedback");
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
              setIsProctoringActive(false);
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
  
  const isCodingStep = currentStep === "coding";

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-6">
        <Logo />
        <div className="flex items-center gap-4">
          {currentStep !== 'welcome' && currentStep !== 'coding' && (
            <span className="text-sm text-muted-foreground capitalize">{currentStep.replace('-', ' ')} Round</span>
          )}
        </div>
      </header>
      <main className={cn(
          "flex-grow flex items-center justify-center",
          !isCodingStep && "p-6"
      )}>
        {isProctoringActive && (
            <Proctoring 
                onVisibilityChange={handleProctoringVisibilityChange}
                onVideoData={handleVideoData}
                onEndInterview={handleEndInterview}
            />
        )}
        <div className={cn(
            "w-full mx-auto",
            isCodingStep ? "h-full" : "max-w-4xl"
        )}>
          {renderStep()}
        </div>
      </main>
    </div>
  );
}

    