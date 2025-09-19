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
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef<string>("");

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
    
    // Speech Recognition setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          transcriptRef.current = finalTranscript;
        }
      };
      
      recognition.onend = () => {
          setIsListening(false);
          if (transcriptRef.current) {
            handleUserResponse(transcriptRef.current);
            transcriptRef.current = "";
          }
      };

      recognitionRef.current = recognition;
    }

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
    
    setIsLoading(true);
    setConversation(prev => [...prev, { speaker: 'user', text: userText }]);

    try {
      const response = await simulateHrInterview({
        candidateName: "John Doe",
        jobTitle: "Software Engineer",
        candidateResume: "Experienced in React and Node.js",
        candidatePreviousAnswers: conversation.filter(c => c.speaker === 'user').map(c => c.text),
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
    </div>
  );
};

export default HRStep;
