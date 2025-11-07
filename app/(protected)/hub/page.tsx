'use client'

import { PuttyLauncher } from '@/components/ui/external-tool-launcher'
import { launchExternalTool } from '@/lib/mylaunch'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Terminal, Server, User, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function HarpPage() {
  const { data: session } = useSession()
  const [error, setError] = useState<string | null>(null)
  const [host, setHost] = useState<string>('192.168.1.49')
  const [user, setUser] = useState<string>('')

  // Utiliser automatiquement le netid de l'utilisateur connecté
  useEffect(() => {
    if (session?.user?.netid) {
      setUser(session.user.netid)
    }
  }, [session])

  const handleLaunchPutty = () => {
    setError(null)
    
    // Vérifier que le host est fourni
    if (!host || host.trim() === '') {
      setError('Veuillez entrer un hôte (IP ou nom de serveur)')
      return
    }
    
    // Utiliser le netid de la session si l'utilisateur n'a pas spécifié de user
    const userToUse = user && user.trim() !== '' 
      ? user.trim() 
      : (session?.user?.netid || undefined)
    
    try {
      const success = launchExternalTool('putty', {
        host: host.trim(),
        user: userToUse,
        port: 22,
      })
      
      if (!success) {
        setError('Impossible de lancer PuTTY. Vérifiez que le protocole mylaunch:// est installé.')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du lancement de PuTTY'
      setError(errorMessage)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* En-tête */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Connexion <span className="text-orange-600">SSH</span>
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Lancez PuTTY pour vous connecter aux serveurs via SSH
          </p>
        </div>

        {/* Carte principale */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Terminal className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">Configuration de la connexion</CardTitle>
                <CardDescription className="text-orange-100">
                  Renseignez les paramètres de connexion SSH
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Champ Hôte */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Server className="h-4 w-4 text-orange-600" />
                Hôte (IP ou nom de serveur)
              </Label>
              <Input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="192.168.1.49"
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Adresse IP ou nom d&apos;hôte du serveur distant
              </p>
            </div>

            {/* Champ Utilisateur */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <User className="h-4 w-4 text-orange-600" />
                Utilisateur
                {session?.user?.netid && (
                  <span className="text-xs font-normal text-gray-500">
                    (NetID: {session.user.netid})
                  </span>
                )}
              </Label>
              <Input
                type="text"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder={session?.user?.netid || "root"}
                className="w-full"
              />
              {session?.user?.netid && (
                <p className="text-xs text-gray-500">
                  Votre NetID sera utilisé par défaut si le champ est vide
                </p>
              )}
            </div>

            {/* Bouton de lancement */}
            <div className="pt-4">
              <Button
                onClick={handleLaunchPutty}
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg"
              >
                <Terminal className="mr-2 h-5 w-5" />
                Lancer PuTTY
              </Button>
            </div>

            {/* Composant alternatif */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">Ou utilisez le composant de lancement :</p>
              <PuttyLauncher
                host={host || 'localhost'}
                user={user || session?.user?.netid || undefined}
                port={22}
                variant="outline"
              />
            </div>
          </CardContent>
        </Card>

        {/* Message d'erreur */}
        {error && (
          <Alert variant="destructive" className="border-red-300 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="text-red-800 font-semibold">Erreur</AlertTitle>
            <AlertDescription className="text-red-700 mt-2">
              <p className="font-medium">{error}</p>
              <p className="text-xs mt-2 text-red-600">
                Assurez-vous que le protocole mylaunch:// est installé. 
                Voir windows/INSTALLATION.md pour les instructions.
              </p>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
