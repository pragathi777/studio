
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
  title: "55. Jump Game",
  difficulty: "Medium",
  description: "You are given an integer array nums. You are initially positioned at the array's first index, and each element in the array represents your maximum jump length at that position.\n\nReturn true if you can reach the last index, or false otherwise.",
  example1: `Input: nums = [2,3,1,1,4]\nOutput: true\nExplanation: Jump 1 step from index 0 to 1, then 3 steps to the last index.`,
  example2: `Input: nums = [3,2,1,0,4]\nOutput: false\nExplanation: You will always arrive at index 3 no matter what. Its maximum jump length is 0, which makes it impossible to reach the last index.`,
};

const languageTemplates = {
    "python": `def canJump(nums):
    goal = len(nums) - 1
    
    for i in range(len(nums) - 1, -1, -1):
        if i + nums[i] >= goal:
            goal = i
            
    return goal == 0

# Test with example
print(canJump([2,3,1,1,4]))`,
    "javascript": `function canJump(nums) {
    let goal = nums.length - 1;

    for (let i = nums.length - 2; i >= 0; i--) {
        if (i + nums[i] >= goal) {
            goal = i;
        }
    }

    return goal === 0;
}

// Test with example
console.log(canJump([2,3,1,1,4]));`,
    "java": `class Solution {
    public boolean canJump(int[] nums) {
        int finalPosition = nums.length - 1;
        
        // Start with the second last index
        for (int idx = nums.length - 2; idx >= 0; idx--) {
            // If you can reach the final position from this index
            // update the final position flag
            if (idx + nums[idx] >= finalPosition) {
                finalPosition = idx;
            }
        }
        
        // If we reach the first index, then we can make the jump possible
        return finalPosition == 0;
    }

    public static void main(String[] args) {
        Solution sol = new Solution();
        System.out.println(sol.canJump(new int[]{2,3,1,1,4}));
    }
}`,
    "c": `#include <stdio.h>
#include <stdbool.h>

bool canJump(int* nums, int numsSize){
    int goal = numsSize - 1;
    for (int i = numsSize - 2; i >= 0; i--) {
        if (i + nums[i] >= goal) {
            goal = i;
        }
    }
    return goal == 0;
}

int main() {
    int nums[] = {2,3,1,1,4};
    printf(canJump(nums, 5) ? "true\\n" : "false\\n");
    return 0;
}`,
    "cpp": `#include <iostream>
#include <vector>

bool canJump(std::vector<int>& nums) {
    int goal = nums.size() - 1;
    for (int i = nums.size() - 2; i >= 0; i--) {
        if (i + nums[i] >= goal) {
            goal = i;
        }
    }
    return goal == 0;
}

int main() {
    std::vector<int> nums = {2,3,1,1,4};
    std::cout << (canJump(nums) ? "true" : "false") << std::endl;
    return 0;
}`
}

type Language = keyof typeof languageTemplates;

const CodingStep: React.FC<CodingStepProps> = ({ onNext }) => {
  const [language, setLanguage] = useState<Language>("java");
  const [code, setCode] = useState(languageTemplates["java"]);
  const [output, setOutput] = useState("You must run your code first");
  const [isRunning, setIsRunning] = useState(false);
  const [activeOutputTab, setActiveOutputTab] = useState("test-result");


  const handleLanguageChange = (lang: Language) => {
      setLanguage(lang);
      setCode(languageTemplates[lang]);
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
        // Simplified check for "true" in output
        const correctAnswer = "true";
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
                    <h2 className="text-xl font-bold font-headline mb-2 text-gray-200">{problem.title}</h2>
                    <span className="inline-block bg-yellow-600/20 text-yellow-400 text-xs font-medium px-2.5 py-1 rounded-full mb-4">{problem.difficulty}</span>
                    <p className="text-gray-400 mb-4">{problem.description}</p>
                    
                    <p className="font-semibold mb-2 text-gray-300">Example 1:</p>
                    <pre className="bg-[#0d1117] p-3 rounded-md text-sm font-code text-gray-300 mb-4">{problem.example1}</pre>

                    <p className="font-semibold mb-2 text-gray-300">Example 2:</p>
                    <pre className="bg-[#0d1117] p-3 rounded-md text-sm font-code text-gray-300">{problem.example2}</pre>
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
                            <Select value={language} onValueChange={(val) => handleLanguageChange(val as Language)}>
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
                            placeholder="Write your code here..."
                            className="h-full w-full font-code bg-[#0d1117] border-0 rounded-none focus-visible:ring-0 text-gray-300 flex-grow"
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
                                More test cases coming soon.
                            </TabsContent>
                            <TabsContent value="test-result" className="flex-grow m-0">
                                <pre className="bg-[#0d1117] text-gray-300 p-4 text-sm font-code h-full w-full overflow-auto">{output}</pre>
                            </TabsContent>
                             <div className="flex justify-end gap-2 p-2 border-t border-[#30363d]">
                                <Button variant="secondary" onClick={handleRunCode} disabled={isRunning} className="bg-[#21262d] hover:bg-[#30363d] text-white">
                                    {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Run Code
                                </Button>
                                <Button onClick={handleSubmit} disabled={isRunning} className="bg-green-600 hover:bg-green-700 text-white">
                                    {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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

    