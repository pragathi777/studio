
"use client";

import Link from "next/link";
import { ArrowUpRight, Bot, Code, BrainCircuit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCollection } from "@/firebase";
import { useUser, useFirestore, useMemoFirebase } from "@/firebase/provider";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { format } from "date-fns";

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const interviewsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, "users", user.uid, "interviewSessions"),
      orderBy("startTime", "desc"),
      limit(5)
    );
  }, [firestore, user]);

  const { data: pastInterviews, isLoading } = useCollection(interviewsQuery);

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="font-headline">Start a New Mock Interview</CardTitle>
            <CardDescription>
              Test your skills with our AI-powered interview simulation.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground">
              Our process includes three rounds: Aptitude, Technical Coding, and a simulated HR interview. Get detailed feedback and improve your performance.
            </p>
          </CardContent>
          <CardContent>
            <Link href="/interview">
              <Button className="w-full">
                Start New Interview
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Interview Stages</CardTitle>
            <CardDescription>
              Our comprehensive interview process covers all bases.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-muted p-3 rounded-md">
                <BrainCircuit className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Aptitude Round</p>
                <p className="text-sm text-muted-foreground">Mathematical, verbal & logical reasoning.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-muted p-3 rounded-md">
                <Code className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Technical Round</p>
                <p className="text-sm text-muted-foreground">Live coding challenge with compiler.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-muted p-3 rounded-md">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">HR Round</p>
                <p className="text-sm text-muted-foreground">Conversational interview with AI HR.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-2">
            <CardTitle className="font-headline">Past Interviews</CardTitle>
            <CardDescription>
              Review your performance from recent sessions.
            </CardDescription>
          </div>
          <Button asChild size="sm" className="ml-auto gap-1">
            <Link href="/dashboard/reports">
              View All
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="hidden md:table-cell text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Loading reports...</TableCell>
                </TableRow>
              )}
              {!isLoading && pastInterviews && pastInterviews.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">No past interviews found.</TableCell>
                </TableRow>
              )}
              {pastInterviews && pastInterviews.map((interview) => (
                <TableRow key={interview.id}>
                  <TableCell>
                    <div className="font-medium">{interview.jobTitle || 'N/A'}</div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {interview.startTime ? format(new Date(interview.startTime.seconds * 1000), "PPP") : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">{interview.overallScore?.toFixed(0) ?? 'N/A'}/100</TableCell>
                  <TableCell className="hidden md:table-cell text-center">
                    <Badge variant="outline" className="text-sm">Completed</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                       <Link href={`/dashboard/reports/${interview.id}`}>View Report</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
