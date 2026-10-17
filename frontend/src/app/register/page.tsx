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
import { PieChart, Eye, EyeOff, User, Mail, Lock, ArrowRight } from "lucide-react";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/dashboard";
  const { register: signup } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await signup(data.email, data.name, data.password);
      toast.success("Account created successfully! Welcome to SegmentIQ.");
      router.push(nextUrl);
    } catch (err: any) {
      toast.error(err.message || "Failed to create account. Please try another email.");
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
          <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
          <CardDescription>
            Join SegmentIQ to upload your customer CSVs and unlock automated behavioral clustering.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5 uppercase font-mono">
                Full Name
              </label>
              <Input
                {...register("name")}
                placeholder="e.g. Jordan Lee"
                error={errors.name?.message}
                autoComplete="name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5 uppercase font-mono">
                Email Address
              </label>
              <Input
                type="email"
                {...register("email")}
                placeholder="name@company.com"
                error={errors.email?.message}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5 uppercase font-mono">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="Min 8 chars, 1 letter & 1 number"
                  error={errors.password?.message}
                  autoComplete="new-password"
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
              Create Free Account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2 text-center text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border)]">
          <p>
            Already have an account?{" "}
            <Link href={nextUrl !== "/dashboard" ? `/login?next=${encodeURIComponent(nextUrl)}` : "/login"} className="text-[#6366F1] font-semibold hover:underline">
              Sign in
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

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
