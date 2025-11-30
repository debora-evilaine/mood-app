
export interface CreateMoodEntryPayloadWeb {
  date?: string;
  humores: string[];
  tags: string[];
  notes?: string;
  intensity?: number;
}

function nowIso() {
  return new Date().toISOString();
}

const STORAGE_KEY = 'mood_app_web_db_v1';

interface WebDB {
  entries: any[];
  statuses: string[];
  tags: string[];
}

function load(): WebDB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const db: WebDB = { entries: [], statuses: ['Calmo','Feliz','Triste','Bravo','Desapontado','Preocupado','Assustado','Frustrado','Estressado'], tags: [] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
      return db;
    }
    return JSON.parse(raw) as WebDB;
  } catch (e) {
    const db: WebDB = { entries: [], statuses: ['Calmo','Feliz','Triste','Bravo','Desapontado','Preocupado','Assustado','Frustrado','Estressado'], tags: [] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    return db;
  }
}

function save(db: WebDB) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export class WebDatabaseService {
  private db: WebDB | null = null;
  private nextId = 1;

  async init() {
    if (this.db) return;
    this.db = load();
    // compute nextId
    const max = this.db.entries.reduce((m, e) => (e.id > m ? e.id : m), 0);
    this.nextId = max + 1;
  }

  async createMoodEntry(payload: CreateMoodEntryPayloadWeb) {
    if (!this.db) await this.init();
    const id = this.nextId++;
    const date = payload.date ? payload.date : nowIso();
    const entry = {
      id,
      date,
      humores: payload.humores || [],
      tags: payload.tags || [],
      notes: payload.notes ?? null,
      intensity: payload.intensity ?? null,
    };
    this.db!.entries.unshift(entry);
    
    for (const t of entry.tags) if (!this.db!.tags.includes(t)) this.db!.tags.push(t);
    save(this.db!);
    return entry;
  }

  async getAllMoodEntries() {
    if (!this.db) await this.init();
    return this.db!.entries.slice();
  }

  async deleteAllMoodEntries() {
    if (!this.db) await this.init();
    const had = this.db!.entries.length > 0;
    this.db!.entries = [];
    save(this.db!);
    return had;
  }

  async getMoodEntryById(id: number) {
    if (!this.db) await this.init();
    return this.db!.entries.find((e) => e.id === id) ?? null;
  }

  async getMoodEntriesByDate(date: string) {
    if (!this.db) await this.init();
    return this.db!.entries.filter((e) => e.date.startsWith(date));
  }

  async updateMoodEntry(id: number, patch: { mood?: string; humores?: string[]; notes?: string; tags?: string[] }) {
    if (!this.db) await this.init();
    const idx = this.db!.entries.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    const item = this.db!.entries[idx];
    if (patch.notes !== undefined) item.notes = patch.notes;
    if (patch.humores !== undefined) item.humores = patch.humores;
    if (patch.mood !== undefined) item.humores = [patch.mood];
    if (patch.tags !== undefined) item.tags = patch.tags;
    
    for (const t of item.tags) if (!this.db!.tags.includes(t)) this.db!.tags.push(t);
    this.db!.entries[idx] = item;
    save(this.db!);
    return true;
  }

  async getMoodStats() {
    if (!this.db) await this.init();
    const total = this.db!.entries.length;
    const counts: Record<string, number> = {};
    for (const e of this.db!.entries) {
      const first = e.humores && e.humores.length ? e.humores[0] : 'N/A';
      counts[first] = (counts[first] || 0) + 1;
    }
    let most = 'N/A';
    let best = 0;
    for (const k of Object.keys(counts)) {
      if (counts[k] > best) {
        best = counts[k];
        most = k;
      }
    }
    return { total, mostCommonMood: most };
  }

  async close() {
    
    this.db = null;
  }
}

export default WebDatabaseService;
