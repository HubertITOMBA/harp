import { auth } from "@/auth";
import { 
  Users, 
  Shield, 
  Database, 
  Server,
  Settings, 
  CheckCircle,
  ArrowRight,
  Star,
  Globe,
  FileText,
  Wrench,
  Link as LinkIcon,
  Menu as MenuIcon,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = {
  title: 'Accueil - Portail HARP',
  description: 'Bienvenue sur le Portail TMA HARP - Solution complète de gestion des ressources humaines et de maintenance applicative',
};

/**
 * Page d'accueil du portail HARP pour les utilisateurs connectés
 * Présente l'objectif de l'application et les fonctionnalités principales
 */
const HomePage = async () => {
  const session = await auth();
  
  if (!session?.user) {
    return notFound();
  }

  const features = [
    {
      icon: Globe,
      title: "Environnements",
      description: "Consultez et gérez les environnements PeopleSoft disponibles",
      href: "/harp/envs",
      color: "from-orange-100 to-orange-200",
      iconColor: "text-orange-600",
    },
    {
      icon: Server,
      title: "Serveurs",
      description: "Visualisez les informations serveurs et bases de données Oracle",
      href: "/list/servers",
      color: "from-gray-100 to-gray-200",
      iconColor: "text-gray-600",
    },
    {
      icon: Users,
      title: "Utilisateurs",
      description: "Administration complète des comptes utilisateurs et des rôles",
      href: "/list/users",
      color: "from-orange-100 to-orange-200",
      iconColor: "text-orange-600",
    },
    {
      icon: Shield,
      title: "Rôles",
      description: "Gérez les permissions et les rôles d'accès au système",
      href: "/list/roles",
      color: "from-gray-100 to-gray-200",
      iconColor: "text-gray-600",
    },
    {
      icon: Database,
      title: "Instances Oracle",
      description: "Consultez les instances Oracle et leurs configurations",
      href: "/list/instora",
      color: "from-orange-100 to-orange-200",
      iconColor: "text-orange-600",
    },
    {
      icon: Wrench,
      title: "Outils",
      description: "Accédez rapidement à vos outils de travail (PuTTY, SQL Developer, etc.)",
      href: "/list/tools",
      color: "from-gray-100 to-gray-200",
      iconColor: "text-gray-600",
    },
    {
      icon: LinkIcon,
      title: "Liens",
      description: "Accédez aux liens et ressources utiles",
      href: "/list/links",
      color: "from-orange-100 to-orange-200",
      iconColor: "text-orange-600",
    },
    {
      icon: MenuIcon,
      title: "Menus",
      description: "Configurez les menus de navigation du portail",
      href: "/list/menus",
      color: "from-gray-100 to-gray-200",
      iconColor: "text-gray-600",
    },
    {
      icon: FileText,
      title: "Journal",
      description: "Consultez l'historique des actions et événements",
      href: "/list/journal",
      color: "from-orange-100 to-orange-200",
      iconColor: "text-orange-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-100 to-orange-50">
      {/* Hero Section */}
      <main className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/5 via-orange-500/5 to-gray-900/5"></div>
        
        <div className="relative z-10 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            
            {/* Badge */}
            <div className="flex justify-center">
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-orange-100 to-gray-100 text-gray-700 border border-orange-200">
                <Star className="w-4 h-4 mr-2 text-orange-500" />
                Bienvenue, {session.user.name || session.user.email}
              </Badge>
            </div>

            {/* Main Title */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                <span className="block text-gray-900">Portail</span>
                <span className="block bg-gradient-to-r from-orange-500 via-orange-600 to-gray-700 bg-clip-text text-transparent">
                  TMA HARP
                </span>
                <span className="block text-xl sm:text-2xl font-semibold text-gray-600 mt-2">
                  Human Resources & Payroll
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Solution complète de gestion des ressources humaines et de maintenance applicative 
                pour optimiser vos processus métier.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-transparent to-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Fonctionnalités Principales
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Accédez rapidement aux outils et fonctionnalités du portail
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Link key={index} href={feature.href}>
                  <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm h-full cursor-pointer">
                    <CardContent className="p-6">
                      <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`h-8 w-8 ${feature.iconColor}`} />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 text-center mb-4">
                        {feature.description}
                      </p>
                      <div className="flex items-center justify-center text-orange-600 group-hover:text-orange-700 transition-colors">
                        <span className="text-sm font-medium">Accéder</span>
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-gray-50/50 to-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Actions Rapides
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Accédez rapidement aux sections les plus utilisées
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/user/profile">
              <Button 
                variant="outline" 
                size="lg"
                className="w-full h-auto py-6 border-orange-300 hover:bg-orange-50 hover:border-orange-400 text-orange-700"
              >
                <div className="flex flex-col items-center gap-2">
                  <Users className="h-6 w-6" />
                  <span className="font-semibold">Mon Profil</span>
                </div>
              </Button>
            </Link>

            <Link href="/harp/envs">
              <Button 
                variant="outline" 
                size="lg"
                className="w-full h-auto py-6 border-orange-300 hover:bg-orange-50 hover:border-orange-400 text-orange-700"
              >
                <div className="flex flex-col items-center gap-2">
                  <Globe className="h-6 w-6" />
                  <span className="font-semibold">Environnements</span>
                </div>
              </Button>
            </Link>

            <Link href="/list/tools">
              <Button 
                variant="outline" 
                size="lg"
                className="w-full h-auto py-6 border-orange-300 hover:bg-orange-50 hover:border-orange-400 text-orange-700"
              >
                <div className="flex flex-col items-center gap-2">
                  <Wrench className="h-6 w-6" />
                  <span className="font-semibold">Outils</span>
                </div>
              </Button>
            </Link>

            <Link href="/list/journal">
              <Button 
                variant="outline" 
                size="lg"
                className="w-full h-auto py-6 border-orange-300 hover:bg-orange-50 hover:border-orange-400 text-orange-700"
              >
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-6 w-6" />
                  <span className="font-semibold">Journal</span>
                </div>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="harp-card-header">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-white">À propos du Portail HARP</CardTitle>
                  <CardDescription className="text-orange-100">
                    Votre solution professionnelle de gestion RH
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Database className="h-5 w-5 text-orange-600" />
                    Gestion des Environnements
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Consultez et gérez les environnements PeopleSoft, visualisez les informations 
                    serveurs et bases de données Oracle en temps réel.
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-orange-600" />
                    Outils Intégrés
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Lancez rapidement vos outils de travail (PuTTY, SQL Developer, PeopleSoft, etc.) 
                    directement depuis le navigateur grâce au protocole mylaunch://.
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-orange-600" />
                    Sécurité Avancée
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Système d&apos;authentification robuste avec gestion des rôles et permissions 
                    pour protéger vos données sensibles.
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="h-5 w-5 text-orange-600" />
                    Administration Centralisée
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Gérez les utilisateurs, les rôles, les serveurs et les configurations 
                    depuis une interface unique et intuitive.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Section À propos */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl font-bold text-orange-500">h</span>
                <span className="text-gray-400">a</span>
                <span className="text-orange-500">rp</span>
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Portail TMA HARP - Solution professionnelle de gestion des ressources humaines 
                et de maintenance applicative pour optimiser vos processus métier.
              </p>
            </div>

            {/* Section Liens rapides */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold mb-4">Liens Rapides</h4>
              <ul className="space-y-2">
                <li>
                  <Link 
                    href="/user/profile" 
                    className="text-gray-300 hover:text-orange-400 transition-colors text-sm flex items-center gap-2 group"
                  >
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    Mon Profil
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/harp/envs" 
                    className="text-gray-300 hover:text-orange-400 transition-colors text-sm flex items-center gap-2 group"
                  >
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    Environnements
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/list/tools" 
                    className="text-gray-300 hover:text-orange-400 transition-colors text-sm flex items-center gap-2 group"
                  >
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    Outils
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/list/journal" 
                    className="text-gray-300 hover:text-orange-400 transition-colors text-sm flex items-center gap-2 group"
                  >
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    Journal
                  </Link>
                </li>
              </ul>
            </div>

            {/* Section Ressources */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold mb-4">Ressources</h4>
              <ul className="space-y-2">
                <li>
                  <Link 
                    href="/list/servers" 
                    className="text-gray-300 hover:text-orange-400 transition-colors text-sm flex items-center gap-2 group"
                  >
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    Serveurs
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/list/roles" 
                    className="text-gray-300 hover:text-orange-400 transition-colors text-sm flex items-center gap-2 group"
                  >
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    Rôles
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/list/users" 
                    className="text-gray-300 hover:text-orange-400 transition-colors text-sm flex items-center gap-2 group"
                  >
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    Utilisateurs
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/list/instora" 
                    className="text-gray-300 hover:text-orange-400 transition-colors text-sm flex items-center gap-2 group"
                  >
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    Instances Oracle
                  </Link>
                </li>
              </ul>
            </div>

            {/* Section Contact */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-gray-300 text-sm">
                  <Mail className="h-4 w-4 text-orange-400" />
                  <span>Support technique</span>
                </li>
                <li className="flex items-center gap-2 text-gray-300 text-sm">
                  <Shield className="h-4 w-4 text-orange-400" />
                  <span>Sécurité & Confidentialité</span>
                </li>
                <li className="flex items-center gap-2 text-gray-300 text-sm">
                  <CheckCircle className="h-4 w-4 text-orange-400" />
                  <span>Version 1.0</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Séparateur */}
          <div className="border-t border-gray-700 pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-gray-400 text-sm text-center md:text-left">
                <p>© {new Date().getFullYear()} Portail TMA HARP. Tous droits réservés.</p>
                <p className="mt-1">Solution professionnelle de gestion RH</p>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="border-orange-500/50 text-orange-400 bg-orange-500/10">
                  <Star className="h-3 w-3 mr-1" />
                  Version Professionnelle
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
