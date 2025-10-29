
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { runCode } from "@/ai/flows/run-code";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

interface CodingStepProps {
  onNext: (score: number) => void;
}

const problem = {
  title: "Find the First Non-Repeating Character",
  description: "Given a string, find the first non-repeating character in it and return its index. If it doesn't exist, return -1.",
  example: `Input: "interviewace"\nOutput: 1 (character 'n' at index 1)`,
  example2: `Input: "leetcode"\nOutput: 0 (character 'l' at index 0)`,
};

const languageTemplates = {
    "python": "def solve(s):\n  # Your code here\n  return -1\n\nprint(solve(\"interviewace\"))",
    "java": "class Solution {\n    public int firstUniqChar(String s) {\n        // Your code here\n        return -1;\n    }\n\n    public static void main(String[] args) {\n        Solution sol = new Solution();\n        System.out.println(sol.firstUniqChar(\"interviewace\"));\n    }\n}",
    "c": "#include <stdio.h>\n#include <string.h>\n\nint firstUniqChar(char * s){\n    // Your code here\n    return -1;\n}\n\nint main() {\n    printf(\"%d\\n\", firstUniqChar(\"interviewace\"));\n    return 0;\n}",
    "cpp": "#include <iostream>\n#include <string>\n\nint firstUniqChar(std::string s) {\n    // Your code here\n    return -1;\n}\n\nint main() {\n    std::cout << firstUniqChar(\"interviewace\") << std::endl;\n    return 0;\n}"
}

type Language = keyof typeof languageTemplates;

const CodingStep: React.FC<CodingStepProps> = ({ onNext }) => {
  const [language, setLanguage] = useState<Language>("python");
  const [code, setCode] = useState(languageTemplates["python"]);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState("code");


  const handleLanguageChange = (lang: Language) => {
      setLanguage(lang);
      setCode(languageTemplates[lang]);
      setOutput("");
  }

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput("Compiling...");
    setActiveTab("output");
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
        const correctAnswer = "1";
        if (result.output.trim() === correctAnswer) {
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

  return (
    <ResizablePanelGroup direction="horizontal" className="h-[85vh] w-full rounded-lg border">
        <ResizablePanel defaultSize={50}>
            <Tabs defaultValue="description" className="h-full flex flex-col">
                <TabsList className="m-2">
                    <TabsTrigger value="description">Description</TabsTrigger>
                </TabsList>
                <TabsContent value="description" className="flex-grow p-4 pt-0 overflow-auto">
                    <h2 className="text-2xl font-bold font-headline mb-4">{problem.title}</h2>
                    <p className="text-muted-foreground mb-4">{problem.description}</p>
                    
                    <p className="font-semibold mb-2">Example 1:</p>
                    <pre className="bg-muted p-4 rounded-md text-sm font-code mb-4">{problem.example}</pre>

                    <p className="font-semibold mb-2">Example 2:</p>
                    <pre className="bg-muted p-4 rounded-md text-sm font-code">{problem.example2}</pre>

                </TabsContent>
            </Tabs>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50}>
            <div className="h-full flex flex-col">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                    <div className="flex justify-between items-center p-2">
                        <TabsList>
                            <TabsTrigger value="code">Code</TabsTrigger>
                            <TabsTrigger value="output">Output</TabsTrigger>
                        </TabsList>
                         <Select value={language} onValueChange={(val) => handleLanguageChange(val as Language)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="python">Python</SelectItem>
                                <SelectItem value="java">Java</SelectItem>
                                <SelectItem value="c">C</SelectItem>
                                <SelectItem value="cpp">C++</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <TabsContent value="code" className="flex-grow m-0">
                        <Textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Write your code here..."
                            className="h-full w-full font-code bg-card border-0 rounded-none focus-visible:ring-0"
                        />
                    </TabsContent>

                    <TabsContent value="output" className="flex-grow m-0">
                         <pre className="bg-card text-foreground p-4 rounded-md text-sm font-code h-full w-full overflow-auto">{output || "Run code to see output..."}</pre>
                    </TabsContent>

                    <div className="flex justify-end gap-2 p-2 border-t">
                        <Button variant="outline" onClick={handleRunCode} disabled={isRunning}>
                            {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Run Code
                        </Button>
                        <Button onClick={handleSubmit} disabled={isRunning}>
                            {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit & Next
                        </Button>
                    </div>
                </Tabs>
            </div>
        </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default CodingStep;
