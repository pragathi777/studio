
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Mic, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { simulateHrInterview } from "@/ai/flows/simulate-hr-interview";
import { Textarea } from "@/components/ui/textarea";

type ConversationTurn = { speaker: 'ai' | 'user'; text: string };

interface HRStepProps {
  onNext: (conversation: ConversationTurn[]) => void;
}

const HRStep: React.FC<HRStepProps> = ({ onNext }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [hasPermission, setHasPermission] = useState(true);
  const [transcript, setTranscript] = useState("");

  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  // 1. Setup Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        variant: 'destructive',
        title: 'Browser Not Supported',
        description: 'Your browser does not support speech recognition. Please try Chrome or Edge.',
      });
      setHasPermission(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(prev => prev + finalTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      toast({ variant: 'destructive', title: 'Speech Error', description: `An error occurred: ${event.error}` });
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    speechRecognitionRef.current = recognition;

  }, [toast]);
  

  useEffect(() => {
    const getCameraAndMicPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera/mic:', error);
        setHasPermission(false);
        toast({
          variant: 'destructive',
          title: 'Device Access Denied',
          description: 'Please enable camera and microphone permissions to use this feature.',
        });
      }
    };

    getCameraAndMicPermission();
  }, [toast]);

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


  const handleStartRecording = () => {
    if (speechRecognitionRef.current && hasPermission) {
      setTranscript(""); // Clear previous transcript
      speechRecognitionRef.current.start();
      setIsRecording(true);
    } else {
        toast({ variant: 'destructive', title: 'Cannot start recording', description: 'Speech recognition is not available or permissions were denied.' });
    }
  };

  const handleStopRecording = () => {
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      setIsRecording(false);
      
      // Send final transcript to get next question
      if(transcript.trim()) {
        const newConversation: ConversationTurn[] = [...conversation, { speaker: 'user', text: transcript }];
        setConversation(newConversation);
        getAiResponse(newConversation);
        setTranscript(""); // Clear the text area
      }
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
            <div ref={conversationEndRef} />
            </div>
            <Textarea
              placeholder={isRecording ? "Listening..." : "Your transcribed answer will appear here."}
              value={transcript}
              readOnly
              className="mt-4 h-24 bg-muted/50"
            />
        </div>
        
        <div className="relative h-full bg-muted rounded-md flex items-center justify-center">
            <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
            {!hasPermission && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 p-4">
                     <Alert variant="destructive">
                        <AlertTitle>Camera & Mic Access Required</AlertTitle>
                        <AlertDescription>
                            Please allow camera and microphone access to use this feature. You may need to enable permissions in your browser settings and refresh the page.
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
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          disabled={isLoading || !hasPermission}
          variant={isRecording ? 'destructive' : 'default'}
        >
          {isRecording ? <Square className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
        </Button>

        <Button onClick={() => onNext(conversation)} className="w-full mt-4" disabled={isRecording || isLoading}>End Interview & Get Feedback</Button>
      </CardFooter>
    </Card>
  );
};

export default HRStep;
