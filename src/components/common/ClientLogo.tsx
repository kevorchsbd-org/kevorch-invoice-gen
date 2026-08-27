import React, { useState, useEffect } from 'react';
import { Client } from '../../types';
import { getClientAsset, revokeObjectUrl } from '../../lib/indexedDb';

interface ClientLogoProps {
  client: Client;
  className?: string;
  fallbackClassName?: string;
  alt?: string;
}

export const ClientLogo: React.FC<ClientLogoProps> = ({
  client,
  className = "w-11 h-11 rounded-2xl object-contain border border-gray-200/50 dark:border-white/10 p-1 bg-white/60 dark:bg-black/20",
  fallbackClassName = "w-11 h-11 rounded-2xl bg-red-500/10 dark:bg-red-500/20 text-[#E31B23] font-black flex items-center justify-center text-lg border border-red-500/20",
  alt
}) => {
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    let createdUrl: string | null = null;
    let isMounted = true;

    const loadLogo = async () => {
      setHasError(false);
      try {
        // 1. Try loading from local IndexedDB first
        const asset = await getClientAsset(client.id);
        if (asset?.url && isMounted) {
          createdUrl = asset.url;
          setLogoSrc(asset.url);
          return;
        }
      } catch (err) {
        console.warn('ClientLogo IndexedDB load notice:', err);
      }

      // 2. Fallback to client.logoUrl if valid and not expired blob URL
      if (client.logoUrl && !client.logoUrl.startsWith('blob:') && client.logoUrl !== 'indexeddb') {
        if (isMounted) setLogoSrc(client.logoUrl);
      } else {
        if (isMounted) setLogoSrc(null);
      }
    };

    loadLogo();

    return () => {
      isMounted = false;
      if (createdUrl) {
        revokeObjectUrl(createdUrl);
      }
    };
  }, [client.id, client.logoUrl]);

  if (logoSrc && !hasError) {
    return (
      <img
        src={logoSrc}
        alt={alt || client.companyName || client.name}
        className={className}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div className={fallbackClassName}>
      {client.name ? client.name[0].toUpperCase() : 'C'}
    </div>
  );
};
