
export const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const generateProfileId = (name: string, forceRandom: boolean = false) => {
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const prefix = (cleanName.slice(0, 3) || 'UNK').padEnd(3, 'X');
  
  let num;
  if (forceRandom) {
    // Generate purely random number for new contacts
    num = Math.floor(Math.random() * 900) + 100;
  } else {
    // Deterministic hash for migration of existing data so they don't change on reload
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    num = (hash % 900) + 100;
  }
  
  return `${prefix}-${num}`;
};

export const getYoutubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};
