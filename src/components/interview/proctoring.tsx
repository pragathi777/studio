
"use client";

import { useRef, useEffect, useState } from 'react';
import { Card } from '../ui/card';
import { Video } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Button } from '../ui/button';

interface ProctoringProps {
    onVisibilityChange: (status: {
        tabSwitches: number;
        visibilityState: 'visible' | 'hidden';
    }) => void;
    onVideoData: (dataUri: string) => void;
    onEndInterview: () => void;
    videoStream: MediaStream;
}

export const Proctoring: React.FC<ProctoringProps> = ({ onVisibilityChange, onVideoData, onEndInterview, videoStream }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const [tabSwitches, setTabSwitches] = useState(0);
    const [showWarning, setShowWarning] = useState(false);
    const [showPreview, setShowPreview] = useState(true);
    const [showConfirmation, setShowConfirmation] = useState(false);

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
        if (!videoStream) return;

        const setupRecorder = async () => {
            try {
                if (videoRef.current) {
                    videoRef.current.srcObject = videoStream;
                }

                mediaRecorderRef.current = new MediaRecorder(videoStream, { mimeType: 'video/webm' });
                mediaRecorderRef.current.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        recordedChunksRef.current.push(event.data);
                    }
                };

                mediaRecorderRef.current.onstop = () => {
                    if (recordedChunksRef.current.length === 0) return;
                    const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                    const reader = new FileReader();
                    reader.onload = () => {
                        onVideoData(reader.result as string);
                    };
                    reader.readAsDataURL(blob);
                };

                mediaRecorderRef.current.start();

                // Show preview for 5 seconds, then show confirmation
                setTimeout(() => {
                    setShowConfirmation(true);
                }, 5000);

            } catch (error) {
                console.error("Error setting up recorder:", error);
            }
        };

        setupRecorder();

        // Cleanup on unmount
        return () => {
            if (mediaRecorderRef.current?.state === 'recording') {
                mediaRecorderRef.current?.stop();
            }
        };
    }, [onVideoData, onEndInterview, videoStream]);

    const handleConfirm = () => {
        setShowPreview(false);
        setShowConfirmation(false);
    };

    const handleDeny = () => {
        setShowConfirmation(false);
        onEndInterview();
    };

    return (
        <>
            {showPreview && (
                 <Card className='fixed bottom-4 right-4 w-48 shadow-lg rounded-lg overflow-hidden z-20'>
                    <div className='bg-primary text-primary-foreground p-1 text-xs font-semibold flex items-center justify-center gap-2'>
                        <Video className='h-3 w-3' />
                        <span>Proctoring Enabled</span>
                    </div>
                    <video ref={videoRef} autoPlay muted className='w-full h-auto' />
                </Card>
            )}

            <AlertDialog open={showConfirmation}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Continue with Proctoring?</AlertDialogTitle>
                        <AlertDialogDescription>
                           The video feed will now be hidden but will continue to record in the background for proctoring purposes. Do you agree to continue?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <Button variant="destructive" onClick={handleDeny}>No, End Interview</Button>
                        <AlertDialogAction onClick={handleConfirm}>Yes, Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
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
