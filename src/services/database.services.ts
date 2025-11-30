
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import WebDatabaseService from './database.web';


export interface Configuracao {
  idConfiguracao: number;
  lembreteAtivo: number;
  horaLembrete: string;
  tema: string;
}

export interface StatusHumor {
  idStatusHumor: number;
  nome: string;
  cor: string;
  icone: string;
}

export interface Tag {
  idTag?: number;
  nome: string;
  cor?: string;
}

export interface RegistroHumor {
  idRegistroHumor?: number;
  texto?: string;
  data_hora: string;
  
  humores: string[];
  tags: string[];  
}


export interface CreateMoodEntryPayload {
  date?: string;
  humores: string[]; 
  tags: string[];  
  notes?: string;
  intensity?: number;
}

// Public interface describing the methods used by the app.
export interface IDatabaseService {
  init(): Promise<void>;
  createMoodEntry(payload: CreateMoodEntryPayload): Promise<any>;
  getAllMoodEntries(): Promise<any[]>;
  deleteAllMoodEntries(): Promise<boolean>;
  getMoodEntryById(id: number): Promise<any | null>;
  getMoodEntriesByDate(date: string): Promise<any[]>;
  updateMoodEntry(id: number, patch: { mood?: string; humores?: string[]; notes?: string; tags?: string[] } ): Promise<boolean>;
  getMoodStats(): Promise<{ total: number; mostCommonMood: string }>;
  close(): Promise<void>;
  createTag?(nome: string, cor?: string): Promise<number>;
  getConfiguracaoGlobal?(): Promise<Configuracao | null>;
  updateConfiguracaoGlobal?(config: Partial<Configuracao>): Promise<boolean>;
}



