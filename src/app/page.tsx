"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth, useUser } from "@/firebase";
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";


export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);


  const handleAnonymousLogin = () => {
    setIsLoading(true);
    initiateAnonymousSignIn(auth);
  };
  
  if (isUserLoading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <Logo className="justify-center" />
            <h1 className="text-3xl font-bold font-headline mt-4">Welcome</h1>
            <p className="text-balance text-muted-foreground">
              Sign in to start your mock interview.
            </p>
          </div>
          <div className="grid gap-4">
              <Button onClick={handleAnonymousLogin} className="w-full" disabled={isLoading}>
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Sign In Anonymously
              </Button>
            </div>
          <div className="mt-4 text-center text-sm">
            You can create a full account later.
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        <Image
          src="https://picsum.photos/seed/login-hero/1200/900"
          alt="A modern office setting with people collaborating."
          data-ai-hint="modern office"
          width="1200"
          height="900"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
