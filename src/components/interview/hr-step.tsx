
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { processHrAnswer } from "@/ai/flows/process-hr-answer";

type ConversationTurn = { speaker: 'ai' | 'user'; text: string };

interface HRStepProps {
  onNext: (conversation: ConversationTurn[]) => void;
}

const HRStep: React.FC<HRStepProps> = ({ onNext }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCameraAndMicPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera/mic:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Device Access Denied',
          description: 'Please enable camera and microphone permissions to use this feature.',
        });
      }
    };

    getCameraAndMicPermission();
  }, [toast]);

  const getAiResponse = async (currentConversation: ConversationTurn[], audioDataUri?: string) => {
    setIsLoading(true);
    try {
      const response = await processHrAnswer({
        candidateName: "Candidate",
        jobTitle: "Software Engineer",
        interviewHistory: currentConversation,
        audioDataUri: audioDataUri
      });

      const newConversation: ConversationTurn[] = [...currentConversation];
      if (response.userTranscript) {
        newConversation.push({ speaker: 'user', text: response.userTranscript });
      }
      newConversation.push({ speaker: 'ai', text: response.nextQuestion });

      setConversation(newConversation);

    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not get AI response.' });
      setConversation(prev => [...prev, { speaker: 'ai', text: "Apologies, I encountered an issue. Let's try another question: Can you tell me about a challenging project you worked on?" }]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // Start the interview with the first question
    getAiResponse([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const startRecording = async () => {
    if (!hasCameraPermission) {
        toast({ variant: 'destructive', title: 'Microphone Required', description: 'Please enable microphone permissions first.' });
        return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);

    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        // The conversation state passed here does not yet include the user's latest turn
        getAiResponse(conversation, base64Audio);
      };
      audioChunksRef.current = [];
      stream.getTracks().forEach(track => track.stop()); // Stop the mic stream
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <Card className="flex flex-col w-full max-h-[85vh] h-full">
      <CardHeader>
        <CardTitle className="font-headline">HR Interview</CardTitle>
        <CardDescription>The AI will ask questions. Click the mic to record your answer.</CardDescription>
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
            {isLoading && (
            <div className="flex justify-start">
                <div className="p-3 rounded-lg bg-muted flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
                </div>
            </div>
            )}
            <div ref={conversationEndRef} />
            </div>
        </div>
        
        <div className="relative h-full bg-muted rounded-md flex items-center justify-center">
            <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
            {!hasCameraPermission && (
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
          onClick={handleToggleRecording}
          disabled={isLoading || !hasCameraPermission}
          variant={isRecording ? 'destructive' : 'default'}
        >
          {isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
        </Button>

        <Button onClick={() => onNext(conversation)} className="w-full mt-4" disabled={isRecording}>End Interview & Get Feedback</Button>
      </CardFooter>
    </Card>
  );
};

export default HRStep;

