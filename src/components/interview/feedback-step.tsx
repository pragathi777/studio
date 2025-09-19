"use client";

import { useState, useEffect } from "react";
import { provideDetailedFeedback } from "@/ai/flows/provide-detailed-feedback";
import type { InterviewData } from "@/app/interview/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import Link from "next/link";

interface FeedbackStepProps {
  interviewData: InterviewData;
}

const FeedbackStep: React.FC<FeedbackStepProps> = ({ interviewData }) => {
  const [feedback, setFeedback] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getFeedback = async () => {
      try {
        const result = await provideDetailedFeedback({
            // These are mock inputs, replace with actual analysis from previous steps
            verbalClarity: "Good",
            technicalAccuracy: "Mostly accurate",
            relevance: "Answers were relevant",
            confidenceLevel: "Appeared confident",
            stressLevels: "Low",
            areasForImprovement: "Could provide more detailed examples.",
            overallScore: 78,
            tabSwitchingDetected: false,
            screenSharingQuality: "Clear and organized",
        });
        setFeedback(result.feedbackReport);
      } catch (error) {
        console.error("Failed to generate feedback:", error);
        setFeedback("There was an error generating your feedback report. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    getFeedback();
  }, [interviewData]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Analyzing your performance and generating feedback...</p>
      </div>
    );
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-3xl font-headline text-center">Interview Performance Report</CardTitle>
        <CardDescription className="text-center pt-2">Here's a detailed breakdown of your performance.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">Overall Score: 78/100</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label>Aptitude Round: {interviewData.aptitudeScore ?? 70}%</Label>
                    <Progress value={interviewData.aptitudeScore ?? 70} className="mt-1" />
                </div>
                <div>
                    <Label>Coding Round: {interviewData.codingScore ?? 80}%</Label>
                    <Progress value={interviewData.codingScore ?? 80} className="mt-1" />
                </div>
                 <div>
                    <Label>HR Round Analysis</Label>
                    <div className="flex gap-2 mt-2">
                        <Badge variant="secondary">Confidence: High</Badge>
                        <Badge variant="secondary">Clarity: Good</Badge>
                        <Badge variant={false ? "destructive" : "default"}>Proctoring: No issues</Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">Detailed Feedback</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none text-sm text-muted-foreground">
                {feedback.split('\n').map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                ))}
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
