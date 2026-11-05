
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();

export const shareFile = async (fileName: string, base64Data: string, mimeType: string, title: string, text?: string) => {
  try {
    // 1. Write file to cache directory
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Cache,
    });

    // 2. Share the file
    // Some apps handle text + file better than others.
    // For WhatsApp specifically, if we want to share an image with a caption, sharing both 'text' and 'files' often works,
    // but sometimes it sends just the file or just the text depending on the platform implementation or target app.
    // However, for a generic share sheet, providing both is the standard way.

    const shareOptions: any = {
      title: title,
      files: [savedFile.uri],
    };

    if (text && text.trim().length > 0) {
      shareOptions.text = text;
    }

    await Share.share(shareOptions);

    return true;
  } catch (error) {
    console.error("Error sharing file:", error);
    return false;
  }
};

export const downloadOrShare = async (
  fileName: string,
  data: string | Blob,
  mimeType: string,
  title: string,
  text?: string
) => {
  if (isNative) {
    let base64 = "";
    if (typeof data === 'string') {
      // Assume it's a string content (like JSON) -> encode to base64
      // But wait, if it's already a base64 string? We need to be careful.
      // For JSON export: data is the JSON string.
      base64 = btoa(unescape(encodeURIComponent(data)));
    } else if (data instanceof Blob) {
      // Blob to Base64
      base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result as string;
          // remove "data:application/pdf;base64," prefix
          resolve(res.split(',')[1]);
        };
        reader.readAsDataURL(data);
      }) as string;
    }

    await shareFile(fileName, base64, mimeType, title, text);
  } else {
    // Web Fallback
    const blob = typeof data === 'string' ? new Blob([data], { type: mimeType }) : data;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

export const saveToDocuments = async (
  fileName: string,
  data: string | Blob,
  title: string
) => {
  try {
    let base64 = "";
    if (typeof data === 'string') {
      // Check if already base64 (simple check) or assume needs encoding
      // For JSON backup, it is a raw string.
      base64 = btoa(unescape(encodeURIComponent(data)));
    } else if (data instanceof Blob) {
      base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result as string;
          resolve(res.split(',')[1]);
        };
        reader.readAsDataURL(data);
      }) as string;
    }

    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Documents,
      recursive: true
    });

    // Show a native Toast or Alert to confirm save
    // Using custom event for the React Toast component
    window.dispatchEvent(new CustomEvent('abhi-ledger-toast', {
      detail: {
        message: `File saved to Documents:\n${fileName}`,
        type: 'success',
        duration: 4000
      }
    }));
    return true;

  } catch (error) {
    console.error("Save to Documents failed:", error);
    window.dispatchEvent(new CustomEvent('abhi-ledger-toast', {
      detail: {
        message: "Failed to save file. Check permissions.",
        type: 'error'
      }
    }));
    return false;
  }
};
