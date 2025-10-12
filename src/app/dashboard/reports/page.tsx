"use client";

import Link from "next/link";
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
import { useCollection, useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { format } from "date-fns";

export default function ReportsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const interviewsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, "users", user.uid, "interviewSessions"),
      orderBy("startTime", "desc")
    );
  }, [firestore, user]);

  const { data: pastInterviews, isLoading } = useCollection(interviewsQuery);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">My Interview Reports</CardTitle>
        <CardDescription>
          Review your performance and feedback from all past interviews.
        </CardDescription>
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
                <TableCell className="text-right">
                  {interview.overallScore?.toFixed(0) ?? 'N/A'}/100
                </TableCell>
                <TableCell className="hidden md:table-cell text-center">
                  <Badge variant="outline" className="text-sm">
                    Completed
                  </Badge>
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
  );
}
