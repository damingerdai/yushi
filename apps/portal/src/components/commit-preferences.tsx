"use client";
import { createContext, type ReactNode, useContext, useState } from "react";

type CommitPreferences = {
  type: string;
  scope: string;
  footer: string;
  setType: (value: string) => void;
  setScope: (value: string) => void;
  setFooter: (value: string) => void;
};

const PreferencesContext = createContext<CommitPreferences | null>(null);
export function CommitPreferencesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [type, setType] = useState("");
  const [scope, setScope] = useState("");
  const [footer, setFooter] = useState("");
  return (
    <PreferencesContext.Provider
      value={{ type, scope, footer, setType, setScope, setFooter }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}
export function useCommitPreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error("CommitPreferencesProvider is missing");
  return context;
}
