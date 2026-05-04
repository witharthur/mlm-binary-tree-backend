import { notFound } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import type { PlacementSide } from "@/types/api";

export default function ReferralRegisterPage({
  params
}: {
  params: { sponsorId: string; side: string };
}) {
  const side = params.side.toUpperCase();

  if (side !== "L" && side !== "R") {
    notFound();
  }

  return (
    <AuthCard
      mode="register"
      sponsorId={params.sponsorId}
      side={side as PlacementSide}
    />
  );
}
