"use client";

import { ReactNode } from "react";
import { toast } from "react-toastify";

/** Ports bloqués par Chrome (ERR_UNSAFE_PORT), ex. 6000 = X11. On ne peut pas forcer l'autorisation depuis la page ; il faut lancer Chrome avec --explicitly-allowed-ports=6000 */
const CHROME_UNSAFE_PORTS = [6000];

function getPortFromUrl(url: string): number | null {
  try {
    const u = new URL(url);
    const port = u.port;
    if (port) return parseInt(port, 10);
    return u.protocol === "https:" ? 443 : 80;
  } catch {
    return null;
  }
}

function isUnsafePort(url: string): boolean {
  const port = getPortFromUrl(url);
  return port !== null && CHROME_UNSAFE_PORTS.includes(port);
}

const UNSAFE_PORT_MESSAGE =
  "Ce lien utilise le port 6000. Si Chrome affiche ERR_UNSAFE_PORT, lancez Chrome avec : chrome.exe --explicitly-allowed-ports=6000 puis rouvrez le lien (il a été copié).";

interface HarpUrlLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export function HarpUrlLink({ href, children, className }: HarpUrlLinkProps) {
  const url = href && href !== "#" ? href : null;
  const unsafe = url ? isUnsafePort(url) : false;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!url || !unsafe) return;
    e.preventDefault();
    navigator.clipboard.writeText(url).then(
      () => toast.info(UNSAFE_PORT_MESSAGE, { autoClose: 12000 }),
      () => toast.error("Impossible de copier le lien.")
    );
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!url) {
    return <span className={className}>{children}</span>;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={unsafe ? handleClick : undefined}
      title={unsafe ? "Port 6000 : voir message si ERR_UNSAFE_PORT" : undefined}
    >
      {children}
    </a>
  );
}
