"use client";

import { useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ViewDialogProps {
  trigger: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

/**
 * Composant réutilisable pour créer des modals de consultation avec le style orange
 * Basé sur add-menu-role-form.tsx
 */
export function ViewDialog({
  trigger,
  title,
  description,
  children,
  maxWidth = "full",
}: ViewDialogProps) {
  const [open, setOpen] = useState(false);

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-full",
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className={`${maxWidthClasses[maxWidth]} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader className="space-y-0">
          <DialogTitle className="bg-orange-500 text-white px-4 py-2 rounded-t-md -mx-6 -mt-6">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="bg-orange-500 text-white px-4 py-1.5 rounded-b-md -mx-6 mb-4">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="py-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export a hook to control the dialog from child components
export function useViewDialog() {
  const [open, setOpen] = useState(false);
  return { open, setOpen };
}

