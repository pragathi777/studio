
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Mic, MicOff, Video } from "lucide-react";
import { simulateHrInterview } from "@/ai/flows/simulate-hr-interview";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


interface HRStepProps {
  onNext: (analysis: { conversation: { speaker: 'ai' | 'user'; text: string }[] }) => void;
}

const HRStep: React.FC<HRStepProps> = ({ onNext }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [conversation, setConversation] = useState<{ speaker: 'ai' | 'user'; text: string }[]>([]);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef<string>("");
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    };

    getCameraPermission();
  }, [toast]);

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
        getAiResponse([]);
    }
    startInterview();

    return () => {
      recognitionRef.current?.stop();
    };
     // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <CardDescription>The AI will ask questions. Click the mic to speak your answer.</CardDescription>
      </CardHeader>
      
      <div className="flex-grow grid md:grid-cols-2 gap-4 overflow-hidden p-6 pt-0">
        <div className="flex flex-col h-full">
            <div className="flex-grow overflow-y-auto space-y-4 pr-4">
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
            {isLoading && conversation.length === 0 && (
            <div className="flex justify-center">
                <div className="p-3 rounded-lg bg-muted flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Preparing the first question...</span>
                </div>
            </div>
            )}
            <div ref={conversationEndRef} />
            </div>
        </div>
        
        <div className="relative h-full bg-muted rounded-md flex items-center justify-center">
            <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted />
            {!hasCameraPermission && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 p-4">
                     <Alert variant="destructive">
                        <AlertTitle>Camera Access Required</AlertTitle>
                        <AlertDescription>
                            Please allow camera access to use this feature. You may need to enable permissions in your browser settings and refresh the page.
                        </AlertDescription>
                    </Alert>
                </div>
            )}
        </div>
      </div>

      <CardFooter className="flex flex-col items-center justify-center gap-4 pt-4 border-t">
        <Button
          size="lg"
          className="rounded-full w-20 h-20"
          onClick={handleToggleListening}
          disabled={!recognitionRef.current || isLoading || !hasCameraPermission}
          variant={isListening ? 'destructive' : 'default'}
        >
          {isListening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
        </Button>

        <Button onClick={() => onNext({ conversation: conversation })} className="w-full mt-4">End Interview & Get Feedback</Button>
      </CardFooter>
    </Card>
  );
};

export default HRStep;
