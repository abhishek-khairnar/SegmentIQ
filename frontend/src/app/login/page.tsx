"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PieChart, Eye, EyeOff, Lock, Mail, ArrowRight } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/dashboard";
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast.success("Welcome back!");
      router.push(nextUrl);
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-[var(--background)]">
      {/* Brand logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-8 group">
        <div className="h-10 w-10 rounded-xl bg-[#6366F1] flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105">
          <PieChart className="h-5 w-5" />
        </div>
        <span className="font-heading text-2xl font-bold tracking-tight text-[var(--foreground)]">
          Segment<span className="text-[#6366F1]">IQ</span>
        </span>
      </Link>

      <Card className="w-full max-w-md shadow-xl border-[var(--border)] bg-[var(--surface)]">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold">Sign in to SegmentIQ</CardTitle>
          <CardDescription>
            Enter your email and password to access your customer segmentation dashboard.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5 uppercase font-mono">
                Email Address
              </label>
              <div className="relative">
                <Input
                  type="email"
                  {...register("email")}
                  placeholder="name@company.com"
                  error={errors.email?.message}
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5 uppercase font-mono">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="Enter your password"
                  error={errors.password?.message}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[var(--text-muted)] hover:text-[var(--foreground)]"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full gap-2 mt-2" isLoading={isLoading}>
              Sign In
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2 text-center text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border)]">
          <p>
            Don&apos;t have an account yet?{" "}
            <Link href={nextUrl !== "/dashboard" ? `/register?next=${encodeURIComponent(nextUrl)}` : "/register"} className="text-[#6366F1] font-semibold hover:underline">
              Create an account
            </Link>
          </p>
          <Link href="/" className="hover:text-[var(--foreground)] transition-colors">
            ← Return to homepage
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
