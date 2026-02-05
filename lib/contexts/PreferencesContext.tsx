import * as React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface UserPreferences {
  defaultSize: string | null;
  defaultDeviceModel: string | null;
  notificationOrderUpdates: boolean;
  notificationNewDrops: boolean;
  notificationExclusiveOffers: boolean;
  notificationAccountActivity: boolean;
}

interface PreferencesContextType {
  preferences: UserPreferences;
  isLoading: boolean;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
}

const PreferencesContext = React.createContext<PreferencesContextType | undefined>(undefined);

const PREFERENCES_KEY = "@beatrackfam:user_preferences";

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = React.useState<UserPreferences>({
    defaultSize: null,
    defaultDeviceModel: null,
    notificationOrderUpdates: true,
    notificationNewDrops: true,
    notificationExclusiveOffers: false,
    notificationAccountActivity: true,
  });
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(PREFERENCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<UserPreferences>;
        setPreferences((current) => ({
          ...current,
          ...parsed,
        }));
      }
    } catch (error) {
      console.error("Failed to load preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (prefs: Partial<UserPreferences>) => {
    try {
      const newPreferences = { ...preferences, ...prefs };
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(newPreferences));
      setPreferences(newPreferences);
    } catch (error) {
      console.error("Failed to save preferences:", error);
      throw error;
    }
  };

  return (
    <PreferencesContext.Provider value={{ preferences, isLoading, updatePreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = React.useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return context;
}
