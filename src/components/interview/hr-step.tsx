"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mic, MicOff } from "lucide-react";
import { simulateHrInterview } from "@/ai/flows/simulate-hr-interview";

interface HRStepProps {
  onNext: (analysis: any) => void;
}

const HRStep: React.FC<HRStepProps> = ({ onNext }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [conversation, setConversation] = useState<{ speaker: 'ai' | 'user'; text: string }[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef<string>("");
  const conversationEndRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            transcriptRef.current += event.results[i][0].transcript + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        const userText = transcriptRef.current.trim();
        if (userText) {
          const newConversation = [...conversation, { speaker: 'user' as const, text: userText }];
          setConversation(newConversation);
          getAiResponse(newConversation);
        }
        transcriptRef.current = "";
      };

      recognitionRef.current = recognition;
    }

    const startInterview = async () => {
        const initialConversation = [{ speaker: 'ai' as const, text: "Hello, I am ready to start." }];
        setConversation(initialConversation);
        getAiResponse(initialConversation);
    }
    startInterview();

    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);


  const getAiResponse = async (currentConversation: typeof conversation) => {
    setIsLoading(true);
    try {
      const response = await simulateHrInterview({
        candidateName: "John Doe",
        jobTitle: "Software Engineer",
        candidateResume: "Experienced in React and Node.js",
        interviewHistory: currentConversation.map(c => ({ speaker: c.speaker, text: c.text })),
      });
      setConversation(prev => [...prev, { speaker: 'ai', text: response.nextQuestion }]);
    } catch (e) {
      console.error(e);
      setConversation(prev => [...prev, { speaker: 'ai', text: "Interesting. Can you tell me about a challenging project you worked on?" }]);
    } finally {
      setIsLoading(false);
    }
  }

  const handleToggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      transcriptRef.current = "";
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  return (
    <Card className="flex flex-col w-full max-h-[85vh] h-full">
      <CardHeader>
        <CardTitle className="font-headline">HR Interview</CardTitle>
        <CardDescription>Speak clearly. The AI will ask follow-up questions based on your answers.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto space-y-4 p-6">
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
        <Button
          size="lg"
          className="rounded-full w-20 h-20"
          onClick={handleToggleListening}
          disabled={!recognitionRef.current || isLoading}
          variant={isListening ? 'destructive' : 'default'}
        >
          {isListening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
        </Button>

        <Button onClick={() => onNext({ conversation })} className="w-full mt-4">End Interview & Get Feedback</Button>
      </CardFooter>
    </Card>
  );
};

export default HRStep;
