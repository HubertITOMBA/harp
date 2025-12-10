"use client";

import { useState, ReactNode, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface FormDialogProps {
  trigger: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>, closeDialog: () => void) => void | Promise<void>;
  submitLabel?: string;
  submitIcon?: ReactNode;
  cancelLabel?: string;
  isPending?: boolean;
  disabled?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

/**
 * Composant réutilisable pour créer des modals de formulaire avec le style orange
 * Basé sur add-menu-role-form.tsx
 */
export function FormDialog({
  trigger,
  title,
  description,
  children,
  onSubmit,
  submitLabel = "Enregistrer",
  submitIcon,
  cancelLabel = "Annuler",
  isPending = false,
  disabled = false,
  maxWidth = "2xl",
}: FormDialogProps) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-full",
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (onSubmit) {
      await onSubmit(e, () => setOpen(false));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className={maxWidthClasses[maxWidth]}>
        <DialogHeader className="space-y-0">
          <DialogTitle className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-t-md -mx-6 -mt-6">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1.5 rounded-b-md -mx-6 mb-4">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {children}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              {cancelLabel}
            </Button>
            <Button 
              type="submit" 
              disabled={isPending || disabled}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  {submitIcon && <span className="mr-2">{submitIcon}</span>}
                  {submitLabel}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

