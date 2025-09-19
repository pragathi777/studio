
import Link from "next/link";
import {
  File,
} from "lucide-react";

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

const pastInterviews = [
    {
      id: "INV001",
      role: "Frontend Developer",
      date: "2023-06-23",
      score: 85,
      status: "Completed",
    },
    {
      id: "INV002",
      role: "Backend Developer",
      date: "2023-06-20",
      score: 72,
      status: "Completed",
    },
    {
      id: "INV003",
      role: "Full Stack Engineer",
      date: "2023-06-15",
      score: 91,
      status: "Completed",
    },
    {
        id: "INV004",
        role: "Data Scientist",
        date: "2023-06-12",
        score: 88,
        status: "Completed",
    },
    {
        id: "INV005",
        role: "DevOps Engineer",
        date: "2023-06-10",
        score: 79,
        status: "Completed",
    },
  ];

export default function ReportsPage() {
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
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pastInterviews.map((interview) => (
              <TableRow key={interview.id}>
                <TableCell>
                  <div className="font-medium">{interview.role}</div>
                </TableCell>
                <TableCell>{interview.date}</TableCell>
                <TableCell className="text-right">
                  {interview.score}/100
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="text-sm">
                    {interview.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">
                    View Report
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
