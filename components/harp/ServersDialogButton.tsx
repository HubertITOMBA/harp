"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Server } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";

interface ServersDialogButtonProps {
  envId: number;
  envName: string;
}

const LazyEnvServRoles = dynamic(() => import("./EnvServRoles"), {
  ssr: false,
  loading: () => <p className="text-sm text-muted-foreground">Chargement des serveurs...</p>,
});

export function ServersDialogButton({ envId, envName }: ServersDialogButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          className="h-8 px-3 text-xs text-white border border-orange-600 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 shadow-sm hover:shadow-md hover:brightness-[1.02]"
        >
          <Server className="h-3.5 w-3.5 mr-1.5" />
          Serveurs
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-6xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pb-1">
            <span className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 bg-clip-text text-transparent">
              Serveurs
            </span>{" "}
            <span className="text-slate-700">- {envName}</span>
          </DialogTitle>
        </DialogHeader>
        {open ? <LazyEnvServRoles id={envId} /> : null}
      </DialogContent>
    </Dialog>
  );
}

