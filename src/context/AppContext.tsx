import * as React from 'react';
import { createContext, useCallback, useContext, useState, ReactNode } from 'react';

interface IAppContext {
  selectedProcessId: number | null;
  selectedProcessCode: string | null;
  setSelectedProcess: (id: number | null, code: string | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const AppContext = createContext<IAppContext | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }): React.ReactElement => {
  const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null);
  const [selectedProcessCode, setSelectedProcessCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const setSelectedProcess = useCallback((id: number | null, code: string | null): void => {
    setSelectedProcessId(id);
    setSelectedProcessCode(code);
  }, []);

  return (
    <AppContext.Provider
      value={{
        selectedProcessId,
        selectedProcessCode,
        setSelectedProcess,
        isLoading,
        setIsLoading
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): IAppContext => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp phải được sử dụng trong AppProvider');
  }

  return context;
};
