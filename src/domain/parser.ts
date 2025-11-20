export const parseImportText = (text: string): { front: string; back: string }[] => {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0) // Pomiń puste linie
    .map(line => {
      // Obsługa różnych separatorów: =, -, :, lub tabulacja
      // Regex szuka pierwszego wystąpienia separatora
      const match = line.match(/[:=\-\t]+/);
      
      if (!match || match.index === undefined) {
        return null; // Linia bez separatora 
      }

      const separatorIndex = match.index;
      const front = line.substring(0, separatorIndex).trim();
      const back = line.substring(separatorIndex + match[0].length).trim();

      return { front, back };
    })
    .filter((item): item is { front: string; back: string } => 
      item !== null && item.front.length > 0 && item.back.length > 0
    );
};