'use client';

import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { Loader2, AlertTriangle, FileText, Activity, BrainCircuit, Code, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Markdown from '@/components/markdown';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ReportDetailPage() {
  const { reportId } = useParams();
  const firestore = useFirestore();

  const reportRef = useMemoFirebase(() => {
    if (!firestore || !reportId) return null;
    // Assuming the user is fetched from a parent context or auth state
    const { user } = useUser();
    if (!user) return null; // You might want to handle this case more gracefully
    return doc(firestore, 'users', user.uid, 'interviewSessions', reportId as string);
  }, [firestore, reportId]);

  const { data: interview, isLoading, error } = useDoc(reportRef);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading Report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle />
            Error Loading Report
          </CardTitle>
          <CardDescription className="text-destructive">
            There was an error fetching the interview data. It might be due to a network issue or missing permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="font-mono text-sm text-destructive">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!interview) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Report Not Found</h2>
        <p className="text-muted-foreground">
          The requested interview report could not be found.
        </p>
         <Button asChild className="mt-4">
            <Link href="/dashboard/reports">Back to All Reports</Link>
        </Button>
      </div>
    );
  }

  const chartData = [
    { name: 'Aptitude', score: interview.aptitudeScore ?? 0, fill: 'hsl(var(--chart-1))' },
    { name: 'Coding', score: interview.codingScore ?? 0, fill: 'hsl(var(--chart-2))' },
    { name: 'HR Round', score: (interview.overallScore && interview.aptitudeScore && interview.codingScore) 
        ? (interview.overallScore - (interview.aptitudeScore * 0.3) - (interview.codingScore * 0.3)) / 0.4
        : 0, fill: 'hsl(var(--chart-3))' }
  ].filter(item => item.score > 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Interview Report: {interview.jobTitle}</CardTitle>
          <CardDescription>
            {interview.startTime ? new Date(interview.startTime.seconds * 1000).toLocaleString() : 'Date not available'}
          </CardDescription>
        </CardHeader>
        <CardContent>
            <h3 className="text-xl font-semibold mb-4">Overall Score: {interview.overallScore?.toFixed(0) ?? 'N/A'}/100</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip
                            contentStyle={{
                                background: 'hsl(var(--background))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: 'var(--radius)',
                            }}
                        />
                        <Bar dataKey="score" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText />AI-Generated Feedback</CardTitle>
        </CardHeader>
        <CardContent>
            <Markdown content={interview.feedbackReport} />
        </CardContent>
      </Card>

      {interview.proctoringAnalysis && (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity />Proctoring Analysis</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
                 {interview.proctoringAnalysis.malpracticeDetected ? (
                    <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" /> Malpractice Flagged</Badge>
                ) : (
                    <Badge variant="secondary">No Issues Detected</Badge>
                )}
                <Badge variant="outline">Confidence: {((interview.proctoringAnalysis.confidenceLevel ?? 0) * 100).toFixed(0)}%</Badge>
                <Badge variant="outline">Engagement: {((interview.proctoringAnalysis.engagementLevel ?? 0) * 100).toFixed(0)}%</Badge>
                <Badge variant="outline">Tab Switches: {interview.proctoringAnalysis.tabSwitches ?? 0}</Badge>
            </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Round-wise Details</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
            <Card className="bg-card/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><BrainCircuit /> Aptitude</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{interview.aptitudeScore?.toFixed(0) ?? 'N/A'}<span className="text-base font-normal text-muted-foreground">/100</span></p>
                </CardContent>
            </Card>
            <Card className="bg-card/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><Code /> Coding</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{interview.codingScore?.toFixed(0) ?? 'N/A'}<span className="text-base font-normal text-muted-foreground">/100</span></p>
                </CardContent>
            </Card>
            <Card className="bg-card/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><Users /> HR Round</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Conversation transcript is available for review in the full report data.</p>
                </CardContent>
            </Card>
        </CardContent>
      </Card>
    </div>
  );
}

// Add a simple useUser hook placeholder for compilation
function useUser() {
  const { user } = React.useContext(FirebaseContext);
  return { user };
}
