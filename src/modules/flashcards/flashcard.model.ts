import prisma from "../../lib/prisma";


// 🔹 Utwórz zestaw fiszek i dodaj karty
export async function createFlashcardSet(name: string, cards: { eng: string; pl: string }[]) {
  // Utworzenie nowego zestawu
  const set = await prisma.flashcardSet.create({
    data: { name },
  });

  // Dodanie fiszek do zestawu
  await prisma.flashcard.createMany({
    data: cards.map((card) => ({
      front: card.eng,
      back: card.pl,
      setId: set.id,
    })),
  });

  return { message: "Zaimportowano fiszki.", setId: set.id, count: cards.length };
}

// 🔹 Pobierz wszystkie zestawy z fiszkami
export async function getAllSets() {
  return prisma.flashcardSet.findMany({
    include: { cards: true },
    orderBy: { id: "desc" },
  });
}
