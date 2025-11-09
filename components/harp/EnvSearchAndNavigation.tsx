"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronUp, ChevronDown, X } from "lucide-react";

interface EnvData {
  id: number;
  env: string;
  descr?: string | null;
  aliasql?: string | null;
  oraschema?: string | null;
  psversion?: string | null;
  ptversion?: string | null;
  harprelease?: string | null;
  statutenv?: {
    statenv?: string | null;
  } | null;
  serverInfo?: {
    srv?: string | null;
    ip?: string | null;
    pshome?: string | null;
  } | null;
}

interface EnvSearchAndNavigationProps {
  children: React.ReactNode;
  envCount: number;
  envsData?: EnvData[];
}

/**
 * Composant client pour ajouter la recherche et la navigation (haut/bas) à la liste des environnements
 * 
 * @param children - Le contenu à afficher (liste des environnements)
 * @param envCount - Le nombre total d'environnements
 */
export function EnvSearchAndNavigation({ children, envCount, envsData }: EnvSearchAndNavigationProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Vérifier la position du scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const scrollPercentage = scrollTop / (scrollHeight - clientHeight);

      setIsAtTop(scrollTop < 100);
      setIsAtBottom(scrollPercentage > 0.95 || scrollHeight <= clientHeight);
      setShowScrollButtons(scrollHeight > clientHeight);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll(); // Vérifier au chargement initial
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [children]);

  // Filtrer les environnements en fonction du terme de recherche
  const filteredChildren = React.useMemo(() => {
    if (!searchTerm || !searchTerm.trim()) return children;

    // Si on n'a pas les données, retourner tous les enfants
    if (!envsData || envsData.length === 0) {
      console.warn("EnvSearchAndNavigation: envsData n'est pas fourni, la recherche ne peut pas fonctionner");
      return children;
    }

    // Filtrer les données en fonction du terme de recherche
    const searchLower = searchTerm.toLowerCase().trim();
    const filteredIds = new Set(
      envsData
        .filter((env) => {
          // Recherche dans tous les champs pertinents
          const searchFields = [
            env.env,
            env.descr,
            env.aliasql,
            env.oraschema,
            env.psversion,
            env.ptversion,
            env.harprelease,
            env.statutenv?.statenv,
            env.serverInfo?.srv,
            env.serverInfo?.ip,
            env.serverInfo?.pshome,
          ];

          return searchFields.some((field) => {
            if (!field) return false;
            return field.toLowerCase().includes(searchLower);
          });
        })
        .map((env) => env.id)
    );

    // Filtrer les enfants React en fonction des IDs filtrés
    const childrenArray = React.Children.toArray(children) as React.ReactElement[];
    
    return childrenArray.filter((child) => {
      // Essayer d'extraire l'ID depuis le key
      let envId: number | null = null;
      
      // Méthode 1: key direct (si accessible)
      if (child.key !== null && child.key !== undefined) {
        const keyStr = String(child.key);
        const parsed = parseInt(keyStr, 10);
        if (!isNaN(parsed) && parsed > 0) {
          envId = parsed;
        }
      }
      
      // Méthode 2: chercher dans les props (si une prop data-env-id existe)
      if (envId === null && child.props) {
        const props = child.props as { 'data-env-id'?: number | string; key?: number | string };
        if (props['data-env-id']) {
          const parsed = typeof props['data-env-id'] === 'string' 
            ? parseInt(props['data-env-id'], 10) 
            : props['data-env-id'];
          if (!isNaN(parsed) && parsed > 0) {
            envId = parsed;
          }
        }
      }

      // Si on a trouvé un ID, vérifier s'il est dans la liste filtrée
      if (envId !== null) {
        return filteredIds.has(envId);
      }

      // Si on ne peut pas déterminer l'ID, garder l'élément (pour éviter de tout masquer)
      return true;
    });
  }, [children, searchTerm, envsData]);

  // Navigation vers le haut
  const scrollToTop = () => {
    containerRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Navigation vers le bas
  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  // Focus sur la recherche avec Ctrl+F ou Cmd+F
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative">
      {/* Barre de recherche fixe */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-orange-200 shadow-sm mb-4 p-4 rounded-lg">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder={`Rechercher parmi ${envCount} environnement${envCount > 1 ? 's' : ''}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 border-orange-300 focus:border-orange-500 focus:ring-orange-500"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-orange-50"
                  onClick={() => setSearchTerm("")}
                  title="Effacer la recherche"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </Button>
              )}
            </div>
            {searchTerm && (
              <div className="text-sm text-gray-600 whitespace-nowrap">
                {React.Children.count(filteredChildren)} résultat{React.Children.count(filteredChildren) > 1 ? 's' : ''}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Recherche insensible à la casse. Tapez quelques lettres pour filtrer les environnements (ex: &quot;pr1&quot; trouve PR1, PR1_DEV, DEV_PR1)
          </p>
        </div>
      </div>

      {/* Conteneur scrollable avec la liste filtrée */}
      <div
        ref={containerRef}
        className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto scroll-smooth"
        style={{ scrollPaddingTop: '20px' }}
      >
        {searchTerm ? (
          React.Children.count(filteredChildren) > 0 ? (
            filteredChildren
          ) : (
            <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 font-medium">Aucun environnement trouvé</p>
              <p className="text-sm text-gray-500 mt-2">
                Aucun résultat pour &quot;{searchTerm}&quot;
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 border-orange-300 hover:bg-orange-50"
                onClick={() => setSearchTerm("")}
              >
                Effacer la recherche
              </Button>
            </div>
          )
        ) : (
          children
        )}
      </div>

      {/* Boutons de navigation flottants */}
      {showScrollButtons && (
        <div className="fixed right-6 bottom-6 z-40 flex flex-col gap-2">
          {!isAtTop && (
            <Button
              onClick={scrollToTop}
              size="lg"
              className="h-12 w-12 rounded-full shadow-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 transition-all duration-300 hover:scale-110"
              title="Aller en haut"
            >
              <ChevronUp className="h-6 w-6" />
            </Button>
          )}
          {!isAtBottom && (
            <Button
              onClick={scrollToBottom}
              size="lg"
              className="h-12 w-12 rounded-full shadow-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 transition-all duration-300 hover:scale-110"
              title="Aller en bas"
            >
              <ChevronDown className="h-6 w-6" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

