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
 * Remonte jusqu'au premier ancêtre qui défile.
 * Sur cette page, c'est le cadre overflow-auto du layout protégé.
 *
 * @param element - Point de départ dans la liste
 * @returns L'ancêtre défilant, ou null
 */
function findScrollableAncestor(element: HTMLElement | null): HTMLElement | null {
  let node = element?.parentElement ?? null;
  while (node) {
    const overflowY = window.getComputedStyle(node).overflowY;
    if (overflowY === "auto" || overflowY === "scroll") {
      return node;
    }
    node = node.parentElement;
  }
  return null;
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
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollParentRef = useRef<HTMLElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalisation tolérante pour la recherche :
  // - minuscules
  // - suppression des espaces, tirets, underscores (ga, gassi, gassi_ => même forme)
  const normalizeText = (value: string) =>
    value
      .toLowerCase()
      .replace(/[\s_-]+/g, "");

  // Le défilement réel est celui du layout protégé (overflow-auto autour de la page),
  // pas un second cadre dans la liste.
  useEffect(() => {
    const parent = findScrollableAncestor(rootRef.current);
    scrollParentRef.current = parent;
    if (!parent) {
      setShowScrollButtons(false);
      setIsAtTop(true);
      setIsAtBottom(true);
      return;
    }

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = parent;
      const distance = scrollHeight - clientHeight;
      const scrollPercentage = distance > 0 ? scrollTop / distance : 1;

      setIsAtTop(scrollTop < 100);
      setIsAtBottom(scrollPercentage > 0.95 || distance <= 0);
      setShowScrollButtons(distance > 1);
    };

    parent.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    handleScroll();

    return () => {
      parent.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [children, searchTerm]);

  // Filtrer les environnements en fonction du terme de recherche
  const filteredChildren = React.useMemo(() => {
    if (!searchTerm || !searchTerm.trim()) return children;

    // Si on n'a pas les données, retourner tous les enfants
    if (!envsData || envsData.length === 0) {
      console.warn("EnvSearchAndNavigation: envsData n'est pas fourni, la recherche ne peut pas fonctionner");
      return children;
    }

    // Filtrer les données en fonction du terme de recherche (sur le NOM d'env uniquement)
    const searchNorm = normalizeText(searchTerm.trim());
    const filteredIds = new Set(
      envsData
        .filter((env) => {
          const nameNorm = normalizeText(env.env || "");
          if (!nameNorm) return false;
          // Commence par (prioritaire), puis contient (pour les cas plus longs)
          return (
            nameNorm.startsWith(searchNorm) ||
            (searchNorm.length > 2 && nameNorm.includes(searchNorm))
          );
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

  const scrollToTop = () => {
    scrollParentRef.current?.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const scrollToBottom = () => {
    const parent = scrollParentRef.current;
    parent?.scrollTo({
      top: parent.scrollHeight,
      behavior: "smooth",
    });
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
    <div ref={rootRef} className="relative">
      {/* Barre de recherche fixe dans le défilement de la page */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-orange-200 shadow-sm mb-3 p-3 rounded-lg">
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

      {/* Liste, défilée par le layout protégé */}
      <div className="space-y-3">
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

