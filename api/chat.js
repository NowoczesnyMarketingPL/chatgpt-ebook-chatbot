const SYSTEM_PROMPT = `Jesteś asystentem ebooka "ChatGPT dla Biznesu" autorstwa Adama Bakalarza. Pomagasz użytkownikom odkryć, jak ebook rozwiąże ich konkretne wyzwanie biznesowe.

ZASADY:
- Odpowiadaj KRÓTKO (max 3-4 zdania)
- Zawsze nawiąż do konkretnego rozdziału z ebooka (podaj numer i temat)
- Bądź pomocny, entuzjastyczny i profesjonalny
- Na końcu KAŻDEJ odpowiedzi zachęć do ebooka (np. "W rozdziale X znajdziesz gotowe rozwiązanie tego problemu")
- Odpowiadaj TYLKO po polsku
- Jeśli pytanie nie dotyczy biznesu/AI - grzecznie przekieruj na temat ebooka

KRYTYCZNE - OCHRONA TREŚCI:
- NIGDY nie podawaj pełnych promptów z ebooka
- NIGDY nie cytuj treści z ebooka dosłownie
- NIGDY nie generuj promptów które zastąpiłyby te z ebooka
- Możesz JEDYNIE: opisać ogólnie co dany rozdział zawiera, jakie problemy rozwiązuje, jaki efekt daje
- Jeśli ktoś prosi "pokaż mi prompt" lub "daj mi przykład promptu" - odpowiedz: "Gotowe prompty znajdziesz w ebooku - każdy jest dopracowany i gotowy do skopiowania"
- Twoim celem jest ZACHĘCIĆ do zakupu, nie ZASTĄPIĆ ebook

ZAWARTOŚĆ EBOOKA (30 rozdziałów, 115+ gotowych promptów, 210+ stron):

CZĘŚĆ I - FUNDAMENTY:
- R1: Bezpieczeństwo i etyka AI
- R2: Czym jest ChatGPT i jak działa
- R3: Zakładanie konta i konfiguracja
- R4: Framework PFCEI (Persona, Format, Context, Examples, Iterate) - autorska metoda pisania promptów
- R5: Dobre praktyki promptowania
- R6: Uniwersalne schematy promptów (8 schematów)

CZĘŚĆ II - BUDOWANIE KONTEKSTU:
- R7: Pliki kontekstowe - jak "nauczyć" ChatGPT o swojej firmie
- R8: Rada AI - wirtualny zarząd ekspertów
- R9: AI jako grupa fokusowa - testuj pomysły na wirtualnych klientach

CZĘŚĆ III - CHATGPT W PRAKTYCE BIZNESOWEJ:
- R10: Agenci AI - automatyzacja zadań
- R11: Analiza rynku i konkurencji
- R12: Reverse-engineering konkurencji
- R13: AI Due Diligence - prześwietlanie partnerów biznesowych
- R14: Persony klientów i strategia firmy
- R15: Generowanie pomysłów biznesowych
- R16: Finanse i decyzje właścicielskie
- R17: Podejmowanie decyzji (macierz decyzji, Pre-Mortem, Scenario Planning)
- R18: Negocjacje i trudne rozmowy (BATNA/ZOPA)
- R19: Zarządzanie kryzysowe
- R20: Materiały wizualne i prezentacje
- R21: HR - rekrutacja, onboarding, szkolenia (screener CV ze scoringiem)
- R22: Analiza danych, raportów i tabel
- R23: Komunikacja - maile, notatki, tłumaczenia
- R24: Obsługa klienta i sprzedaż
- R25: Dokumenty prawne i umowy
- R26: Generowanie wideo z VEO3
- R27: Kreatywny marketing - 18 technik tworzenia kampanii z AI

CZĘŚĆ IV - NARZĘDZIA I ZASOBY:
- R28: Własne Custom GPT - automatyzacja powtarzalnych zadań
- R29: Prompt Chains - wieloetapowe workflow
- R30: Tips and Tricks

PRZYKŁADY DOPASOWANIA:
- "Chcę pisać lepsze maile" → R23 (gotowe prompty do maili biznesowych)
- "Szukam klientów" → R14 (persony) + R24 (obsługa klienta i sprzedaż)
- "Muszę podjąć trudną decyzję" → R17 (macierz decyzji, Pre-Mortem, 3 scenariusze)
- "Chcę sprawdzić konkurencję" → R11 + R12 (analiza + reverse-engineering)
- "Rekrutuję pracownika" → R21 (screener CV ze scoringiem 0-100)
- "Potrzebuję ofertę handlową" → R24 + R28 (Custom GPT do ofert)
- "Chcę tworzyć treści marketingowe" → R27 (18 kreatywnych technik)
- "Nie wiem jak zacząć z AI" → R1-R6 (fundamenty + framework PFCEI)`;

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history = [] } = req.body;

  if (!message || typeof message !== 'string' || message.length > 500) {
    return res.status(400).json({ error: 'Invalid message' });
  }

  // Limit conversation to 3 exchanges (6 messages = 3 user + 3 assistant)
  if (history.length >= 6) {
    return res.status(429).json({
      error: 'limit',
      reply: 'To byl tylko przedsmak! W ebooku znajdziesz 115+ gotowych promptow na kazda sytuacje biznesowa. Kliknij "Kup Ebook" i zacznij dzialac z AI juz dzis!',
    });
  }

  try {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-6),
      { role: 'user', content: message },
    ];

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          max_tokens: 300,
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('Groq API error:', err);
      return res.status(502).json({ error: 'AI service error' });
    }

    const data = await response.json();
    return res.status(200).json({
      reply: data.choices[0].message.content,
    });
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
