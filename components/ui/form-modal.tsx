"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface FormModalProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

export function FormModal({ 
  children, 
  title, 
  description,
  icon,
  maxWidth = "2xl"
}: FormModalProps) {
  const handleOpenChange = (open: boolean) => {
    // Empêcher la fermeture du modal sans terminer l'action
    // La fermeture se fera uniquement via les boutons du formulaire
    if (!open) {
      // Ne rien faire - empêcher la fermeture
      return;
    }
  };

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-full",
  };

  return (
    <Dialog defaultOpen={true} open={true} onOpenChange={handleOpenChange} modal={true}>
      <DialogContent 
        className={`${maxWidthClasses[maxWidth]} max-h-[90vh] overflow-y-auto p-0 [&>button]:hidden`}
        onInteractOutside={(e) => {
          // Empêcher la fermeture par clic extérieur et bloquer toutes les interactions
          e.preventDefault();
          e.stopPropagation();
        }}
        onEscapeKeyDown={(e) => {
          // Empêcher la fermeture par la touche Escape
          e.preventDefault();
          e.stopPropagation();
        }}
        onPointerDownOutside={(e) => {
          // Empêcher la fermeture par clic extérieur et bloquer tous les clics
          e.preventDefault();
          e.stopPropagation();
        }}
        onFocusOutside={(e) => {
          // Empêcher la perte de focus qui pourrait fermer le modal
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Card className="border-0 shadow-none">
          <CardHeader className="harp-card-header pb-4">
            <DialogHeader>
              <div className="flex items-center gap-3">
                {icon && (
                  <div className="p-2 bg-white/20 rounded-lg">
                    {icon}
                  </div>
                )}
                <div>
                  <DialogTitle className="text-2xl text-white">
                    {title}
                  </DialogTitle>
                  {description && (
                    <DialogDescription className="text-orange-100 mt-1">
                      {description}
                    </DialogDescription>
                  )}
                </div>
              </div>
            </DialogHeader>
          </CardHeader>
          <CardContent className="p-6">
            {children}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

