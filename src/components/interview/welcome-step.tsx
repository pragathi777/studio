import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ShieldAlert } from "lucide-react";

interface WelcomeStepProps {
  onNext: () => void;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
  const handleStart = () => {
    // Here you would typically request permissions for mic, camera, screen
    // For now, we just move to the next step
    onNext();
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-3xl font-headline text-center">Welcome to Your Mock Interview</CardTitle>
        <CardDescription className="text-center pt-2">
          Prepare yourself for a comprehensive evaluation of your skills.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div>
            <h3 className="font-semibold mb-4 text-lg">Interview Structure</h3>
            <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span><span className="font-semibold text-foreground">Round 1: Aptitude Test</span> - A series of questions to test your logical, verbal, and mathematical skills.</span>
                </li>
                <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span><span className="font-semibold text-foreground">Round 2: Coding Challenge</span> - Solve a coding problem in our integrated environment.</span>
                </li>
                <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span><span className="font-semibold text-foreground">Round 3: HR Interview</span> - A one-on-one conversational interview with our AI HR.</span>
                </li>
            </ul>
        </div>
        <div>
            <h3 className="font-semibold mb-4 text-lg">Important Instructions</h3>
            <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                    <ShieldAlert className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                    <span>Ensure you are in a quiet environment with a stable internet connection.</span>
                </li>
                <li className="flex items-start gap-3">
                    <ShieldAlert className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                    <span>This session will be recorded for analysis. Your camera, microphone, and screen will be monitored.</span>
                </li>
                <li className="flex items-start gap-3">
                    <ShieldAlert className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                    <span>Switching tabs during the test is prohibited and will be flagged.</span>
                </li>
            </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleStart} className="w-full" size="lg">
          I Understand, Let&apos;s Begin
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WelcomeStep;
