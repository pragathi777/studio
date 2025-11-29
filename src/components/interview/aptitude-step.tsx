
"use client";

import { useState, useEffect, useRef } from "react";
import { generateAptitudeQuestions, GenerateAptitudeQuestionsOutput } from "@/ai/flows/generate-aptitude-questions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Timer } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface AptitudeStepProps {
  onNext: (score: number) => void;
}

type Question = GenerateAptitudeQuestionsOutput["questions"][0];

const shuffleArray = <T,>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
}

const AptitudeStep: React.FC<AptitudeStepProps> = ({ onNext }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(10 * 60); // 10 minutes in seconds
  const [showTimeoutAlert, setShowTimeoutAlert] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const calculateAndSubmit = () => {
    if (timerRef.current) {
        clearInterval(timerRef.current);
    }
    let score = 0;
    const answersToScore = [...userAnswers];
    if (currentQuestionIndex < questions.length && selectedAnswer) {
        answersToScore[currentQuestionIndex] = selectedAnswer;
    }

    questions.forEach((question, index) => {
      if (answersToScore[index] === question.answer) {
        score++;
      }
    });
    
    const percentageScore = (score / questions.length) * 100;
    onNext(percentageScore);
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const result = await generateAptitudeQuestions({ numberOfQuestions: 5 });
        const formattedQuestions = result.questions.map(q => ({
            ...q,
            options: shuffleArray(q.options)
        }));
        setQuestions(formattedQuestions);
        // Initialize userAnswers with empty strings
        setUserAnswers(Array(result.questions.length).fill(""));
      } catch (error) {
        console.error("Failed to generate questions:", error);
        const fallbackQuestions: Question[] = [
            { question: 'What is 2+2?', answer: '4', type: 'mathematical', options: ['3', '4', '5', '6'] },
            { question: 'What is the capital of India?', answer: 'New Delhi', type: 'verbal', options: ['Mumbai', 'Kolkata', 'New Delhi', 'Chennai'] },
        ];
        setQuestions(fallbackQuestions);
        setUserAnswers(Array(fallbackQuestions.length).fill(""));
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (!isLoading && questions.length > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current!);
            setShowTimeoutAlert(true);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isLoading, questions.length]);
  
  const handleNextQuestion = () => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = selectedAnswer;
    setUserAnswers(newAnswers);
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(newAnswers[currentQuestionIndex + 1] || "");
    } else {
      calculateAndSubmit();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = selectedAnswer;
        setUserAnswers(newAnswers);
        
        setCurrentQuestionIndex(currentQuestionIndex - 1);
        setSelectedAnswer(newAnswers[currentQuestionIndex - 1] || "");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Generating Aptitude Questions...</p>
      </div>
    );
  }

  if (questions.length === 0) {
      return <div>Failed to load questions. Please try refreshing.</div>
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <>
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle className="font-headline">Aptitude Round</CardTitle>
                <CardDescription>Question {currentQuestionIndex + 1} of {questions.length} ({currentQuestion.type})</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                <Timer className="h-6 w-6" />
                <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
            </div>
        </div>
        <Progress value={progress} className="mt-2"/>
      </CardHeader>
      <CardContent>
        <p className="font-semibold text-lg mb-6">{currentQuestion.question}</p>
        <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
          {currentQuestion.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted transition-colors">
              <RadioGroupItem value={option} id={`option-${index}`} />
              <Label htmlFor={`option-${index}`} className="text-base flex-1 cursor-pointer">{option}</Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
      <CardFooter className="justify-between">
        <Button 
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
        >
            Previous
        </Button>
        <Button onClick={handleNextQuestion} disabled={!selectedAnswer}>
          {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish"}
        </Button>
      </CardFooter>
    </Card>
    <AlertDialog open={showTimeoutAlert}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Time's Up!</AlertDialogTitle>
            <AlertDialogDescription>
                The timer for the aptitude round has expired. Your test will now be submitted with the answers you have provided.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogAction onClick={calculateAndSubmit}>Continue</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default AptitudeStep;
