import { useState } from 'react';

// Hook genérico usado pra persistir a key/modelo da OpenAI do chat de IA —
// mesmas chaves de localStorage do app original (nebula_openai_*).
export function useLocalStorageState(key: string, defaultValue: string) {
  const [value, setValue] = useState<string>(() => {
    try {
      return localStorage.getItem(key) || defaultValue;
    } catch {
      return defaultValue;
    }
  });

  function setAndPersist(next: string) {
    setValue(next);
    try {
      localStorage.setItem(key, next);
    } catch {
      // localStorage indisponível (modo privado/quota) — segue só em memória.
    }
  }

  return [value, setAndPersist] as const;
}
