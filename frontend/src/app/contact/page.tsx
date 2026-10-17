"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Mail, Send, CheckCircle2, MessageSquare } from "lucide-react";
import { api, ApiError } from "@/lib/api";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(3, "Subject must be at least 3 characters").max(150),
  message: z.string().min(10, "Message must be at least 10 characters").max(3000),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsLoading(true);
    try {
      await api.submitContact(data);
      toast.success("Thank you! Your message has been sent successfully.");
      setSubmitted(true);
      reset();
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 429) {
        toast.error("Too many messages submitted. Please wait a minute and try again.");
      } else {
        toast.error(err.message || "Failed to submit message. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Navbar />

      <section className="py-16 md:py-20 border-b border-[var(--border)] text-center bg-[var(--surface-raised)]/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <Badge variant="default" className="text-xs">Support & Inquiries</Badge>
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-[var(--foreground)] tracking-tight">
            Get in Touch
          </h1>
          <p className="text-base text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed">
            Have questions about clustering algorithms, custom format ingestion, or feedback? Send us a note below.
          </p>
        </div>
      </section>

      <section className="py-16 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        {submitted ? (
          <Card className="p-8 text-center space-y-4 animate-fade-in border-green-500/30 bg-green-500/5">
            <div className="h-12 w-12 rounded-full bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">Message Received</h2>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-md mx-auto">
              Our engineering team has received your message and will review it promptly. An administrator will reply to your provided email address.
            </p>
            <Button variant="outline" onClick={() => setSubmitted(false)}>
              Send another message
            </Button>
          </Card>
        ) : (
          <Card className="p-6 sm:p-8 shadow-sm">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5 uppercase font-mono">
                  Your Full Name
                </label>
                <Input
                  {...register("name")}
                  placeholder="e.g. Sarah Jenkins"
                  error={errors.name?.message}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5 uppercase font-mono">
                  Email Address
                </label>
                <Input
                  type="email"
                  {...register("email")}
                  placeholder="sarah@company.com"
                  error={errors.email?.message}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5 uppercase font-mono">
                  Subject
                </label>
                <Input
                  {...register("subject")}
                  placeholder="e.g. Question regarding DBSCAN eps parameter"
                  error={errors.subject?.message}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5 uppercase font-mono">
                  Message
                </label>
                <textarea
                  {...register("message")}
                  rows={5}
                  placeholder="Tell us what you are working on or how we can assist..."
                  className="flex w-full rounded-[var(--control-radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent transition-colors"
                />
                {errors.message && (
                  <p className="mt-1 text-xs text-[#EF4444] font-medium">{errors.message.message}</p>
                )}
              </div>

              <Button type="submit" variant="primary" className="w-full gap-2" isLoading={isLoading}>
                <Send className="h-4 w-4" />
                Submit Message
              </Button>
            </form>
          </Card>
        )}
      </section>

      <Footer />
    </div>
  );
}
