"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldAlert,
  Mail,
  CheckCircle2,
  Trash2,
  Eye,
  RefreshCw,
  Clock,
  User,
  Inbox,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Skeletons } from "@/components/common/Skeletons";
import { toast } from "sonner";

interface ContactMessage {
  id: string | number;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function AdminMessagesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContactMessage | null>(null);

  const { data: messages = [], isLoading, error, refetch } = useQuery<ContactMessage[]>({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      return await api.getAdminMessages();
    },
    enabled: user?.role === "admin",
  });

  const markReadMutation = useMutation({
    mutationFn: async ({ id, is_read }: { id: string | number; is_read: boolean }) => {
      await api.patchAdminMessage(id, { is_read });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-messages"] });
      toast.success("Message status updated");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to update status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      await api.deleteAdminMessage(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-messages"] });
      toast.success("Message deleted");
      if (selectedMessage?.id === deleteTarget?.id) {
        setSelectedMessage(null);
      }
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to delete message");
    },
  });

  // Guard: Not an admin
  if (user && user.role !== "admin") {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">403 Forbidden</h2>
        <p className="text-sm text-muted-foreground">
          You do not have administrative privileges to access contact inquiries.
          This panel is restricted to the platform administrator.
        </p>
      </div>
    );
  }

  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Contact Messages</h1>
            <Badge variant="outline" className="text-indigo-400 border-indigo-500/30">
              Admin Only
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Inbound inquiries and user feedback submitted through the public contact form.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
              {unreadCount} Unread
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table / List */}
        <div className="lg:col-span-2">
          <Card className="border border-border bg-card">
            <CardHeader className="py-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Inbox className="h-4 w-4 text-indigo-400" />
                Inbox ({messages.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6">
                  <Skeletons count={5} height="h-12" />
                </div>
              ) : messages.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground text-sm space-y-2">
                  <Mail className="h-8 w-8 mx-auto text-muted-foreground/50" />
                  <p>No messages received yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Sender</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {messages.map((msg) => {
                        const isSelected = selectedMessage?.id === msg.id;
                        return (
                          <TableRow
                            key={msg.id}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-indigo-500/10"
                                : !msg.is_read
                                ? "font-semibold bg-surface/40"
                                : "text-muted-foreground"
                            }`}
                            onClick={() => {
                              setSelectedMessage(msg);
                              if (!msg.is_read) {
                                markReadMutation.mutate({ id: msg.id, is_read: true });
                              }
                            }}
                          >
                            <TableCell className="w-8">
                              {!msg.is_read ? (
                                <span className="h-2 w-2 rounded-full bg-indigo-500 inline-block" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground/40" />
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-foreground text-sm">{msg.name}</div>
                              <div className="text-xs text-muted-foreground">{msg.email}</div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm line-clamp-1">{msg.subject}</span>
                            </TableCell>
                            <TableCell className="text-xs whitespace-nowrap">
                              {new Date(msg.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400"
                                  onClick={() => setDeleteTarget(msg)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Message Viewer */}
        <div className="lg:col-span-1">
          {selectedMessage ? (
            <Card className="border border-border bg-card sticky top-20">
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold">{selectedMessage.subject}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      From: <span className="text-foreground font-medium">{selectedMessage.name}</span> ({selectedMessage.email})
                    </p>
                  </div>
                  <Badge variant={selectedMessage.is_read ? "secondary" : "default"}>
                    {selectedMessage.is_read ? "Read" : "New"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(selectedMessage.created_at).toLocaleString()}
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="p-3 rounded-lg bg-surface text-sm text-foreground whitespace-pre-wrap leading-relaxed border border-border/50 min-h-[160px]">
                  {selectedMessage.message}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      markReadMutation.mutate({
                        id: selectedMessage.id,
                        is_read: !selectedMessage.is_read,
                      });
                    }}
                  >
                    {selectedMessage.is_read ? "Mark Unread" : "Mark as Read"}
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    className="text-xs gap-1"
                    onClick={() => setDeleteTarget(selectedMessage)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-border bg-card border-dashed p-8 text-center text-muted-foreground">
              <Mail className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium">Select a message to view details</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click on any message in the table on the left to read the full body.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Contact Message?"
        description={`Are you sure you want to delete the message "${deleteTarget?.subject}" from ${deleteTarget?.name}?`}
        confirmText="Delete Message"
        isDestructive
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
          }
        }}
      />
    </div>
  );
}
