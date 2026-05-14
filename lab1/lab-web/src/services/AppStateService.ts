import { appStorage } from "./storage/AppStorage";

type AppStateEntry = {
  id: string;
  value: string;
};

const STORAGE_KEY = "manageme_app_state";

export class AppStateService {
  getValue(key: string): string | null {
    const entries = appStorage.getCollection<AppStateEntry>(STORAGE_KEY);
    const match = entries.find((entry) => entry.id === key);
    return match?.value ?? null;
  }

  setValue(key: string, value: string): void {
    const entries = appStorage.getCollection<AppStateEntry>(STORAGE_KEY);
    const index = entries.findIndex((entry) => entry.id === key);

    if (index >= 0) {
      entries[index] = { id: key, value };
    } else {
      entries.push({ id: key, value });
    }
    appStorage.setCollection(STORAGE_KEY, entries);
  }

  removeValue(key: string): void {
    const entries = appStorage.getCollection<AppStateEntry>(STORAGE_KEY);
    appStorage.setCollection(
      STORAGE_KEY,
      entries.filter((entry) => entry.id !== key),
    );
  }
}
