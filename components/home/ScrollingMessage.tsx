"use client"

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface ScrollingMessageProps {
  messages: string[];
}

/**
 * Composant pour afficher des messages défilants de droite à gauche dans une Card
 * Les messages changent automatiquement toutes les 10 secondes avec une transition fluide (fondu)
 * Style similaire à la Card de la chrono-tâche
 * 
 * @param messages - Tableau de messages à afficher en rotation
 */
export function ScrollingMessage({ messages }: ScrollingMessageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  // Vérifier que messages est valide
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return null;
  }

  // Rotation automatique des messages avec transition fluide
  // Temps d'affichage basé sur la longueur du message pour laisser le temps de lire
  useEffect(() => {
    if (messages.length <= 1) return;

    const currentMessage = messages[currentIndex] || "";
    // Calculer le temps d'affichage : minimum 15 secondes, + 1 seconde par 10 caractères
    const baseTime = 15000; // 15 secondes de base
    const charTime = Math.ceil(currentMessage.length / 10) * 1000; // 1 seconde par 10 caractères
    const displayTime = baseTime + charTime; // Temps total d'affichage

    const timeout = setTimeout(() => {
      // Déclencher le fondu de sortie
      setFadeOut(true);
      
      // Après le fondu de sortie, changer le message et déclencher le fondu d'entrée
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % messages.length);
        setFadeOut(false);
      }, 600); // Durée du fondu de sortie
    }, displayTime);

    return () => clearTimeout(timeout);
  }, [currentIndex, messages.length, messages]);

  const currentMessage = messages[currentIndex] || "";

  if (!currentMessage || currentMessage.trim() === "") {
    return null;
  }

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-2 border-orange-300 bg-gradient-to-r from-orange-100 to-orange-200 max-w-md">
      <CardContent className="p-4">
        <div className="overflow-hidden relative h-6">
          {/* Message défilant avec transition de fondu */}
          <div 
            key={currentIndex}
            className={`inline-block whitespace-nowrap animate-scroll-message transition-opacity duration-700 ease-in-out ${
              fadeOut ? "opacity-0" : "opacity-100"
            }`}
          >
            <span className="text-sm font-medium text-gray-900">
              {currentMessage}
            </span>
          </div>
        </div>
        {/* Indicateur de message multiple */}
        {messages.length > 1 && (
          <div className="flex justify-center gap-1 mt-2">
            {messages.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 w-1.5 rounded-full transition-all duration-500 ease-in-out ${
                  index === currentIndex
                    ? "bg-orange-600 w-4"
                    : "bg-orange-300"
                }`}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

