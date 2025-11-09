"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Loader2, ArrowLeft } from "lucide-react";
import { ViewLinkContent } from './ViewLinkContent';
import { getLinkById } from '@/lib/actions/link-actions';

interface ViewLinkDialogProps {
  linkName: string;
  typlink: string;
  tab: string;
}

interface LinkData {
  display: number;
  link: string;
  typlink: string;
  url: string;
  tab: string;
  logo: string;
  descr: string;
}

export function ViewLinkDialog({ linkName, typlink, tab }: ViewLinkDialogProps) {
  const router = useRouter();
  const [linkData, setLinkData] = useState<LinkData | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleBackToList = () => {
    setOpen(false);
    setTimeout(() => {
      router.push('/list/links');
    }, 100);
  };

  useEffect(() => {
    if (open && !linkData) {
      setLoading(true);
      getLinkById(linkName, typlink, tab).then((data) => {
        setLinkData(data as LinkData | null);
        setLoading(false);
      });
    }
    if (!open) {
      setLinkData(null);
    }
  }, [open, linkName, typlink, tab]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 sm:h-8 sm:w-8 p-0 border-orange-300 hover:bg-orange-50"
          title="Voir"
        >
          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[60vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToList}
              className="mb-2 bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900 shadow-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
          </div>
          <DialogTitle className="text-lg">Détails du lien {linkName.toUpperCase()}</DialogTitle>
          <DialogDescription className="text-sm">
            Informations complètes du lien
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          </div>
        ) : linkData ? (
          <>
            <ViewLinkContent link={linkData} />
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                onClick={handleBackToList}
                className="bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900 shadow-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à la liste
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Aucune donnée disponible
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

