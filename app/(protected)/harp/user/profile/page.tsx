import { Metadata } from 'next';
import { auth } from '@/auth';
import { SessionProvider } from 'next-auth/react';
import ProfileForm from './profile-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';


export const metadata: Metadata = {
    title: "Profil de l'utilisateur",
  };

const Profile = async() => {
    const session = await auth();
    return ( 
        <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* En-tête */}
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                        Modifier mon <span className="text-orange-600">Profil</span>
                    </h1>
                    <p className="text-gray-600 text-sm sm:text-base">
                        Mettez à jour vos informations personnelles
                    </p>
                </div>

                {/* Carte principale */}
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="harp-card-header">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <User className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl text-white">Informations du profil</CardTitle>
                                <CardDescription className="text-orange-100">
                                    Gérez vos données personnelles
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <SessionProvider session={session}>
                            <ProfileForm />
                        </SessionProvider>
                    </CardContent>
                </Card>
            </div>
        </div>
     );
}
 
export default Profile;