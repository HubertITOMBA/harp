"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TestLoginPage() {
  const [netid, setNetid] = useState("hitomba");
  const [password, setPassword] = useState("hitomba");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/test-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ netid, password }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Test de Connexion</h1>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">NetID</label>
          <Input
            value={netid}
            onChange={(e) => setNetid(e.target.value)}
            placeholder="hitomba"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Mot de passe</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="hitomba"
          />
        </div>

        <Button onClick={handleTest} disabled={loading} className="w-full">
          {loading ? "Vérification..." : "Vérifier la connexion"}
        </Button>
      </div>

      {result && (
        <div
          className={`p-4 rounded-lg ${
            result.success
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <h2 className="font-semibold mb-2">
            {result.success ? "✅ Succès" : "❌ Erreur"}
          </h2>
          <p className="text-sm">{result.message}</p>
          {result.user && (
            <div className="mt-4 p-3 bg-white rounded border">
              <h3 className="font-semibold mb-2">Informations utilisateur:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(result.user, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

