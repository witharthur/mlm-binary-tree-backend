"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { useUIStore } from "@/store/ui-store";
import type { PlacementSide } from "@/types/api";

interface AuthCardProps {
  mode: "login" | "register";
  sponsorId?: string;
  side?: PlacementSide;
}

export function AuthCard({ mode, sponsorId, side }: AuthCardProps) {
  const router = useRouter();
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);
  const addToast = useUIStore((state) => state.addToast);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: ""
  });

  const isLogin = mode === "login";
  const referralMode = Boolean(sponsorId && side);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const tokenResponse = await authApi.login({
          username: form.username,
          password: form.password
        });
        setToken(tokenResponse.access_token);
        addToast({
          title: "Welcome back",
          description: "Your dashboard is ready.",
          variant: "success"
        });
        router.push("/dashboard");
      } else {
        const payload = {
          username: form.username,
          email: form.email,
          password: form.password
        };
        const user =
          referralMode && sponsorId && side
            ? await authApi.registerReferral(sponsorId, side, payload)
            : await authApi.register(payload);
        setUser(user);
        addToast({
          title: "Registration completed",
          description: referralMode
            ? `Placed on the ${side === "L" ? "left" : "right"} branch.`
            : "You can sign in with your credentials.",
          variant: "success"
        });
        router.push("/login");
      }
    } catch (error) {
      addToast({
        title: isLogin ? "Login failed" : "Registration failed",
        description:
          error instanceof Error ? error.message : "Check the form and try again.",
        variant: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md p-6">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-acid-500 text-ink-950 shadow-glow">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">
              {isLogin ? "Sign in" : "Create account"}
            </h1>
            <p className="text-sm text-zinc-400">
              {referralMode
                ? `Referral branch ${side}`
                : "Premium wellness commerce network"}
            </p>
          </div>
        </div>

        {referralMode ? (
          <div className="mb-5 rounded-lg border border-acid-400/20 bg-acid-500/10 p-3 text-sm text-acid-100">
            Sponsor ID: <span className="font-semibold">{sponsorId}</span>
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={submit}>
          <Field label="Username">
            <Input
              required
              minLength={3}
              value={form.username}
              onChange={(event) => setForm({ ...form, username: event.target.value })}
              placeholder="arina_plus"
            />
          </Field>

          {!isLogin ? (
            <Field label="Email">
              <Input
                required
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="you@example.com"
              />
            </Field>
          ) : null}

          <Field label="Password">
            <Input
              required
              minLength={8}
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="At least 8 characters"
            />
          </Field>

          <Button className="w-full" type="submit" isLoading={loading}>
            {isLogin ? "Open dashboard" : "Register"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-zinc-400">
          {isLogin ? "New to BioBinary?" : "Already registered?"}{" "}
          <Link
            href={isLogin ? "/register" : "/login"}
            className="font-semibold text-acid-400 hover:text-acid-300"
          >
            {isLogin ? "Create account" : "Sign in"}
          </Link>
        </p>
      </motion.div>
    </Card>
  );
}
