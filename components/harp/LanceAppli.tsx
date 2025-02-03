"use client"
 
import { useState } from 'react';

const LancerApplis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const execAppli = async () => {
    setLoading(true);

    // fetch('/api/harp/partHote', {
    //     method: 'POST'
    // })
    //   .then(response => response.json())
    // //   .then(data => setResult(data))
    //   .catch(error => setLoading(error))
    //   .finally(() => setLoading(false))

    setError(null);
    setSuccess(null);


    // const puttyPath = "C:\\Program Files\\PuTTY\\putty.exe";

    try {
      const response = await fetch('/api/harp', {
        method: 'POST',
        
      });

     // console.log("PREMIER APPEL ==", response);
      

      if (!response.ok) {
        throw new Error('Échec du lancement de Putty');
      }

      const data = await response.json();
      setSuccess(data.message);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* <h1>Lancer Putty</h1> */}
      <button onClick={execAppli} disabled={loading}>
        {loading ? 'Lancement en cours...' : 'Lancer Putty'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </div>
  );
};

export default LancerApplis;