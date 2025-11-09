import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { CreateRoleForm } from '@/components/role/CreateRoleForm';

export default async function CreateRolePage() {
  // Cette page est interceptée par le routing parallèle
  // Le modal sera affiché à la place, mais cette page sert de fallback
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="harp-card-header">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Plus className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">Créer un nouveau rôle</CardTitle>
                <CardDescription className="text-orange-100">
                  Remplissez les informations pour créer un nouveau rôle
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <CreateRoleForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

