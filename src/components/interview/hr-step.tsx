"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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

  useEffect(() => {
    // Speech Recognition setup
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
          if (transcriptRef.current.trim()) {
            handleUserResponse(transcriptRef.current.trim());
          }
          transcriptRef.current = "";
      };

      recognitionRef.current = recognition;
    }

    // Initial question from AI
    const startInterview = async () => {
        setIsLoading(true);
        try {
            const response = await simulateHrInterview({
                candidateName: "John Doe",
                jobTitle: "Software Engineer",
                candidateResume: "Experienced in React and Node.js",
                candidateNewAnswer: "Hi, I am ready to start.",
            });
            setConversation([{ speaker: 'ai', text: response.nextQuestion }]);
        } catch (e) {
            console.error(e);
            setConversation([{ speaker: 'ai', text: "Hello, I'm your HR interviewer today. Let's start with a brief introduction. Tell me about yourself." }]);
        } finally {
            setIsLoading(false);
        }
    }
    startInterview();

    // Cleanup
    return () => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
    }
  }, []);

  const handleToggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      transcriptRef.current = "";
      recognitionRef.current?.start();
      setIsListening(true);
    }
  }

  const handleUserResponse = async (userText: string) => {
    if(!userText || userText.trim() === "") return;
    
    setConversation(prev => [...prev, { speaker: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const response = await simulateHrInterview({
        candidateName: "John Doe",
        jobTitle: "Software Engineer",
        candidateResume: "Experienced in React and Node.js",
        candidatePreviousAnswers: conversation.map(c => `${c.speaker}: ${c.text}`),
        candidateNewAnswer: userText,
      });
      setConversation(prev => [...prev, { speaker: 'ai', text: response.nextQuestion }]);
    } catch(e) {
      console.error(e);
      setConversation(prev => [...prev, { speaker: 'ai', text: "Interesting. Can you tell me about a challenging project you worked on?" }]);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Card className="flex flex-col h-[70vh] w-full">
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
                  <Loader2 className="h-4 w-4 animate-spin"/>
                  <span>Thinking...</span>
              </div>
          </div>
        )}
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
         
          <Button onClick={() => onNext({})} className="w-full mt-4">End Interview & Get Feedback</Button>
      </CardFooter>
    </Card>
  );
};

export default HRStep;
