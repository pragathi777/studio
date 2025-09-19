"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CodingStepProps {
  onNext: (score: number) => void;
}

const problem = {
  title: "Find the First Non-Repeating Character",
  description: "Given a string, find the first non-repeating character in it and return its index. If it doesn't exist, return -1.",
  example: `Input: "aaiperform"\nOutput: 1 (character 'i' at index 1)`
};

const languageTemplates = {
    "python": "def solve(s):\n  # Your code here\n  return -1\n\nprint(solve(\"aaiperform\"))",
    "java": "class Solution {\n    public int firstUniqChar(String s) {\n        // Your code here\n        return -1;\n    }\n\n    public static void main(String[] args) {\n        Solution sol = new Solution();\n        System.out.println(sol.firstUniqChar(\"aaiperform\"));\n    }\n}",
    "c": "#include <stdio.h>\n#include <string.h>\n\nint firstUniqChar(char * s){\n    // Your code here\n    return -1;\n}\n\nint main() {\n    printf(\"%d\\n\", firstUniqChar(\"aaiperform\"));\n    return 0;\n}",
    "cpp": "#include <iostream>\n#include <string>\n\nint firstUniqChar(std::string s) {\n    // Your code here\n    return -1;\n}\n\nint main() {\n    std::cout << firstUniqChar(\"aaiperform\") << std::endl;\n    return 0;\n}"
}

type Language = keyof typeof languageTemplates;

const CodingStep: React.FC<CodingStepProps> = ({ onNext }) => {
  const [language, setLanguage] = useState<Language>("python");
  const [code, setCode] = useState(languageTemplates["python"]);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const handleLanguageChange = (lang: Language) => {
      setLanguage(lang);
      setCode(languageTemplates[lang]);
      setOutput("");
  }

  const handleRunCode = () => {
    setIsRunning(true);
    setOutput("Compiling...");
    // Simulate compilation and execution based on language
    setTimeout(() => {
      let mockOutput = "";
      switch (language) {
        case "python":
            mockOutput = code.includes("return 1") || code.includes("print(1)") ? "1" : "Error or wrong output";
            break;
        case "java":
            mockOutput = code.includes("return 1;") || code.includes("System.out.println(1)") ? "1" : "Error or wrong output";
            break;
        case "c":
             mockOutput = code.includes("return 1;") || code.includes("printf(\"%d\", 1)") ? "1" : "Error or wrong output";
            break;
        case "cpp":
            mockOutput = code.includes("return 1;") || code.includes("std::cout << 1") ? "1" : "Error or wrong output";
            break;
        default:
            mockOutput = "Language not supported for mock execution."
      }
      setOutput(`Output: ${mockOutput}`);
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
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="font-headline">Code Editor</CardTitle>
            </div>
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
