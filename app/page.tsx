
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
  Star
} from "lucide-react"

export const metadata = {
  title: 'Portail TMA HARP - Human Resources',
  description: 'Plateforme professionnelle de gestion des ressources humaines et de la maintenance applicative',
}
    
export default function Home() {

  console.log(process.env.NEXT_PUBLIC_SERVER_URL);

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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Gestion des Utilisateurs</h3>
                <p className="text-gray-600">Administration complète des comptes utilisateurs et des rôles</p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-8 w-8 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sécurité Avancée</h3>
                <p className="text-gray-600">Protection des données avec authentification robuste</p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Database className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Base de Données</h3>
                <p className="text-gray-600">Gestion centralisée et synchronisation des données</p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="h-8 w-8 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Tableaux de Bord</h3>
                <p className="text-gray-600">Analyses et rapports en temps réel</p>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Settings className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Configuration</h3>
                <p className="text-gray-600">Paramétrage flexible selon vos besoins</p>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="h-8 w-8 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Qualité Assurée</h3>
                <p className="text-gray-600">Processus validés et conformes aux standards</p>
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
