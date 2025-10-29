
"use client";

import { useRef, useEffect, useState } from 'react';
import { Card } from '../ui/card';
import { Video } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';

interface ProctoringProps {
    onVisibilityChange: (status: {
        tabSwitches: number;
        visibilityState: 'visible' | 'hidden';
    }) => void;
    onVideoData: (dataUri: string) => void;
}

export const Proctoring: React.FC<ProctoringProps> = ({ onVisibilityChange, onVideoData }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const [tabSwitches, setTabSwitches] = useState(0);
    const [showWarning, setShowWarning] = useState(false);

    // Handle tab/window visibility changes
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setTabSwitches(prev => prev + 1);
                setShowWarning(true);
                onVisibilityChange({ tabSwitches: tabSwitches + 1, visibilityState: 'hidden' });
            } else {
                onVisibilityChange({ tabSwitches: tabSwitches, visibilityState: 'visible' });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [tabSwitches, onVisibilityChange]);
    
    // Set up camera and media recorder
    useEffect(() => {
        let stream: MediaStream | null = null;

        const setupCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }

                mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm' });
                mediaRecorderRef.current.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        recordedChunksRef.current.push(event.data);
                    }
                };

                mediaRecorderRef.current.onstop = () => {
                    const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                    const reader = new FileReader();
                    reader.onload = () => {
                        onVideoData(reader.result as string);
                    };
                    reader.readAsDataURL(blob);
                };

                mediaRecorderRef.current.start();
            } catch (error) {
                console.error("Error setting up camera:", error);
            }
        };

        setupCamera();

        // Cleanup on unmount
        return () => {
            mediaRecorderRef.current?.stop();
            stream?.getTracks().forEach(track => track.stop());
        };
    }, [onVideoData]);

    return (
        <>
            <Card className='fixed bottom-4 right-4 w-48 shadow-lg rounded-lg overflow-hidden z-20'>
                <div className='bg-primary text-primary-foreground p-2 text-xs font-semibold flex items-center gap-2'>
                    <Video className='h-4 w-4' />
                    <span>Proctoring Active</span>
                </div>
                <video ref={videoRef} autoPlay muted className='w-full h-auto' />
            </Card>
            <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className='text-destructive'>Warning: Browser Tab Switched</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have switched away from the interview tab. This action is being recorded and may be flagged as malpractice. Please remain on this tab for the duration of the interview.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setShowWarning(false)}>I Understand</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
