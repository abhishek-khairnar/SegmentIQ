"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { useTheme } from "next-themes";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  User,
  Lock,
  Moon,
  Sun,
  Laptop,
  AlertTriangle,
  Loader2,
  CheckCircle,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

const passwordSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Must contain at least one letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  confirm_password: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  // Profile Form
  const [profileSaving, setProfileSaving] = useState(false);
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
    },
  });

  // Password Form
  const [passwordSaving, setPasswordSaving] = useState(false);
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  // Danger Zone states
  const [deleteDataOpen, setDeleteDataOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [typedConfirmation, setTypedConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const onUpdateProfile = async (data: ProfileFormValues) => {
    try {
      setProfileSaving(true);
      await api.patchMe({ name: data.name });
      await refreshUser();
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const onChangePassword = async (data: PasswordFormValues) => {
    try {
      setPasswordSaving(true);
      await api.changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
      });
      toast.success("Password updated successfully");
      resetPassword();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update password");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (typedConfirmation !== "DELETE") {
      toast.error('Please type "DELETE" to confirm');
      return;
    }
    try {
      setIsDeleting(true);
      // Fetch datasets and delete them
      const datasets = await api.listDatasets();
      for (const ds of datasets) {
        await api.deleteDataset(ds.id);
      }
      toast.success("All datasets and associated runs have been deleted");
      setDeleteDataOpen(false);
      setTypedConfirmation("");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to delete datasets");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (typedConfirmation !== "DELETE") {
      toast.error('Please type "DELETE" to confirm');
      return;
    }
    try {
      setIsDeleting(true);
      await api.deleteMe();
      toast.success("Account deleted. We're sorry to see you go.");
      setDeleteAccountOpen(false);
      logout();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal profile, security credentials, theme preferences, and data.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Card */}
        <Card className="border border-border bg-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-500" />
              <CardTitle className="text-lg">Profile Information</CardTitle>
            </div>
            <CardDescription>Update your display name and view your registered email.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="space-y-4 max-w-md">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Email Address
                </label>
                <Input value={user?.email || ""} disabled className="bg-surface/50 text-muted-foreground cursor-not-allowed" />
                <p className="text-xs text-muted-foreground">Email address cannot be changed.</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Display Name
                </label>
                <Input
                  {...registerProfile("name")}
                  placeholder="Your full name"
                />
                {profileErrors.name && (
                  <p className="text-xs text-red-500">{profileErrors.name.message}</p>
                )}
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={profileSaving} className="gap-2">
                  {profileSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card className="border border-border bg-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-indigo-500" />
              <CardTitle className="text-lg">Change Password</CardTitle>
            </div>
            <CardDescription>
              Ensure your account is using a strong password with at least 8 characters, letters, and numbers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-4 max-w-md">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Current Password
                </label>
                <Input
                  type="password"
                  {...registerPassword("current_password")}
                  placeholder="••••••••"
                />
                {passwordErrors.current_password && (
                  <p className="text-xs text-red-500">{passwordErrors.current_password.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  New Password
                </label>
                <Input
                  type="password"
                  {...registerPassword("new_password")}
                  placeholder="••••••••"
                />
                {passwordErrors.new_password && (
                  <p className="text-xs text-red-500">{passwordErrors.new_password.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  {...registerPassword("confirm_password")}
                  placeholder="••••••••"
                />
                {passwordErrors.confirm_password && (
                  <p className="text-xs text-red-500">{passwordErrors.confirm_password.message}</p>
                )}
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={passwordSaving} className="gap-2">
                  {passwordSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Update Password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Theme Preferences */}
        <Card className="border border-border bg-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-indigo-500" />
              <CardTitle className="text-lg">Appearance</CardTitle>
            </div>
            <CardDescription>Choose how SegmentIQ looks to you on this device.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                  theme === "dark"
                    ? "border-indigo-500 bg-indigo-500/10 text-foreground"
                    : "border-border bg-surface hover:bg-surface-raised text-muted-foreground"
                }`}
              >
                <Moon className="h-5 w-5 mb-2 text-indigo-400" />
                <span className="text-sm font-medium">Dark</span>
                <span className="text-[11px] text-muted-foreground">Recommended</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                  theme === "light"
                    ? "border-indigo-500 bg-indigo-500/10 text-foreground"
                    : "border-border bg-surface hover:bg-surface-raised text-muted-foreground"
                }`}
              >
                <Sun className="h-5 w-5 mb-2 text-amber-500" />
                <span className="text-sm font-medium">Light</span>
                <span className="text-[11px] text-muted-foreground">Crisp clean</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                  theme === "system"
                    ? "border-indigo-500 bg-indigo-500/10 text-foreground"
                    : "border-border bg-surface hover:bg-surface-raised text-muted-foreground"
                }`}
              >
                <Laptop className="h-5 w-5 mb-2 text-sky-400" />
                <span className="text-sm font-medium">System</span>
                <span className="text-[11px] text-muted-foreground">Auto sync</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border border-red-500/30 bg-red-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-lg text-red-500">Danger Zone</CardTitle>
            </div>
            <CardDescription>
              Irreversible actions. Deleting your data or account cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg border border-red-500/20 bg-background/50">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Delete all my data</h4>
                <p className="text-xs text-muted-foreground">
                  Permanently wipe all your uploaded datasets, clusters, and run histories while keeping your login.
                </p>
              </div>
              <Button
                variant="outline"
                className="border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-400 shrink-0"
                onClick={() => {
                  setTypedConfirmation("");
                  setDeleteDataOpen(true);
                }}
              >
                Delete All Data
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg border border-red-500/20 bg-background/50">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Delete my account</h4>
                <p className="text-xs text-muted-foreground">
                  Completely delete your account, credentials, and all customer data from SegmentIQ.
                </p>
              </div>
              <Button
                variant="danger"
                className="shrink-0"
                onClick={() => {
                  setTypedConfirmation("");
                  setDeleteAccountOpen(true);
                }}
              >
                Delete My Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete All Data Modal */}
      {deleteDataOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-xl border border-red-500/40 bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-bold">Wipe All Datasets & Runs?</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              This will permanently delete all your uploaded files, column mappings, and segmentation runs.
              This action cannot be undone.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">
                Type <span className="font-mono text-red-500 font-bold">DELETE</span> to confirm:
              </label>
              <Input
                value={typedConfirmation}
                onChange={(e) => setTypedConfirmation(e.target.value)}
                placeholder="DELETE"
                className="font-mono border-red-500/30"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setDeleteDataOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                disabled={typedConfirmation !== "DELETE" || isDeleting}
                onClick={handleDeleteAllData}
                className="gap-2"
              >
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm Wipe
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {deleteAccountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-xl border border-red-500/40 bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <Trash2 className="h-6 w-6" />
              <h3 className="text-lg font-bold">Delete Entire Account?</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              This will immediately delete your account credentials, datasets, runs, and revoke access forever.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">
                Type <span className="font-mono text-red-500 font-bold">DELETE</span> to confirm:
              </label>
              <Input
                value={typedConfirmation}
                onChange={(e) => setTypedConfirmation(e.target.value)}
                placeholder="DELETE"
                className="font-mono border-red-500/30"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setDeleteAccountOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                disabled={typedConfirmation !== "DELETE" || isDeleting}
                onClick={handleDeleteAccount}
                className="gap-2"
              >
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete My Account Permanently
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
