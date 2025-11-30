export interface StatusHumor {
  idStatusHumor: string; 
  nome: string; 
  cor: string;  
  icone: string; 
}

export interface Tag {
  id: string; 
  nome: string; 
  cor: string; 
}

export interface RecordFilters {
  humoresNames?: string[];     
  tagNames?: string[];         
  searchText?: string;         
  startDate?: Date;            
  endDate?: Date;             
}

export interface MoodEntry {
  id: number; 
  date: string; 
  notes: string | null; 
  humores: string[]; 
  tags: string[]; 
}

export const MOCK_STATUSES: StatusHumor[] = [
    { idStatusHumor: '1', nome: 'Calmo', cor: '#87CEEB', icone: '😌' },
    { idStatusHumor: '2', nome: 'Feliz', cor: '#FFD700', icone: '😊' },
    { idStatusHumor: '3', nome: 'Triste', cor: '#6495ED', icone: '😢' },
    { idStatusHumor: '4', nome: 'Bravo', cor: '#FF4500', icone: '😡' },
    { idStatusHumor: '5', nome: 'Desapontado', cor: '#B0C4DE', icone: '😞' },
    { idStatusHumor: '6', nome: 'Preocupado', cor: '#FFA07A', icone: '😟' },
    { idStatusHumor: '7', nome: 'Assustado', cor: '#8A2BE2', icone: '😨' },
    { idStatusHumor: '8', nome: 'Frustrado', cor: '#A52A2A', icone: '😣' },
    { idStatusHumor: '9', nome: 'Estressado', cor: '#FF6347', icone: '😫' },
];

export const MOCK_TAGS: Tag[] = [
    { id: 't1', nome: 'Trabalho', cor: '#007AFF' },
    { id: 't2', nome: 'Família', cor: '#34C759' },
    { id: 't3', nome: 'Hobby', cor: '#FF9500' },
];

// trocar pela logica do bd 
export const MOCK_RECORDS: MoodEntry[] = [
    {
        id: 1,
        humores: ['Feliz', 'Calmo'],
        notes: 'Dia de lançamento, tudo ocorreu perfeitamente e sem estresse, graças ao planejamento.',
        date: '2025-11-30 10:00:00',
        tags: ['Trabalho', 'Hobby'],
    },
    {
        id: 2,
        humores: ['Estressado'],
        notes: 'Prazo apertado e reunião de última hora. Preciso de uma pausa longa.',
        date: '2025-11-29 15:30:00',
        tags: ['Trabalho'],
    },
    {
        id: 3,
        humores: ['Calmo'],
        notes: 'Tarde no parque com a família, lendo um bom livro e relaxando.',
        date: '2025-11-28 18:00:00',
        tags: ['Família'],
    },
    {
        id: 4,
        humores: ['Triste'],
        notes: 'Notícias ruins na TV, o mundo está complicado.',
        date: '2025-11-27 08:00:00',
        tags: [],
    },
];