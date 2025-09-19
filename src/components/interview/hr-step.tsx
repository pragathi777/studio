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
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Start webcam
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        // Set up proctoring (tab switching, etc.) here
      })
      .catch(err => {
        console.error("Error accessing media devices.", err);
      });
    
    // Initial question from AI
    const startInterview = async () => {
        setConversation([{ speaker: 'ai', text: "Hello, I'm your HR interviewer today. Let's start with a brief introduction. Tell me about yourself." }]);
        setIsLoading(false);
    }
    startInterview();

    // Cleanup
    return () => {
        if(videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        }
    }
  }, []);

  const handleUserResponse = async () => {
    setIsListening(false);
    setIsLoading(true);
    const lastUserResponse = "This is a simulated response. In a real scenario, this would be from speech-to-text.";
    setConversation(prev => [...prev, { speaker: 'user', text: lastUserResponse }]);

    try {
      const response = await simulateHrInterview({
        candidateName: "John Doe",
        jobTitle: "Software Engineer",
        candidateResume: "Experienced in React and Node.js",
        candidatePreviousAnswers: conversation.filter(c => c.speaker === 'user').map(c => c.text),
        candidateNewAnswer: lastUserResponse,
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[70vh]">
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline">HR Interview</CardTitle>
          <CardDescription>Your camera feed is active. Speak clearly.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow bg-muted rounded-b-md flex items-center justify-center">
            <video ref={videoRef} autoPlay muted className="w-full h-full object-cover rounded-md" />
        </CardContent>
      </Card>
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline">Conversation</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto space-y-4">
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
        <CardFooter className="flex flex-col items-center justify-center gap-4 pt-4">
            <div className="flex gap-4">
                <Button size="lg" className="rounded-full w-20 h-20" onClick={() => setIsListening(p => !p)}>
                    {isListening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                </Button>
                {/* This button simulates speech-to-text for now */}
                <Button onClick={handleUserResponse} disabled={isLoading}>Simulate Response</Button>
            </div>
           
            <Button onClick={() => onNext({})} className="w-full mt-4">End Interview & Get Feedback</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default HRStep;
