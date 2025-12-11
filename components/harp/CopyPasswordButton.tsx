"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "react-toastify";

/**
 * Composant client pour copier le mot de passe dans le presse-papiers
 * 
 * @param password - Le mot de passe à copier
 */
export function CopyPasswordButton({ password }: { password: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      toast.success("Mot de passe copié dans le presse-papiers");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Erreur lors de la copie:", error);
      toast.error("Erreur lors de la copie du mot de passe");
    }
  };

  return (
    <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 shadow-sm">
      <Button
        onClick={handleCopy}
        variant="outline"
        size="sm"
        className="w-full justify-center gap-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
      >
        {copied ? (
          <>
            <Check className="h-3 w-3" />
            Mot de passe copié
          </>
        ) : (
          <>
            <Copy className="h-3 w-3" />
            Clique ici pour copier le mot de passe
          </>
        )}
      </Button>
    </div>
  );
}

