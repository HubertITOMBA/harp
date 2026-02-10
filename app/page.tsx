
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"    
import { LoginButton } from "@/components/auth/login-button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MigrationInit } from "@/components/migration/MigrationInit"
import { 
  Users, 
  Shield, 
  Database, 
  BarChart3, 
  Settings, 
  CheckCircle,
  ArrowRight,
  Star,
  Bell,
  MessageSquare,
  Clock,
  Menu as MenuIcon,
  Link as LinkIcon,
  FileText,
  Server,
  Globe,
  Wrench
} from "lucide-react"

export const metadata = {
  title: 'Portail TMA HARP - Human Resources',
  description: 'Plateforme professionnelle de gestion des ressources humaines et de la maintenance applicative',
}
    
export default function Home() {
  return (
    <>
      {/* Initialisation automatique de la migration */}
      <MigrationInit />
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-100 to-orange-50">
      {/* Hero Section */}
      <main className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/5 via-orange-500/5 to-gray-900/5"></div>
        
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            
            {/* Badge */}
            <div className="flex justify-center">
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-orange-100 to-gray-100 text-gray-700 border border-orange-200">
                <Star className="w-4 h-4 mr-2 text-orange-500" />
                Plateforme Professionnelle
              </Badge>
            </div>

            {/* Main Title */}
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
                <span className="block text-gray-900">Portail</span>
                <span className="block bg-gradient-to-r from-orange-500 via-orange-600 to-gray-700 bg-clip-text text-transparent">
                  TMA HARP
                </span>
                <span className="block text-2xl sm:text-3xl font-semibold text-gray-600 mt-2">
                  Human Resources
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Solution complète de gestion des ressources humaines et de maintenance applicative 
                pour optimiser vos processus métier.
              </p>
            </div>

            {/* CTA Button */}
            <div className="pt-4">
              <LoginButton>
                <Button 
                  size="lg" 
                  className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  Se connecter
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </LoginButton>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-transparent to-gray-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Fonctionnalités Principales
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Découvrez les outils puissants qui transforment votre gestion RH
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 - Notifications */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:border-orange-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Bell className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Notifications</h3>
                <p className="text-gray-600 text-sm">Système de notifications en temps réel pour rester informé des événements importants</p>
              </CardContent>
            </Card>

            {/* Feature 2 - Messagerie */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:border-orange-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Messagerie</h3>
                <p className="text-gray-600 text-sm">Communication centralisée avec gestion des messages actifs et archivés</p>
              </CardContent>
            </Card>

            {/* Feature 3 - Chrono-tâche */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:border-orange-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Chrono-tâche</h3>
                <p className="text-gray-600 text-sm">Suivi précis du temps avec gestion des tâches et calcul automatique des durées</p>
              </CardContent>
            </Card>

            {/* Feature 4 - Menus */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:border-orange-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <MenuIcon className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Gestion des Menus</h3>
                <p className="text-gray-600 text-sm">Configuration personnalisée des menus de navigation avec contrôle d'accès par rôles</p>
              </CardContent>
            </Card>

            {/* Feature 5 - Liens */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:border-orange-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <LinkIcon className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Ressources & Liens</h3>
                <p className="text-gray-600 text-sm">Accès rapide à tous vos liens et ressources essentielles organisés et catégorisés</p>
              </CardContent>
            </Card>

            {/* Feature 6 - Journal */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:border-orange-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Journal d'Activité</h3>
                <p className="text-gray-600 text-sm">Traçabilité complète des actions avec historique détaillé et recherche avancée</p>
              </CardContent>
            </Card>

            {/* Feature 7 - Utilisateurs */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:border-orange-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Gestion des Utilisateurs</h3>
                <p className="text-gray-600 text-sm">Administration complète des comptes utilisateurs, rôles et permissions</p>
              </CardContent>
            </Card>

            {/* Feature 8 - Sécurité */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:border-orange-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-8 w-8 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sécurité Avancée</h3>
                <p className="text-gray-600 text-sm">Protection des données avec authentification robuste et contrôle d'accès granulaire</p>
              </CardContent>
            </Card>

            {/* Feature 9 - Environnements */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:border-orange-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-teal-100 to-teal-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Globe className="h-8 w-8 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Environnements</h3>
                <p className="text-gray-600 text-sm">Gestion centralisée des environnements PeopleSoft et configurations</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-2">Portail TMA HARP</h3>
            <p className="text-gray-300">Solution professionnelle de gestion RH</p>
          </div>
          <div className="border-t border-gray-700 pt-8">
            <p className="text-gray-400">
              © 2025 TECH - TMA HARP. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
};
