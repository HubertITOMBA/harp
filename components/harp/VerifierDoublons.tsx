'use client';

import { useState } from 'react';
import { verifierDoublonsOracleSid } from '@/actions/importharp';

export default function VerifierDoublons() {
  const [resultat, setResultat] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleVerification = async () => {
    setLoading(true);
    try {
      const response = await verifierDoublonsOracleSid();
      setResultat(response);
    } catch (error) {
      console.error("Erreur:", error);
      setResultat({ error: "Une erreur est survenue" });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleVerification}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? 'Vérification...' : 'Vérifier les doublons Oracle SID'}
      </button>

      {resultat && (
        <div className="mt-4">
          {resultat.success && (
            <div className="text-green-600">{resultat.success}</div>
          )}
          
          {resultat.warning && (
            <div className="space-y-4">
              <div className="text-orange-600">{resultat.warning}</div>
              <div className="space-y-4">
                {resultat.details.map((doublon: any, index: number) => (
                  <div key={index} className="border p-4 rounded">
                    <h3 className="font-bold">Oracle SID: {doublon.oracle_sid}</h3>
                    <p>Nombre d'occurrences: {doublon.occurrences}</p>
                    <div className="mt-2">
                      <table className="min-w-full">
                        <thead>
                          <tr>
                            <th className="text-left">ID</th>
                            <th className="text-left">Env</th>
                            <th className="text-left">Alias QL</th>
                            <th className="text-left">Schema</th>
                          </tr>
                        </thead>
                        <tbody>
                          {doublon.environnements.map((env: any, envIndex: number) => (
                            <tr key={envIndex}>
                              <td>{env.id}</td>
                              <td>{env.env}</td>
                              <td>{env.aliasql}</td>
                              <td>{env.oraschema}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resultat.error && (
            <div className="text-red-600">{resultat.error}</div>
          )}
        </div>
      )}
    </div>
  );
}