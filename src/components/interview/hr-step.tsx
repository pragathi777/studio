
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { simulateHrInterview } from "@/ai/flows/simulate-hr-interview";
import { Textarea } from "@/components/ui/textarea";

type ConversationTurn = { speaker: 'ai' | 'user'; text: string };

interface HRStepProps {
  onNext: (conversation: ConversationTurn[]) => void;
}

const HRStep: React.FC<HRStepProps> = ({ onNext }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [currentUserInput, setCurrentUserInput] = useState("");
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const getAiResponse = async (currentConversation: ConversationTurn[]) => {
    setIsLoading(true);
    try {
      const response = await simulateHrInterview({
        candidateName: "Candidate",
        jobTitle: "Software Engineer",
        interviewHistory: currentConversation,
      });

      setConversation(prev => [...prev, { speaker: 'ai', text: response.nextQuestion }]);

    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not get AI response.' });
      setConversation(prev => [...prev, { speaker: 'ai', text: "Apologies, I encountered an issue. Let's try another question: Can you tell me about a challenging project you worked on?" }]);
    } finally {
      setIsLoading(false);
    }
  }

  // Get first question on component mount
  useEffect(() => {
    getAiResponse([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const handleSubmitAnswer = () => {
    if (!currentUserInput.trim()) {
      return;
    }
    
    const newConversation: ConversationTurn[] = [...conversation, { speaker: 'user', text: currentUserInput }];
    setConversation(newConversation);
    setCurrentUserInput(""); // Clear the input field
    getAiResponse(newConversation);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmitAnswer();
    }
  }

  return (
    <Card className="flex flex-col w-full max-h-[85vh] h-full">
      <CardHeader>
        <CardTitle className="font-headline">HR Interview</CardTitle>
        <CardDescription>The AI will ask questions. Type your answer in the box below and click submit.</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-grow flex flex-col overflow-y-auto space-y-4 pr-4">
        {conversation.map((entry, index) => (
        <div key={index} className={`flex ${entry.speaker === 'ai' ? 'justify-start' : 'justify-end'}`}>
            <div className={`p-3 rounded-lg max-w-[80%] ${entry.speaker === 'ai' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
            <p>{entry.text}</p>
            </div>
        </div>
        ))}
        {isLoading && conversation.length > 0 && (
            <div className="flex justify-start">
                <div className="p-3 rounded-lg bg-muted flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Thinking...</span>
                </div>
            </div>
        )}
        <div ref={conversationEndRef} />
      </CardContent>

      <CardFooter className="flex flex-col items-center justify-center gap-4 pt-4 border-t">
        <div className="w-full flex items-center gap-2">
             <Textarea
                placeholder="Type your answer here..."
                value={currentUserInput}
                onChange={(e) => setCurrentUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-24 bg-muted/50"
                disabled={isLoading}
            />
            <Button onClick={handleSubmitAnswer} disabled={isLoading || !currentUserInput.trim()}>
                <Send className="h-4 w-4" />
                <span className="sr-only">Submit Answer</span>
            </Button>
        </div>
        <Button onClick={() => onNext(conversation)} className="w-full mt-4" disabled={isLoading}>End Interview & Get Feedback</Button>
      </CardFooter>
    </Card>
  );
};

export default HRStep;
