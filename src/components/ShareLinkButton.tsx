"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

type ShareLinkButtonProps = {
  splitId: string;
  label?: string;
};

export function ShareLinkButton({
  splitId,
  label = "Share with group",
}: ShareLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/split/${splitId}/join`;

    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: "Split this bill with me",
          text: "Tap your items:",
          url,
        });
        return;
      } catch {
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      type="button"
      onClick={handleShare}
    >
      {copied ? "Link copied!" : label}
    </Button>
  );
}