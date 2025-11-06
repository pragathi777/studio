
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { runCode } from "@/ai/flows/run-code";
import { generateCodingQuestion, GenerateCodingQuestionOutput } from "@/ai/flows/generate-coding-question";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface CodingStepProps {
  onNext: (score: number) => void;
}

type Language = keyof GenerateCodingQuestionOutput["solutionTemplates"];

const CodingStep: React.FC<CodingStepProps> = ({ onNext }) => {
  const [problem, setProblem] = useState<GenerateCodingQuestionOutput | null>(null);
  const [isProblemLoading, setIsProblemLoading] = useState(true);
  const [problemError, setProblemError] = useState<string | null>(null);
  
  const [language, setLanguage] = useState<Language>("java");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("You must run your code first");
  const [isRunning, setIsRunning] = useState(false);
  const [activeOutputTab, setActiveOutputTab] = useState("test-result");


  useEffect(() => {
    const fetchProblem = async () => {
      setIsProblemLoading(true);
      setProblemError(null);
      try {
        const difficulty = 'Medium';
        const newProblem = await generateCodingQuestion({ difficulty });
        setProblem(newProblem);
        setLanguage("java");
        setCode(newProblem.solutionTemplates.java);
      } catch (error) {
        console.error("Failed to generate coding question:", error);
        setProblemError("Could not load a coding question. Please try refreshing the page.");
      } finally {
        setIsProblemLoading(false);
      }
    };
    fetchProblem();
  }, []);

  const handleLanguageChange = (lang: Language) => {
      if (!problem) return;
      setLanguage(lang);
      setCode(problem.solutionTemplates[lang]);
      setOutput("You must run your code first");
  }

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput("Compiling...");
    setActiveOutputTab("test-result");
    try {
        const result = await runCode({ code, language });
        if(result.error) {
            setOutput(`Error:\n${result.error}`);
        } else {
            setOutput(`Output:\n${result.output}`);
        }
    } catch (error) {
        console.error("Failed to run code:", error);
        setOutput("An unexpected error occurred while running the code.");
    } finally {
        setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    setIsRunning(true);
    let score = 0;
    try {
        const result = await runCode({ code, language });
        // This is a very simplistic scoring mechanism. 
        // A real-world scenario would run multiple hidden test cases.
        const correctAnswer = "true"; // Placeholder for actual expected output
        if (result.output?.trim().toLowerCase().includes(correctAnswer)) {
            score = 100;
        } else if (result.error) {
            score = 10; // Low score for code that doesn't run
        }
        else {
            score = 30; // Partial score for attempting but wrong answer
        }
    } catch (e) {
        score = 10; // Low score for code that doesn't run
    } finally {
        setIsRunning(false);
        onNext(score);
    }
  };

  const renderProblemContent = () => {
    if (isProblemLoading) {
      return (
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-6 w-1/4 mt-4" />
          <Skeleton className="h-12 w-full" />
        </div>
      );
    }
    
    if (problemError) {
        return (
            <Card className="m-4 bg-destructive/10 border-destructive/50">
                <CardHeader className="flex flex-row items-center gap-4">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                    <h2 className="text-lg font-semibold text-destructive">Error</h2>
                </CardHeader>
                <CardContent>
                    <p className="text-destructive">{problemError}</p>
                </CardContent>
            </Card>
        )
    }

    if (!problem) return null;

    return (
        <>
            <h2 className="text-xl font-bold font-headline mb-2 text-gray-200">{problem.title}</h2>
            <span className="inline-block bg-yellow-600/20 text-yellow-400 text-xs font-medium px-2.5 py-1 rounded-full mb-4">{problem.difficulty}</span>
            <p className="text-gray-400 mb-4 whitespace-pre-wrap">{problem.description}</p>
            
            <p className="font-semibold mb-2 text-gray-300">Example 1:</p>
            <pre className="bg-[#0d1117] p-3 rounded-md text-sm font-code text-gray-300 mb-4 whitespace-pre-wrap">{problem.example1}</pre>

            <p className="font-semibold mb-2 text-gray-300">Example 2:</p>
            <pre className="bg-[#0d1117] p-3 rounded-md text-sm font-code text-gray-300 whitespace-pre-wrap">{problem.example2}</pre>
        </>
    );
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-4rem)] w-full bg-[#0d1117] text-white">
        <ResizablePanel defaultSize={40}>
            <div className="h-full flex flex-col bg-[#161b22] m-2 rounded-lg">
                <div className="p-2 border-b border-[#30363d]">
                    <TabsList className="bg-[#161b22]">
                        <TabsTrigger value="description" className="data-[state=active]:bg-[#21262d] data-[state=active]:text-white">Description</TabsTrigger>
                    </TabsList>
                </div>
                <div className="flex-grow p-4 pt-2 overflow-auto">
                    {renderProblemContent()}
                </div>
            </div>
        </ResizablePanel>
        <ResizableHandle withHandle className="bg-[#0d1117]" />
        <ResizablePanel defaultSize={60}>
            <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={65}>
                    <div className="h-full flex flex-col bg-[#161b22] m-2 mb-0 rounded-t-lg">
                        <div className="flex justify-between items-center p-2 border-b border-[#30363d]">
                            <p className="text-sm font-medium px-2">&lt;/&gt; Code</p>
                            <Select value={language} onValueChange={(val) => handleLanguageChange(val as Language)} disabled={isProblemLoading}>
                                <SelectTrigger className="w-[120px] h-8 bg-[#0d1117] border-[#30363d] text-white focus:ring-1 focus:ring-offset-0 focus:ring-[#30363d]">
                                    <SelectValue placeholder="Language" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#161b22] border-[#30363d] text-white">
                                    <SelectItem value="python" className="focus:bg-[#21262d]">Python</SelectItem>
                                    <SelectItem value="javascript" className="focus:bg-[#21262d]">JavaScript</SelectItem>
                                    <SelectItem value="java" className="focus:bg-[#21262d]">Java</SelectItem>
                                    <SelectItem value="c" className="focus:bg-[#21262d]">C</SelectItem>
                                    <SelectItem value="cpp" className="focus:bg-[#21262d]">C++</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Loading code template..."
                            className="h-full w-full font-code bg-[#0d1117] border-0 rounded-none focus-visible:ring-0 text-gray-300 flex-grow"
                            disabled={isProblemLoading || !!problemError}
                        />
                    </div>
                </ResizablePanel>
                <ResizableHandle withHandle className="bg-[#0d1117] my-2" />
                <ResizablePanel defaultSize={35}>
                    <div className="h-full flex flex-col bg-[#161b22] m-2 mt-0 rounded-b-lg">
                        <Tabs value={activeOutputTab} onValueChange={setActiveOutputTab} className="h-full flex flex-col">
                            <div className="flex justify-between items-center p-2 border-b border-[#30363d]">
                                <TabsList className="bg-[#161b22]">
                                    <TabsTrigger value="testcase" className="data-[state=active]:bg-[#21262d] data-[state=active]:text-white">Testcase</TabsTrigger>
                                    <TabsTrigger value="test-result" className="data-[state=active]:bg-[#21262d] data-[state=active]:text-white">Test Result</TabsTrigger>
                                </TabsList>
                            </div>
                            <TabsContent value="testcase" className="flex-grow m-0 p-4 text-gray-400 text-sm">
                                The code is tested against the examples provided in the description. More test cases coming soon.
                            </TabsContent>
                            <TabsContent value="test-result" className="flex-grow m-0">
                                <pre className="bg-[#0d1117] text-gray-300 p-4 text-sm font-code h-full w-full overflow-auto whitespace-pre-wrap">{output}</pre>
                            </TabsContent>
                             <div className="flex justify-end gap-2 p-2 border-t border-[#30363d]">
                                <Button variant="secondary" onClick={handleRunCode} disabled={isRunning || isProblemLoading || !!problemError} className="bg-[#21262d] hover:bg-[#30363d] text-white">
                                    {isRunning && output === 'Compiling...' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Run Code
                                </Button>
                                <Button onClick={handleSubmit} disabled={isRunning || isProblemLoading || !!problemError} className="bg-green-600 hover:bg-green-700 text-white">
                                    {isRunning && output !== 'Compiling...' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Submit & Next
                                </Button>
                            </div>
                        </Tabs>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default CodingStep;
