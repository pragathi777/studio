
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
    "python": `def solve(s):
  # Your code here
  # Example: Find first non-repeating character
  char_counts = {}
  for char in s:
    char_counts[char] = char_counts.get(char, 0) + 1
  
  for i, char in enumerate(s):
    if char_counts[char] == 1:
      return i
      
  return -1

# Test with an example
print(solve("interviewace"))`,
    "javascript": `function solve(s) {
  // Your code here
  // Example: Find first non-repeating character
  const charCounts = {};
  for (const char of s) {
    charCounts[char] = (charCounts[char] || 0) + 1;
  }
  
  for (let i = 0; i < s.length; i++) {
    if (charCounts[s[i]] === 1) {
      return i;
    }
  }
  
  return -1;
}

// Test with an example
console.log(solve("interviewace"));`,
    "java": `import java.util.HashMap;
import java.util.Map;

class Solution {
    public int firstUniqChar(String s) {
        // Your code here
        Map<Character, Integer> count = new HashMap<>();
        int n = s.length();
        for (int i = 0; i < n; i++) {
            char c = s.charAt(i);
            count.put(c, count.getOrDefault(c, 0) + 1);
        }
        
        for (int i = 0; i < n; i++) {
            if (count.get(s.charAt(i)) == 1) {
                return i;
            }
        }
        return -1;
    }

    public static void main(String[] args) {
        Solution sol = new Solution();
        System.out.println(sol.firstUniqChar("interviewace"));
    }
}`,
    "c": `#include <stdio.h>
#include <string.h>

int firstUniqChar(char * s){
    int count[26] = {0};
    int len = strlen(s);
    for (int i = 0; i < len; i++) {
        count[s[i] - 'a']++;
    }
    for (int i = 0; i < len; i++) {
        if (count[s[i] - 'a'] == 1) {
            return i;
        }
    }
    return -1;
}

int main() {
    printf("%d\\n", firstUniqChar("interviewace"));
    return 0;
}`,
    "cpp": `#include <iostream>
#include <string>
#include <unordered_map>

int firstUniqChar(std::string s) {
    std::unordered_map<char, int> count;
    for (char c : s) {
        count[c]++;
    }
    for (int i = 0; i < s.length(); i++) {
        if (count[s[i]] == 1) {
            return i;
        }
    }
    return -1;
}

int main() {
    std::cout << firstUniqChar("interviewace") << std::endl;
    return 0;
}`
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
    <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-4rem)] w-full bg-[#0d1117] text-white">
        <ResizablePanel defaultSize={40}>
            <Tabs defaultValue="description" className="h-full flex flex-col">
                <div className="p-2 border-b border-[#30363d]">
                    <TabsList className="bg-[#161b22]">
                        <TabsTrigger value="description" className="data-[state=active]:bg-[#21262d] data-[state=active]:text-white">Description</TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="description" className="flex-grow p-4 pt-2 overflow-auto">
                    <h2 className="text-2xl font-bold font-headline mb-4 text-gray-200">{problem.title}</h2>
                    <p className="text-gray-400 mb-4">{problem.description}</p>
                    
                    <p className="font-semibold mb-2 text-gray-300">Example 1:</p>
                    <pre className="bg-[#161b22] p-4 rounded-md text-sm font-code text-gray-300 mb-4">{problem.example}</pre>

                    <p className="font-semibold mb-2 text-gray-300">Example 2:</p>
                    <pre className="bg-[#161b22] p-4 rounded-md text-sm font-code text-gray-300">{problem.example2}</pre>

                </TabsContent>
            </Tabs>
        </ResizablePanel>
        <ResizableHandle withHandle className="bg-[#30363d]" />
        <ResizablePanel defaultSize={60}>
            <div className="h-full flex flex-col">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                    <div className="flex justify-between items-center p-2 border-b border-[#30363d]">
                        <TabsList className="bg-[#161b22]">
                            <TabsTrigger value="code" className="data-[state=active]:bg-[#21262d] data-[state=active]:text-white">Code</TabsTrigger>
                            <TabsTrigger value="output" className="data-[state=active]:bg-[#21262d] data-[state=active]:text-white">Output</TabsTrigger>
                        </TabsList>
                         <Select value={language} onValueChange={(val) => handleLanguageChange(val as Language)}>
                            <SelectTrigger className="w-[180px] bg-[#0d1117] border-[#30363d] text-white">
                                <SelectValue placeholder="Select language" />
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

                    <TabsContent value="code" className="flex-grow m-0">
                        <Textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Write your code here..."
                            className="h-full w-full font-code bg-[#0d1117] border-0 rounded-none focus-visible:ring-0 text-gray-300"
                        />
                    </TabsContent>

                    <TabsContent value="output" className="flex-grow m-0">
                         <pre className="bg-[#0d1117] text-gray-300 p-4 rounded-md text-sm font-code h-full w-full overflow-auto">{output || "Run code to see output..."}</pre>
                    </TabsContent>

                    <div className="flex justify-end gap-2 p-2 border-t border-[#30363d]">
                        <Button variant="secondary" onClick={handleRunCode} disabled={isRunning} className="bg-[#21262d] hover:bg-[#30363d] text-white">
                            {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Run Code
                        </Button>
                        <Button onClick={handleSubmit} disabled={isRunning} className="bg-primary hover:bg-primary/90 text-primary-foreground">
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
