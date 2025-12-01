//mock e bd

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

const TAGS_MAP: { [key: string]: Tag } = {
    Trabalho: { id: 't1', nome: 'Trabalho', cor: '#007AFF' },
    Família: { id: 't2', nome: 'Família', cor: '#34C759' },
    Hobby: { id: 't3', nome: 'Hobby', cor: '#FF9500' },
    Reunião: { id: 't4', nome: 'Reunião', cor: '#5856D6' },
    Academia: { id: 't5', nome: 'Academia', cor: '#FF2D55' },
};
export const MOCK_TAGS: Tag[] = Object.values(TAGS_MAP);

export const getAllAvailableTags = async (): Promise<Tag[]> => {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_TAGS), 50));
};

export const MOCK_RECORDS: MoodEntry[] = [
    {
        id: 1,
        humores: ['Feliz', 'Calmo'],
        notes: 'Dia de lançamento, tudo ocorreu perfeitamente e sem estresse, graças ao planejamento.',
        date: '2025-11-30 10:00:00',
        tags: [TAGS_MAP.Trabalho.nome, TAGS_MAP.Hobby.nome], 
    },
    {
        id: 2,
        humores: ['Estressado'],
        notes: 'Prazo apertado e reunião de última hora. Preciso de uma pausa longa.',
        date: '2025-11-29 15:30:00',
        tags: [TAGS_MAP.Trabalho.nome, TAGS_MAP.Reunião.nome], 
    },
    {
        id: 3,
        humores: ['Calmo'],
        notes: 'Tarde no parque com a família, lendo um bom livro e relaxando.',
        date: '2025-11-28 18:00:00',
        tags: [TAGS_MAP.Família.nome],
    },
    {
        id: 4,
        humores: ['Triste', 'Desapontado'],
        notes: 'Notícias ruins na TV. Me senti melancólico.',
        date: '2025-11-27 08:00:00',
        tags: [TAGS_MAP.Academia.nome],
    },
    {
        id: 5,
        humores: ['Triste', 'Cansado'],
        notes: 'Treino pesado na academia e problema familiar não resolvido.',
        date: '2025-11-26 12:00:00',
        tags: [TAGS_MAP.Trabalho.nome, TAGS_MAP.Família.nome, TAGS_MAP.Academia.nome], 
    },
    {
        id: 6,
        humores: ['Feliz'],
        notes: 'Dia tranquilo, sem estresse.',
        date: '2025-11-25 10:00:00',
        tags: [],
    },
];