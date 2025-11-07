import prisma from '@/lib/prisma';
import { Label } from "@/components/ui/label"
import { Button } from '@/components/ui/button'

interface EnvInfoProps {
    env: string;
    srv: string;
}

export const EnvInfos = async ({ 
    env,
    srv, // eslint-disable-line @typescript-eslint/no-unused-vars
}: EnvInfoProps) => {
    // Récupérer l'environnement pour obtenir l'ID
    const envsharp = await prisma.envsharp.findUnique({
        where: { env },
        select: { id: true }
    });

    if (!envsharp) {
        return <div className="text-muted-foreground">Environnement non trouvé</div>;
    }

    // Récupérer les informations de l'environnement via harpenvinfo
    const envInfos = await prisma.harpenvinfo.findUnique({ 
        where: { envId: envsharp.id } 
    });

    if (!envInfos) {
        return <div className="text-muted-foreground">Aucune information d&apos;environnement disponible</div>;
    }

    return (
        <div className="space-y-3">
            {envInfos.datadt && (
                <div className="flex gap-4 items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <Label className="w-32 text-muted-foreground">Image production :</Label>
                    <Label className="font-semibold text-sm">
                        {new Intl.DateTimeFormat("fr-FR", {
                            dateStyle: 'short',
                            timeStyle: 'medium',
                        }).format(envInfos.datadt)}
                    </Label>
                </div>
            )}
            {envInfos.refreshdt && (
                <div className="flex gap-4 items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <Label className="w-32 text-muted-foreground">Dernier refresh :</Label>
                    <Label className="font-semibold text-sm">
                        {new Intl.DateTimeFormat("fr-FR", {
                            dateStyle: 'short',
                            timeStyle: 'medium',
                        }).format(envInfos.refreshdt)}
                    </Label>
                </div>
            )}
            {envInfos.modedt && (
                <div className="flex gap-4 items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <Label className="w-32 text-muted-foreground">Dernier mis à jour :</Label>
                    <Label className="font-semibold text-sm">
                        {new Intl.DateTimeFormat("fr-FR", {
                            dateStyle: 'short',
                            timeStyle: 'medium',
                        }).format(envInfos.modedt)}
                    </Label>
                </div>
            )}
            {envInfos.datmaj && (
                <div className="flex gap-4 items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <Label className="w-32 text-muted-foreground">Date maj :</Label>
                    <Label className="font-semibold text-sm">
                        {new Intl.DateTimeFormat("fr-FR", {
                            dateStyle: 'short',
                            timeStyle: 'short',
                        }).format(envInfos.datmaj)}
                    </Label>
                </div>
            )}
            {envInfos.pswd_ft_exploit && (
                <div className="flex gap-4 items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <Label className="w-32 text-muted-foreground">password FT_EXPLOIT :</Label>
                    <Label className="text-red-600 font-semibold text-sm">
                        Clique ici pour copier le mot de passe
                    </Label>
                    <Button variant="outline" size="sm">
                        Copier le mot de passe
                    </Button>
                </div>
            )}
            {envInfos.userunx && (
                <div className="flex gap-4 items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <Label className="w-32 text-muted-foreground">Sudo Sudoer :</Label>
                    <Label className="bg-harpOrange text-white p-1 rounded-xl text-sm">
                        {envInfos.userunx}
                    </Label>
                </div>
            )}
        </div>
    )
}
