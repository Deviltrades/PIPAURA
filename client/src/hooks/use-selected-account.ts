import { useState, useEffect } from "react";

const STORAGE_KEY = "tj-selected-account";

export function useSelectedAccount() {
  const [selectedAccount, setSelectedAccount] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved || "all";
    }
    return "all";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, selectedAccount);
  }, [selectedAccount]);

  return [selectedAccount, setSelectedAccount] as const;
}
