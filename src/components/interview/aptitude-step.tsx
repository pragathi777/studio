"use client";

import { useState, useEffect } from "react";
import { generateAptitudeQuestions, GenerateAptitudeQuestionsOutput } from "@/ai/flows/generate-aptitude-questions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AptitudeStepProps {
  onNext: (score: number) => void;
}

type Question = GenerateAptitudeQuestionsOutput["questions"][0] & { options: string[] };

const shuffleArray = <T,>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
}

const AptitudeStep: React.FC<AptitudeStepProps> = ({ onNext }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const result = await generateAptitudeQuestions({ numberOfQuestions: 20 });
        const formattedQuestions = result.questions.map(q => ({
            ...q,
            // Creating dummy options for MCQ format
            options: shuffleArray([q.answer, "Dummy Option 1", "Dummy Option 2", "Dummy Option 3"])
        }));
        setQuestions(formattedQuestions);
      } catch (error) {
        console.error("Failed to generate questions:", error);
        // Fallback questions
        const fallbackQuestions: Question[] = [
            { question: 'What is 2+2?', answer: '4', type: 'mathematical', options: ['3', '4', '5', '6'] },
            { question: 'What is the capital of India?', answer: 'New Delhi', type: 'verbal', options: ['Mumbai', 'Kolkata', 'New Delhi', 'Chennai'] },
        ];
        setQuestions(fallbackQuestions);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const handleNextQuestion = () => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = selectedAnswer;
    setUserAnswers(newAnswers);
    setSelectedAnswer("");

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // End of quiz, calculate score
      let score = 0;
      newAnswers.forEach((answer, index) => {
        if (answer === questions[index].answer) {
          score++;
        }
      });
      const percentageScore = (score / questions.length) * 100;
      onNext(percentageScore);
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="font-headline">Aptitude Round</CardTitle>
        <CardDescription>Question {currentQuestionIndex + 1} of {questions.length} ({currentQuestion.type})</CardDescription>
        <Progress value={progress} className="mt-2"/>
      </CardHeader>
      <CardContent>
        <p className="font-semibold text-lg mb-6">{currentQuestion.question}</p>
        <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
          {currentQuestion.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <RadioGroupItem value={option} id={`option-${index}`} />
              <Label htmlFor={`option-${index}`} className="text-base">{option}</Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
      <CardFooter>
        <Button onClick={handleNextQuestion} disabled={!selectedAnswer} className="ml-auto">
          {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AptitudeStep;
