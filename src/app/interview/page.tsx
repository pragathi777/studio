
"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { analyzeFacialExpressions } from "@/ai/flows/analyze-facial-expressions";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

type AnalyzeFacialExpressionsOutput = {
    confidenceLevel: number;
    engagementLevel: number;
    malpracticeDetected: boolean;
};


type InterviewStep = "welcome" | "aptitude" | "aptitude-results" | "coding" | "hr" | "feedback" | "failed";

export type HRConversation = { speaker: 'user' | 'ai'; text: string }[];

export type ProctoringAnalysis = AnalyzeFacialExpressionsOutput & {
  tabSwitches: number;
  proctoringSummary: string;
}

export type InterviewData = {
  jobTitle: string;
  isPracticeMode: boolean;
  aptitudeScore?: number;
  codingScore?: number;
  hrConversation?: HRConversation;
  proctoringAnalysis?: ProctoringAnalysis,
  finalFeedback?: string;
  overallScore?: number;
};

// Use React.Suspense for the page component
export default function InterviewPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <InterviewPageContent />
    </React.Suspense>
  );
}

function InterviewPageContent() {
  const searchParams = useSearchParams();
  const startParam = searchParams.get('start');
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);


  const getInitialStep = (): InterviewStep => {
    if (startParam === 'hr' || startParam === 'coding' || startParam === 'aptitude') {
      return 'welcome'; // Always start at welcome to get permissions
    }
    return 'welcome';
  }

  const [currentStep, setCurrentStep] = useState<InterviewStep>(getInitialStep());
  const [interviewData, setInterviewData] = useState<InterviewData>({ 
    jobTitle: 'Software Engineer',
    isPracticeMode: !!startParam,
    proctoringAnalysis: {
      confidenceLevel: 0,
      engagementLevel: 0,
      malpracticeDetected: false,
      tabSwitches: 0,
      proctoringSummary: 'No issues detected.'
    }
  });
  const [isProctoringActive, setIsProctoringActive] = useState(false);
  const [videoDataUri, setVideoDataUri] = useState<string | null>(null);
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Stop media tracks on component unmount
    return () => {
      mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    }
  }, []);


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

  const handleStart = async () => {
     try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasPermissions(true);
      if (interviewData.isPracticeMode) {
        setCurrentStep(startParam as InterviewStep);
      } else {
        setCurrentStep('aptitude');
      }
      setIsProctoringActive(true);
    } catch (error) {
      console.error("Error accessing media devices:", error);
      setHasPermissions(false);
      toast({
        variant: 'destructive',
        title: 'Permissions Denied',
        description: 'Please enable camera and microphone permissions in your browser settings to start the interview.',
      });
    }
  };


  const renderStep = () => {
    if (isUserLoading) {
      return <div>Loading user...</div>
    }
    if (!user) {
      return <div>Please sign in to start an interview.</div>
    }
    if (hasPermissions === false && currentStep !== 'welcome') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-destructive">Permissions Required</CardTitle>
                    <CardDescription>
                        We couldn't access your camera and microphone. Please enable these permissions in your browser's settings for this site and refresh the page to continue.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <Button asChild>
                        <Link href="/dashboard">Back to Dashboard</Link>
                    </Button>
                </CardContent>
            </Card>
        )
    }
    
    switch (currentStep) {
      case "welcome":
        return <WelcomeStep onNext={handleStart} />;
      case "aptitude":
        return (
          <AptitudeStep
            onNext={(score) => {
              updateInterviewData({ aptitudeScore: score });
               if (interviewData.isPracticeMode) {
                setIsProctoringActive(false);
                setCurrentStep("feedback");
              } else {
                setCurrentStep("aptitude-results");
              }
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
              if (interviewData.isPracticeMode) {
                setIsProctoringActive(false);
                setCurrentStep("feedback");
              } else {
                setCurrentStep("hr");
              }
            }}
          />
        );
      case "hr":
        return (
          <HRStep
            onNext={(conversation) => {
              updateInterviewData({ hrConversation: conversation });
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
        return <WelcomeStep onNext={handleStart} />;
    }
  };
  
  const isCodingStep = currentStep === "coding";

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Logo />
            <h1 className="text-xl font-bold font-headline text-foreground">
            AI Interviews
          </h1>
        </Link>
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
        {isProctoringActive && mediaStreamRef.current && (
            <Proctoring 
                onVisibilityChange={handleProctoringVisibilityChange}
                onVideoData={handleVideoData}
                onEndInterview={handleEndInterview}
                videoStream={mediaStreamRef.current}
            />
        )}
        <div className={cn(
            "w-full mx-auto relative",
            isCodingStep ? "h-full" : "max-w-4xl"
        )}>
          {renderStep()}
           <video ref={videoRef} className="w-full aspect-video rounded-md absolute top-0 left-0 -z-10" autoPlay muted />
          {hasPermissions === false && (
              <Alert variant="destructive" className="mt-4">
                  <AlertTitle>Camera and Microphone Access Required</AlertTitle>
                  <AlertDescription>
                      Please allow camera and microphone access to use this feature and refresh the page.
                  </AlertDescription>
              </Alert>
          )}
        </div>
      </main>
    </div>
  );
}
