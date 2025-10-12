
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";

interface AptitudeResultsStepProps {
  score: number;
  onNext: () => void;
}

const AptitudeResultsStep: React.FC<AptitudeResultsStepProps> = ({ score, onNext }) => {
  const passed = score >= 70;

  return (
    <Card className="shadow-lg text-center">
      <CardHeader>
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full mb-4"
        style={{
            backgroundColor: passed ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--destructive) / 0.1)',
        }}
        >
        {passed ? (
            <CheckCircle2 className="h-12 w-12 text-primary" />
        ) : (
            <XCircle className="h-12 w-12 text-destructive" />
        )}
        </div>
        <CardTitle className="text-3xl font-headline text-center">Aptitude Round Complete</CardTitle>
        <CardDescription className="text-center pt-2">
          You have completed the aptitude round. Here is your score.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="text-6xl font-bold" style={{ color: passed ? 'hsl(var(--primary))' : 'hsl(var(--destructive))' }}>
          {score.toFixed(0)}%
        </div>
        {passed ? (
            <p className="text-muted-foreground">Congratulations! You've passed the cutoff and will now proceed to the Technical Coding Round.</p>
        ) : (
            <p className="text-muted-foreground">Unfortunately, you did not meet the 70% cutoff for this round. Keep practicing and try again!</p>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={onNext} className="w-full" size="lg">
          {passed ? "Start Coding Round" : "Back to Dashboard"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AptitudeResultsStep;
