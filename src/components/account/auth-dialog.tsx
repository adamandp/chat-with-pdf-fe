"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LockKeyhole, UserRound } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { ChatPdfLogo } from "@/components/brand/chat-pdf-logo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function AuthDialog({
  open,
  onOpenChange,
  initialView = "login",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialView?: "login" | "register";
}) {
  const { login, register } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<"login" | "register">(initialView);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const isDemo = process.env.NEXT_PUBLIC_API_MOCKING !== "disabled";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      if (view === "login") await login({ username, password });
      else await register({ username, password, ...(name.trim() ? { name: name.trim() } : {}) });
      toast.success(view === "login" ? "Welcome back!" : "Account created");
      onOpenChange(false);
      if (view === "login") router.replace("/");
    } catch (cause) {
      const error = cause as { response?: { data?: { message?: string } }; message?: string };
      toast.error(error.response?.data?.message || error.message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="neo-card w-[min(430px,calc(100vw-24px))] max-w-none border-2 border-black bg-white p-6 shadow-[6px_6px_0_#111]"
        >
          <DialogHeader className="items-center gap-3 text-center">
            <ChatPdfLogo size={58} />
            <DialogTitle className="text-2xl font-black">
              {view === "login" ? "Welcome back" : "Create account"}
            </DialogTitle>
            <DialogDescription>
              {view === "login" ? "Sign in to your PDF workspace" : "Start exploring your PDFs"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="grid gap-4">
            {view === "register" && (
              <label className="grid gap-1.5 text-sm font-bold">
                Name (optional)
                <span className="flex items-center gap-2 rounded-lg border-2 border-black px-3">
                  <UserRound size={18} />
                  <input
                    className="min-w-0 flex-1 py-3 outline-none"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={255}
                  />
                </span>
              </label>
            )}
            <label className="grid gap-1.5 text-sm font-bold">
              Username
              <span className="flex items-center gap-2 rounded-lg border-2 border-black px-3">
                <UserRound size={18} />
                <input
                  className="min-w-0 flex-1 py-3 outline-none"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  minLength={3}
                  maxLength={50}
                  pattern="[a-zA-Z0-9_.-]+"
                  autoComplete="username"
                  required
                />
              </span>
            </label>
            <label className="grid gap-1.5 text-sm font-bold">
              Password
              <span className="flex items-center gap-2 rounded-lg border-2 border-black px-3">
                <LockKeyhole size={18} />
                <input
                  type="password"
                  className="min-w-0 flex-1 py-3 outline-none"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  maxLength={100}
                  autoComplete={view === "login" ? "current-password" : "new-password"}
                  required
                />
              </span>
            </label>
            <button
              type="submit"
              disabled={busy}
              className="neo-button pink py-3 font-black disabled:opacity-50"
            >
              {busy ? "Please wait…" : view === "login" ? "Login" : "Register"}
            </button>
          </form>
          <p className="text-center text-sm text-muted">
            {view === "login" ? "No account yet?" : "Already have an account?"}{" "}
            <button
              className="font-bold text-foreground underline"
              onClick={() => setView(view === "login" ? "register" : "login")}
            >
              {view === "login" ? "Register" : "Login"}
            </button>
          </p>
          {isDemo && (
            <p className="rounded-lg bg-[#fff4c5] p-3 text-center text-xs">
              Demo login: <strong>demo</strong> / <strong>demo12345</strong>. Your workspace changes
              are saved in this browser.
            </p>
          )}
        </DialogContent>
      </Dialog>
  );
}
