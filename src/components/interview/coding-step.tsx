"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

interface CodingStepProps {
  onNext: (score: number) => void;
}

const problem = {
  title: "Find the First Non-Repeating Character",
  description: "Given a string, find the first non-repeating character in it and return its index. If it doesn't exist, return -1.",
  example: `Input: "aaiperform"\nOutput: 1 (character 'i' at index 1)`
};

const CodingStep: React.FC<CodingStepProps> = ({ onNext }) => {
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const handleRunCode = () => {
    setIsRunning(true);
    setOutput("Compiling...");
    // Simulate compilation and execution
    setTimeout(() => {
      // This is a mock. A real implementation would run the code in a sandbox.
      if (code.includes("aaiperform")) {
        setOutput("Output: 1");
      } else {
        setOutput("Error: Your code did not produce the correct output for the example case.");
      }
      setIsRunning(false);
    }, 2000);
  };

  const handleSubmit = () => {
    // Mock scoring logic
    const score = Math.random() > 0.3 ? 80 : 40; // 70% chance to pass
    onNext(score);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[70vh]">
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline">{problem.title}</CardTitle>
          <CardDescription>{problem.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="font-semibold mb-2">Example:</p>
          <pre className="bg-muted p-4 rounded-md text-sm font-code">{problem.example}</pre>
        </CardContent>
      </Card>
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline">Code Editor</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col gap-4">
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Write your code here..."
            className="flex-grow font-code h-full"
          />
          <Separator />
          <div className="h-24">
            <p className="font-semibold mb-2">Output</p>
            <pre className="bg-muted p-2 rounded-md text-sm font-code h-full overflow-auto">{output}</pre>
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button variant="outline" onClick={handleRunCode} disabled={isRunning}>
            {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Run Code
          </Button>
          <Button onClick={handleSubmit}>Submit & Next</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CodingStep;
