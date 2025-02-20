import { auth } from "@/auth";

export default async function RolesPage() {
    const session = await auth();
    const roles = session?.user?.customField || [];

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Mes Rôles</h1>
            
            <div className="bg-white rounded-lg shadow p-4">
                {roles.length > 0 ? (
                    <ul className="space-y-2">
                        {roles.map((role: string, index: number) => (
                            <li key={index} className="flex items-center gap-2">
                                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                                <span>{role}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">Aucun rôle n'a été attribué.</p>
                )}
            </div>
        </div>
    );
}