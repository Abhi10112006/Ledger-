
import { useState, useEffect } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';

export const useImageCache = (imageUrl?: string) => {
    const [cachedSrc, setCachedSrc] = useState<string | undefined>(imageUrl);
    const [isCached, setIsCached] = useState(false);

    useEffect(() => {
        if (!imageUrl) {
            setCachedSrc(undefined);
            setIsCached(false);
            return;
        }

        let isActive = true;

        // Reset to original URL initially to avoid staleness
        setCachedSrc(imageUrl);
        setIsCached(false);

        const cacheImage = async () => {
            try {
                // Create a safe filename from URL
                const fileName = imageUrl.replace(/[^a-z0-9]/gi, '_').substring(0, 50) + '.jpg';
                const path = `ad-cache/${fileName}`;

                // 1. Check Cache
                try {
                    const stat = await Filesystem.stat({ path, directory: Directory.Cache });
                    if (stat && isActive) {
                        const read = await Filesystem.readFile({ path, directory: Directory.Cache });
                        // Ensure we handle the data format correctly (Capacitor returns string for base64)
                        setCachedSrc(`data:image/jpeg;base64,${read.data}`);
                        setIsCached(true);
                        return;
                    }
                } catch (e) {
                    // File not found in cache, proceed to download
                }

                // 2. Download if online
                if (navigator.onLine && isActive) {
                    const response = await fetch(imageUrl);
                    const blob = await response.blob();

                    const reader = new FileReader();
                    reader.readAsDataURL(blob);
                    reader.onloadend = async () => {
                        if (!isActive) return;
                        const base64data = reader.result as string;
                        // Filesystem.writeFile with encoding/data expects the raw data or base64 
                        const base64Content = base64data.split(',')[1];

                        try {
                            await Filesystem.mkdir({ path: 'ad-cache', directory: Directory.Cache, recursive: true }).catch(() => { });
                            await Filesystem.writeFile({ path, data: base64Content, directory: Directory.Cache });
                        } catch (e) {
                            console.error("Cache write failed", e);
                        }

                        setCachedSrc(base64data);
                        setIsCached(true);
                    };
                }
            } catch (error) {
                // If anything fails, we just keep the original URL
                if (isActive) setCachedSrc(imageUrl);
            }
        };

        cacheImage();

        return () => { isActive = false; };
    }, [imageUrl]);

    return { src: cachedSrc || imageUrl, isCached };
};
