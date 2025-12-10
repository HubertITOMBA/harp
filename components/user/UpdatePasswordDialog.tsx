"use client"

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, Mail, AlertTriangle } from "lucide-react";
import { updateUserPassword } from '@/actions/update-user-password';
import { useRouter } from 'next/navigation';
import { toast } from "react-toastify";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface UpdatePasswordDialogProps {
  netid: string;
  userEmail?: string | null;
}

export function UpdatePasswordDialog({ netid, userEmail }: UpdatePasswordDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showReminder, setShowReminder] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    startTransition(async () => {
      const result = await updateUserPassword(netid, password);
      
      if (result.success) {
        toast.success(result.message);
        setShowReminder(true);
        setPassword("");
        setConfirmPassword("");
        // Ne pas fermer le dialog immédiatement pour afficher le rappel
        setTimeout(() => {
          setOpen(false);
          setShowReminder(false);
          router.refresh();
        }, 5000); // Fermer après 5 secondes pour laisser le temps de lire le rappel
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour du mot de passe");
      }
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isPending) {
      setOpen(newOpen);
      if (!newOpen) {
        // Réinitialiser le formulaire quand on ferme
        setPassword("");
        setConfirmPassword("");
        setShowReminder(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-orange-300 hover:bg-orange-50">
          <Lock className="h-4 w-4 mr-2" />
          Modifier
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="space-y-0">
          <DialogTitle className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-t-md -mx-6 -mt-6">
            <Lock className="h-5 w-5" />
            Modifier le mot de passe
          </DialogTitle>
          <DialogDescription className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1.5 rounded-b-md -mx-6 mb-4">
            Définir un nouveau mot de passe pour l&apos;utilisateur <span className="font-semibold uppercase">{netid}</span>
          </DialogDescription>
        </DialogHeader>
        
        {showReminder ? (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-900 font-semibold">
              ⚠️ Action importante requise
            </AlertTitle>
            <AlertDescription className="text-orange-800 mt-2">
              <p className="font-semibold mb-2">
                Le mot de passe a été modifié avec succès.
              </p>
              <p className="mb-2">
                <strong>Vous devez impérativement envoyer un email à l&apos;utilisateur</strong> pour lui communiquer le nouveau mot de passe.
              </p>
              {userEmail && (
                <p className="text-sm mt-2">
                  Email de l&apos;utilisateur : <span className="font-mono font-semibold">{userEmail}</span>
                </p>
              )}
              <p className="text-xs mt-3 text-orange-700 italic">
                Ce message disparaîtra automatiquement dans quelques secondes.
              </p>
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">
                Nouveau mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Saisir le nouveau mot de passe"
                disabled={isPending}
                minLength={6}
                required
                className="font-mono"
              />
              <p className="text-xs text-gray-500">
                Minimum 6 caractères
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold">
                Confirmer le mot de passe
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmer le nouveau mot de passe"
                disabled={isPending}
                minLength={6}
                required
                className="font-mono"
              />
            </div>

            {userEmail && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-800">
                    <p className="font-semibold mb-1">Rappel :</p>
                    <p>
                      Après la modification, envoyez un email à <span className="font-mono font-semibold">{userEmail}</span> pour lui communiquer le nouveau mot de passe.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isPending || !password || !confirmPassword}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Modification...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Modifier le mot de passe
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

