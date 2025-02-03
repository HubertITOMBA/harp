"use client"

import { Divide } from 'lucide-react';
import React, { useState } from 'react'
import { Button } from '@/components/ui/button';

export default function EnvoiMail() {

    const [result, setResult ] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState<boolean>(false);

    const sendEmail = () => {
        setLoading(true);

        fetch('/api/harp/emails', {
            method: 'POST'
        })
          .then(response => response.json())
          .then(data => setResult(data))
          .catch(error => setResult(error))
          .finally(() => setLoading(false))
    }

  return (
    <div className="p-4">
        <div className="my-4">
            {JSON.stringify(result)}
        </div>
        {loading && <div className="my-4">Processing ...</div> }
        <Button onClick={sendEmail}
            className="bg-blue-500 rounded p-3 text-white"
        >
            Envoyer mail    
        </Button>
    </div>
  )
}