class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized: boolean = false;

  async init() {
    if (this.initialized) return;
    try {
      this.db = await SQLite.openDatabaseAsync('humor_app_global.db');
      await this.createTables();
      this.initialized = true;
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing database:', error);
      throw error;
    }
  }

  
  private async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync('PRAGMA foreign_keys = ON;');

    const queries = [
      
      `CREATE TABLE IF NOT EXISTS configuracao (
          idConfiguracao INTEGER PRIMARY KEY,
          lembreteAtivo INTEGER DEFAULT 1,
          horaLembrete TIME DEFAULT '08:00',
          tema TEXT DEFAULT 'dark'
      );`,
      `INSERT OR IGNORE INTO configuracao (idConfiguracao, lembreteAtivo, horaLembrete, tema) VALUES (1, 1, '08:00', 'dark');`,
      
      
      `CREATE TABLE IF NOT EXISTS statusHumor (
          idStatusHumor INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL UNIQUE,
          cor TEXT,
          icone TEXT
      );`,
      `INSERT OR IGNORE INTO statusHumor (nome, cor, icone) VALUES
      ('Calmo', '#87CEEB', '😌'), ('Feliz', '#FFD700', '😊'),
      ('Triste', '#6495ED', '😢'), ('Bravo', '#FF4500', '😡'),
      ('Desapontado', '#B0C4DE', '😞'), ('Preocupado', '#FFA07A', '😟'),
      ('Assustado', '#8A2BE2', '😨'), ('Frustrado', '#A52A2A', '😣'),
      ('Estressado', '#FF6347', '😫');`,
      
      
      `CREATE TABLE IF NOT EXISTS tag (
          idTag INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL UNIQUE,
          cor TEXT DEFAULT '#CCCCCC'
      );`,
      
      
      `CREATE TABLE IF NOT EXISTS registroHumor (
          idRegistroHumor INTEGER PRIMARY KEY AUTOINCREMENT,
          texto TEXT,
          data_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE INDEX IF NOT EXISTS idx_registro_data ON registroHumor(data_hora);`,
      
      
      `CREATE TABLE IF NOT EXISTS registroStatus (
          idRegistroHumor INTEGER NOT NULL,
          idStatusHumor INTEGER NOT NULL,
          PRIMARY KEY (idRegistroHumor, idStatusHumor),
          FOREIGN KEY (idRegistroHumor) REFERENCES registroHumor(idRegistroHumor) ON DELETE CASCADE,
          FOREIGN KEY (idStatusHumor) REFERENCES statusHumor(idStatusHumor) ON DELETE RESTRICT
      );`,
      
     
      `CREATE TABLE IF NOT EXISTS registroTag (
          idRegistroHumor INTEGER NOT NULL,
          idTag INTEGER NOT NULL,
          PRIMARY KEY (idRegistroHumor, idTag),
          FOREIGN KEY (idRegistroHumor) REFERENCES registroHumor(idRegistroHumor) ON DELETE CASCADE,
          FOREIGN KEY (idTag) REFERENCES tag(idTag) ON DELETE CASCADE
      );`,
    ];

    for (const query of queries) {
      await this.db.execAsync(query);
    }
  }

  async createTag(nome: string, cor?: string): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.runAsync(
        'INSERT OR IGNORE INTO tag (nome, cor) VALUES (?, ?)',
        [nome, cor || '#CCCCCC']
    );
    return result.lastInsertRowId;
  }

  
  async createMoodEntry(payload: CreateMoodEntryPayload): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    const db = this.db!;
    let output: any = null;

    
    await db.withTransactionAsync(async () => {
      const dateStr = payload.date ? (payload.date.length > 10 ? payload.date : payload.date + ' 00:00:00') : new Date().toISOString();

      
      const registroResult = await db.runAsync(
        'INSERT INTO registroHumor (texto, data_hora) VALUES (?, ?)',
        [payload.notes || null, dateStr]
      );
      const idRegistroHumor = registroResult.lastInsertRowId;

      
      if (payload.humores && payload.humores.length > 0) { 
        const statusIds = await db.getAllAsync<{ idStatusHumor: number }>(
          `SELECT idStatusHumor FROM statusHumor WHERE nome IN (${payload.humores.map(() => '?').join(',')})`, // <-- ALTERADO: de 'moods' para 'humores'
          payload.humores 
        );
        for (const statusId of statusIds) {
          await db.runAsync(
            'INSERT INTO registroStatus (idRegistroHumor, idStatusHumor) VALUES (?, ?)',
            [idRegistroHumor, statusId.idStatusHumor]
          );
        }
      }
        
      
      if (payload.tags && payload.tags.length > 0) {
        
        for (const tagName of payload.tags) {
          await this.createTag(tagName); 
        }
            
       
        const tagIds = await db.getAllAsync<{ idTag: number }>(
          `SELECT idTag FROM tag WHERE nome IN (${payload.tags.map(() => '?').join(',')})`,
          payload.tags
        );
        for (const tagId of tagIds) {
          await db.runAsync(
            'INSERT INTO registroTag (idRegistroHumor, idTag) VALUES (?, ?)',
            [idRegistroHumor, tagId.idTag]
          );
        }
      }

      
      output = {
        id: idRegistroHumor,
        date: dateStr,
        humores: payload.humores, 
        tags: payload.tags,
        notes: payload.notes ?? null,
      };
    });
    
    return output;
  }

 
  async getAllMoodEntries(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      SELECT 
          r.idRegistroHumor AS id, 
          r.data_hora AS date, 
          r.texto AS notes,
          GROUP_CONCAT(s.nome) AS humoresNomes, -- <-- ALTERADO: de 'statusNomes' para 'humoresNomes'
          GROUP_CONCAT(t.nome) AS tagsNomes
      FROM registroHumor r
      LEFT JOIN registroStatus rs ON r.idRegistroHumor = rs.idRegistroHumor
      LEFT JOIN statusHumor s ON rs.idStatusHumor = s.idStatusHumor
      LEFT JOIN registroTag rt ON r.idRegistroHumor = rt.idRegistroHumor
      LEFT JOIN tag t ON rt.idTag = t.idTag
      GROUP BY r.idRegistroHumor
      ORDER BY r.data_hora DESC
    `;

    const result = await this.db.getAllAsync<any>(query);
    
    // Processamento de GROUP_CONCAT para retornar arrays
    return result.map(row => ({
      ...row,
      humoresNomes: row.humoresNomes ? row.humoresNomes.split(',') : [], 
      tagsNomes: row.tagsNomes ? row.tagsNomes.split(',') : [],
      
      humores: row.humoresNomes ? row.humoresNomes.split(',') : [], 
      tags: row.tagsNomes ? row.tagsNomes.split(',') : [],
      
    }));
  }

  
  async deleteAllMoodEntries(): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.runAsync('DELETE FROM registroHumor');
    return result.changes > 0;
  }
  
  
  async getConfiguracaoGlobal(): Promise<Configuracao | null> {
    if (!this.db) throw new Error('Database not initialized');
    const config = await this.db.getFirstAsync<Configuracao>('SELECT * FROM configuracao WHERE idConfiguracao = 1');
    return config || null;
  }

  async updateConfiguracaoGlobal(config: Partial<Configuracao>): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    
    const fields: string[] = [];
    const values: any[] = [];
    
    if (config.lembreteAtivo !== undefined) { fields.push('lembreteAtivo = ?'); values.push(config.lembreteAtivo); }
    if (config.horaLembrete !== undefined) { fields.push('horaLembrete = ?'); values.push(config.horaLembrete); }
    if (config.tema !== undefined) { fields.push('tema = ?'); values.push(config.tema); }
    
    if (fields.length === 0) return false;
    
    const result = await this.db.runAsync(
      `UPDATE configuracao SET ${fields.join(', ')} WHERE idConfiguracao = 1`,
      values
    );

    return result.changes > 0;
  }

  
  async getMoodEntryById(id: number): Promise<any | null> {
    if (!this.db) throw new Error('Database not initialized');
    const db = this.db!;
    const query = `
      SELECT r.idRegistroHumor AS id, r.data_hora AS date, r.texto AS notes,
             GROUP_CONCAT(s.nome) AS humoresNomes, -- <-- ALTERADO
             GROUP_CONCAT(t.nome) AS tagsNomes
      FROM registroHumor r
      LEFT JOIN registroStatus rs ON r.idRegistroHumor = rs.idRegistroHumor
      LEFT JOIN statusHumor s ON rs.idStatusHumor = s.idStatusHumor
      LEFT JOIN registroTag rt ON r.idRegistroHumor = rt.idRegistroHumor
      LEFT JOIN tag t ON rt.idTag = t.idTag
      WHERE r.idRegistroHumor = ?
      GROUP BY r.idRegistroHumor
      LIMIT 1
    `;
    const row = await db.getFirstAsync<any>(query, [id]);
    if (!row) return null;
    return {
      ...row,
      humores: row.humoresNomes ? row.humoresNomes.split(',') : [], 
      tags: row.tagsNomes ? row.tagsNomes.split(',') : [],
      
    };
  }

 
  async getMoodEntriesByDate(date: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    const db = this.db!;
    const query = `
      SELECT r.idRegistroHumor AS id, r.data_hora AS date, r.texto AS notes,
             GROUP_CONCAT(s.nome) AS humoresNomes, -- <-- ALTERADO
             GROUP_CONCAT(t.nome) AS tagsNomes
      FROM registroHumor r
      LEFT JOIN registroStatus rs ON r.idRegistroHumor = rs.idRegistroHumor
      LEFT JOIN statusHumor s ON rs.idStatusHumor = s.idStatusHumor
      LEFT JOIN registroTag rt ON r.idRegistroHumor = rt.idRegistroHumor
      LEFT JOIN tag t ON rt.idTag = t.idTag
      WHERE date(r.data_hora) = ?
      GROUP BY r.idRegistroHumor
      ORDER BY r.data_hora DESC
    `;
    const rows = await db.getAllAsync<any>(query, [date]);
    return rows.map(row => ({
      ...row,
      humores: row.humoresNomes ? row.humoresNomes.split(',') : [], 
      tags: row.tagsNomes ? row.tagsNomes.split(',') : [],
     
    }));
  }

  
  async updateMoodEntry(id: number, patch: { mood?: string; humores?: string[]; notes?: string; tags?: string[] }): Promise<boolean> { // <-- ALTERADO: de 'moods' para 'humores'
    if (!this.db) throw new Error('Database not initialized');
    const db = this.db!;
    let changed = false;

    if (patch.notes !== undefined) {
      const res = await db.runAsync('UPDATE registroHumor SET texto = ? WHERE idRegistroHumor = ?', [patch.notes, id]);
      if (res.changes > 0) changed = true;
    }

    
    const newHumores = patch.humores ?? (patch.mood ? [patch.mood] : undefined); 
    if (newHumores !== undefined) {
      await db.runAsync('DELETE FROM registroStatus WHERE idRegistroHumor = ?', [id]);
      if (newHumores.length) {
        const statusIds = await db.getAllAsync<{ idStatusHumor: number }>(`SELECT idStatusHumor FROM statusHumor WHERE nome IN (${newHumores.map(() => '?').join(',')})`, newHumores); // <-- ALTERADO: de 'newMoods' para 'newHumores'
        for (const s of statusIds) await db.runAsync('INSERT INTO registroStatus (idRegistroHumor, idStatusHumor) VALUES (?, ?)', [id, s.idStatusHumor]);
      }
      changed = true;
    }

    
    if (patch.tags !== undefined) {
      await db.runAsync('DELETE FROM registroTag WHERE idRegistroHumor = ?', [id]);
      if (patch.tags.length) {
        for (const tagName of patch.tags) await this.createTag(tagName);
        const tagIds = await db.getAllAsync<{ idTag: number }>(`SELECT idTag FROM tag WHERE nome IN (${patch.tags.map(() => '?').join(',')})`, patch.tags);
        for (const t of tagIds) await db.runAsync('INSERT INTO registroTag (idRegistroHumor, idTag) VALUES (?, ?)', [id, t.idTag]);
      }
      changed = true;
    }

    return changed;
  }
  
  
  async getMoodStats(): Promise<{ total: number; mostCommonMood: string }> { 
    if (!this.db) throw new Error('Database not initialized');

    const total = await this.db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM registroHumor');
    const mostCommon = await this.db.getFirstAsync<{ nome: string }>(
      `SELECT s.nome FROM registroStatus rs JOIN statusHumor s ON rs.idStatusHumor = s.idStatusHumor GROUP BY s.nome ORDER BY COUNT(rs.idRegistroHumor) DESC LIMIT 1`
    );

    return { total: total?.count || 0, mostCommonMood: mostCommon?.nome || 'N/A' };
  }
  
 

  async close() {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.initialized = false;
      console.log('✅ Database closed');
    }
  }
}



export const databaseService: IDatabaseService =
  Platform.OS === 'web' ? (new (WebDatabaseService as any)() as IDatabaseService) : (new DatabaseService() as IDatabaseService);