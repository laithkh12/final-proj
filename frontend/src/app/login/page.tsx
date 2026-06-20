"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/authStore";
import { getErrorMessage } from "@/services/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSignup = searchParams.get("mode") === "signup";
  const setAuth = useAuthStore((s) => s.setAuth);
  const isReady = useAuthStore((s) => s.isReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isReady, isAuthenticated, router]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Clear errors when switching between sign in and sign up
  useEffect(() => {
    setError("");
    setLoading(false);
  }, [isSignup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = isSignup
        ? await authService.signup({ name, email, password })
        : await authService.login({ email, password });
      const { user } = res.data.data!;
      setAuth(user);
      toast.success(isSignup ? "Account created!" : "Welcome back!");
      router.push("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <Link href="/" className="text-xl font-bold text-indigo-600">
          TeamFlow
        </Link>
        <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">
          {isSignup ? "Create account" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isSignup
            ? "Start managing your team projects"
            : "Sign in to your workspace"}
        </p>

        {error && <Alert type="error" message={error} className="mt-4" />}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isSignup && (
            <Input
              label="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <Button type="submit" className="w-full" loading={loading}>
            {isSignup ? "Sign up" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <Link
            href={isSignup ? "/login" : "/login?mode=signup"}
            className="font-medium text-indigo-600 hover:underline"
          >
            {isSignup ? "Sign in" : "Sign up"}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
