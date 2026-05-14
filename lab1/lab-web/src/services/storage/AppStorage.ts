import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  setDoc,
  type Firestore,
} from "firebase/firestore";
import { APP_CONFIG } from "../../config";

type WithId = { id: string };
type CollectionKey =
  | "manageme_projects"
  | "manageme_stories"
  | "manageme_tasks"
  | "manageme_users"
  | "manageme_notifications"
  | "manageme_app_state";

const DATABASE_COLLECTIONS: CollectionKey[] = [
  "manageme_projects",
  "manageme_stories",
  "manageme_tasks",
  "manageme_users",
  "manageme_notifications",
  "manageme_app_state",
];

class AppStorage {
  private readonly mode = APP_CONFIG.dataStorageMode;
  private readonly cache = new Map<CollectionKey, WithId[]>();
  private readonly loaded = new Set<CollectionKey>();
  private readonly syncQueues = new Map<CollectionKey, Promise<void>>();
  private readonly syncErrors = new Map<CollectionKey, Error>();
  private db: Firestore | null = null;
  private initPromise: Promise<void> | null = null;

  initialize(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.initializeInternal();
    return this.initPromise;
  }

  getCollection<T extends WithId>(key: CollectionKey): T[] {
    if (this.mode === "database") {
      if (!this.loaded.has(key)) {
        throw new Error(
          "Storage provider nie zostal zainicjalizowany. Wywolaj appStorage.initialize() przed odczytem danych.",
        );
      }
      return [...((this.cache.get(key) ?? []) as T[])];
    }

    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }

    return JSON.parse(raw) as T[];
  }

  setCollection<T extends WithId>(key: CollectionKey, values: T[]): void {
    if (this.mode === "database") {
      const previousSnapshot = this.cache.get(key) ?? [];
      const snapshot = values.map((item) => ({ ...item })) as WithId[];
      this.cache.set(key, snapshot);
      this.loaded.add(key);
      this.enqueueSync(key, previousSnapshot, snapshot);
      return;
    }

    localStorage.setItem(key, JSON.stringify(values));
  }

  private async initializeInternal(): Promise<void> {
    if (this.mode === "localStorage") {
      return;
    }

    this.db = this.createFirestore();
    for (const collectionKey of DATABASE_COLLECTIONS) {
      const snapshot = await getDocs(collection(this.db, collectionKey));
      const values = snapshot.docs.map((entry) => ({
        id: entry.id,
        ...(entry.data() as Omit<WithId, "id">),
      })) as WithId[];

      if (values.length > 0) {
        this.cache.set(collectionKey, values);
        this.loaded.add(collectionKey);
        continue;
      }

      const localValues = this.getLocalCollection(collectionKey);
      if (localValues.length > 0) {
        this.cache.set(collectionKey, localValues);
        this.loaded.add(collectionKey);
        await this.syncCollection(collectionKey, [], localValues);
        continue;
      }

      this.cache.set(collectionKey, []);
      this.loaded.add(collectionKey);
    }
  }

  private createFirestore(): Firestore {
    const { apiKey, authDomain, projectId, appId } = APP_CONFIG.firebase;
    if (!apiKey || !authDomain || !projectId || !appId) {
      throw new Error(
        "Brak konfiguracji Firestore. Ustaw VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID i VITE_FIREBASE_APP_ID.",
      );
    }

    const app: FirebaseApp =
      getApps()[0] ??
      initializeApp({
        apiKey,
        authDomain,
        projectId,
        appId,
      });

    return getFirestore(app);
  }

  private async syncCollection(
    key: CollectionKey,
    previousValues: WithId[],
    values: WithId[],
  ): Promise<void> {
    if (!this.db) {
      return;
    }

    const previousIds = new Set(previousValues.map((item) => item.id));
    const nextIds = new Set(values.map((item) => item.id));
    const removedIds = [...previousIds].filter((id) => !nextIds.has(id));

    await Promise.all(
      removedIds.map((id) => deleteDoc(doc(this.db!, key, id))),
    );

    await Promise.all(
      values.map(({ id, ...payload }) =>
        setDoc(doc(this.db!, key, id), payload, { merge: false }),
      ),
    );
  }

  private enqueueSync(
    key: CollectionKey,
    previousValues: WithId[],
    values: WithId[],
  ): void {
    const previous = this.syncQueues.get(key) ?? Promise.resolve();
    const next = previous
      .catch(() => undefined)
      .then(() => this.syncCollection(key, previousValues, values))
      .then(() => {
        this.syncErrors.delete(key);
      })
      .catch((error) => {
        const normalized =
          error instanceof Error ? error : new Error(String(error));
        this.syncErrors.set(key, normalized);
        console.error(`Nie udalo sie zsynchronizowac kolekcji ${key}.`, error);
        throw normalized;
      });

    this.syncQueues.set(key, next);
  }

  async waitForIdle(): Promise<void> {
    if (this.mode !== "database") {
      return;
    }

    const queues = [...this.syncQueues.values()];
    await Promise.all(queues.map((queue) => queue.catch(() => undefined)));

    const error = [...this.syncErrors.values()][0];
    if (error) {
      this.syncErrors.clear();
      throw error;
    }
  }

  private getLocalCollection(key: CollectionKey): WithId[] {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter(
        (item): item is WithId =>
          typeof item === "object" &&
          item !== null &&
          "id" in item &&
          typeof (item as { id: unknown }).id === "string",
      );
    } catch {
      return [];
    }
  }
}

export const appStorage = new AppStorage();
