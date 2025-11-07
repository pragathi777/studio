
"use client";

import { useState, useEffect } from "react";
import { provideDetailedFeedback, ProvideDetailedFeedbackOutput } from "@/ai/flows/provide-detailed-feedback";
import type { InterviewData } from "@/app/interview/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useFirestore } from "@/firebase/provider";
import { collection, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";


interface FeedbackStepProps {
  interviewData: InterviewData;
  userId: string;
}

const FeedbackStep: React.FC<FeedbackStepProps> = ({ interviewData, userId }) => {
  const [feedbackResult, setFeedbackResult] = useState<ProvideDetailedFeedbackOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const firestore = useFirestore();

  useEffect(() => {
    const getFeedbackAndSave = async () => {
      if (!userId || !firestore || isSaved) return;

      setIsLoading(true);
      try {
        const result = await provideDetailedFeedback({
            aptitudeScore: interviewData.aptitudeScore,
            codingScore: interviewData.codingScore,
            hrConversation: interviewData.hrConversation,
            proctoringAnalysis: interviewData.proctoringAnalysis,
        });
        setFeedbackResult(result);

        const sessionData = {
          userId,
          jobTitle: interviewData.jobTitle,
          startTime: serverTimestamp(),
          endTime: serverTimestamp(),
          overallScore: result.overallScore,
          aptitudeScore: interviewData.aptitudeScore ?? null,
          codingScore: interviewData.codingScore ?? null,
          feedbackReport: result.feedbackReport,
          hrConversation: interviewData.hrConversation ?? null,
          proctoringAnalysis: interviewData.proctoringAnalysis ?? null,
        };
        
        const interviewSessionsRef = collection(firestore, 'users', userId, 'interviewSessions');
        await addDocumentNonBlocking(interviewSessionsRef, sessionData);
        setIsSaved(true);

      } catch (error) {
        console.error("Failed to generate or save feedback:", error);
        setFeedbackResult({ 
            feedbackReport: "There was an error generating your feedback report. Please try again later.",
            overallScore: 0
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    getFeedbackAndSave();
  }, [interviewData, userId, firestore, isSaved]);

  const renderMarkdown = (markdown: string) => {
    // A simple markdown to JSX renderer
    return markdown.split('\n').map((line, index) => {
        if (line.startsWith('### ')) return <h3 key={index} className="text-lg font-semibold mt-4 mb-2 text-foreground">{line.substring(4)}</h3>;
        if (line.startsWith('**')) return <p key={index} className="my-1"><strong className="font-semibold text-foreground">{line.replace(/\*\*/g, '')}</strong></p>;
        if (line.startsWith('- ')) return <li key={index} className="list-disc ml-6">{line.substring(2)}</li>;
        if (line.trim() === '') return <br key={index} />;
        return <p key={index} className="my-1">{line}</p>;
    });
};


  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Analyzing your performance and generating final report...</p>
      </div>
    );
  }
  
  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-3xl font-headline text-center">Interview Performance Report</CardTitle>
        <CardDescription className="text-center pt-2">Here's a breakdown of your performance.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">Overall Score: {feedbackResult?.overallScore?.toFixed(0) ?? 'N/A'}/100</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
                <div>
                    <Label>Aptitude Round</Label>
                    <Progress value={interviewData.aptitudeScore ?? 0} className="mt-1" />
                    <p className="text-sm text-muted-foreground mt-1">{interviewData.aptitudeScore?.toFixed(0) ?? 'N/A'}%</p>
                </div>
                <div>
                    <Label>Coding Round</Label>
                    <Progress value={interviewData.codingScore ?? 0} className="mt-1" />
                     <p className="text-sm text-muted-foreground mt-1">{interviewData.codingScore?.toFixed(0) ?? 'N/A'}%</p>
                </div>
                 <div className="md:col-span-2">
                    <Label>Proctoring Analysis</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {interviewData.proctoringAnalysis?.malpracticeDetected ? (
                           <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" /> Malpractice Flagged</Badge>
                        ) : (
                            <Badge variant="secondary">No Issues Detected</Badge>
                        )}
                        <Badge variant="outline">Confidence: {((interviewData.proctoringAnalysis?.confidenceLevel ?? 0) * 100).toFixed(0)}%</Badge>
                        <Badge variant="outline">Engagement: {((interviewData.proctoringAnalysis?.engagementLevel ?? 0) * 100).toFixed(0)}%</Badge>
                        <Badge variant="outline">Tab Switches: {interviewData.proctoringAnalysis?.tabSwitches ?? 0}</Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">AI Feedback & Suggestions</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none text-sm text-muted-foreground">
                {feedbackResult ? renderMarkdown(feedbackResult.feedbackReport) : 'No feedback available.'}
            </CardContent>
        </Card>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download Report
        </Button>
        <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FeedbackStep;
