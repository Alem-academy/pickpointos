
export interface Employee {
    id: string;
    fullName: string;
    email?: string;
    phone: string;
    role: 'admin' | 'hr' | 'rf' | 'employee';
    status: 'new' | 'review' | 'revision' | 'signing' | 'active' | 'fired';
    pvzId?: string;
    position: string;
    baseRate?: number;
    hiredAt: string;
    firedAt?: string;
}

export interface PvzPoint {
    id: string;
    name: string;
    address: string;
    regionId: string;
    brand: string;
}

const MOCK_PVZ_POINTS: PvzPoint[] = [
    { id: 'pvz-1', name: 'ПВЗ Абая 45', address: 'г. Алматы, пр. Абая, д. 45', regionId: 'ALA', brand: 'Wildberries' },
    { id: 'pvz-2', name: 'ПВЗ Кабанбай Батыра 88', address: 'г. Астана, ул. Кабанбай Батыра, д. 88', regionId: 'AST', brand: 'Wildberries' },
    { id: 'pvz-3', name: 'ПВЗ Сатпаева 12', address: 'г. Шымкент, ул. Сатпаева, д. 12', regionId: 'SHY', brand: 'Wildberries' },
    { id: 'pvz-4', name: 'ПВЗ Независимости 33', address: 'г. Караганда, пр. Независимости, д. 33', regionId: 'KAR', brand: 'Wildberries' },
    { id: 'pvz-5', name: 'ПВЗ Достык 7', address: 'г. Актобе, ул. Достык, д. 7', regionId: 'AKT', brand: 'Wildberries' },
];

const MOCK_EMPLOYEES: Employee[] = [
    { id: 'emp-1', fullName: 'Нұрсұлтан Әлімов', phone: '+7 (701) 123-45-67', role: 'employee', status: 'active', pvzId: 'pvz-1', position: 'Кладовщик', baseRate: 350000, hiredAt: '2023-01-15T00:00:00Z' },
    { id: 'emp-2', fullName: 'Айдар Бекболатов', phone: '+7 (702) 234-56-78', role: 'rf', status: 'active', pvzId: 'pvz-1', position: 'Управляющий', baseRate: 550000, hiredAt: '2022-11-20T00:00:00Z' },
    { id: 'emp-3', fullName: 'Гүлнар Сапарова', phone: '+7 (705) 345-67-89', role: 'employee', status: 'active', pvzId: 'pvz-2', position: 'Кассир', baseRate: 320000, hiredAt: '2023-03-10T00:00:00Z' },
    { id: 'emp-4', fullName: 'Ержан Қайратов', phone: '+7 (707) 456-78-90', role: 'employee', status: 'active', pvzId: 'pvz-2', position: 'Грузчик', baseRate: 380000, hiredAt: '2023-02-05T00:00:00Z' },
    { id: 'emp-5', fullName: 'Асель Нұрланова', phone: '+7 (708) 567-89-01', role: 'rf', status: 'active', pvzId: 'pvz-3', position: 'Управляющий', baseRate: 550000, hiredAt: '2023-01-01T00:00:00Z' },
    { id: 'emp-6', fullName: 'Дәурен Төлеуов', phone: '+7 (701) 678-90-12', role: 'employee', status: 'active', pvzId: 'pvz-3', position: 'Кладовщик', baseRate: 350000, hiredAt: '2023-04-12T00:00:00Z' },
    { id: 'emp-7', fullName: 'Жанар Әбдіқалықова', phone: '+7 (702) 789-01-23', role: 'employee', status: 'fired', pvzId: 'pvz-1', position: 'Кассир', baseRate: 320000, hiredAt: '2022-08-15T00:00:00Z', firedAt: '2023-09-20T00:00:00Z' },
    { id: 'emp-8', fullName: 'Бауыржан Мұратов', phone: '+7 (705) 890-12-34', role: 'employee', status: 'active', pvzId: 'pvz-4', position: 'Грузчик', baseRate: 380000, hiredAt: '2023-05-20T00:00:00Z' },
    { id: 'emp-9', fullName: 'Әйгерім Сағындықова', phone: '+7 (707) 901-23-45', role: 'employee', status: 'active', pvzId: 'pvz-4', position: 'Кассир', baseRate: 320000, hiredAt: '2023-06-01T00:00:00Z' },
    { id: 'emp-10', fullName: 'Серік Әмірханов', phone: '+7 (708) 012-34-56', role: 'rf', status: 'active', pvzId: 'pvz-2', position: 'Управляющий', baseRate: 550000, hiredAt: '2022-12-10T00:00:00Z' },
    { id: 'emp-11', fullName: 'Айнұр Сейітова', phone: '+7 (701) 111-22-33', role: 'employee', status: 'signing', pvzId: 'pvz-5', position: 'Кладовщик', baseRate: 350000, hiredAt: '2023-10-15T00:00:00Z' },
    { id: 'emp-12', fullName: 'Мақсат Берікболов', phone: '+7 (702) 222-33-44', role: 'employee', status: 'active', pvzId: 'pvz-5', position: 'Грузчик', baseRate: 380000, hiredAt: '2023-07-22T00:00:00Z' },
    { id: 'emp-13', fullName: 'Назерке Жұмабаева', phone: '+7 (705) 333-44-55', role: 'employee', status: 'active', pvzId: 'pvz-3', position: 'Кассир', baseRate: 320000, hiredAt: '2023-08-05T00:00:00Z' },
    { id: 'emp-14', fullName: 'Қанат Әбілдаев', phone: '+7 (707) 444-55-66', role: 'employee', status: 'review', pvzId: 'pvz-1', position: 'Кладовщик', baseRate: 350000, hiredAt: '2023-10-20T00:00:00Z' },
    { id: 'emp-15', fullName: 'Индира Досова', phone: '+7 (708) 555-66-77', role: 'employee', status: 'active', pvzId: 'pvz-2', position: 'Кассир', baseRate: 320000, hiredAt: '2023-09-10T00:00:00Z' },
];

export const hrService = {
    getEmployees: async (filters?: { status?: string; pvzId?: string; search?: string }): Promise<Employee[]> => {
        await new Promise(resolve => setTimeout(resolve, 800));

        let filtered = [...MOCK_EMPLOYEES];

        if (filters?.status) {
            filtered = filtered.filter(e => e.status === filters.status);
        }

        if (filters?.pvzId) {
            filtered = filtered.filter(e => e.pvzId === filters.pvzId);
        }

        if (filters?.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(e => e.fullName.toLowerCase().includes(search));
        }

        return filtered;
    },

    getEmployee: async (id: string): Promise<Employee | null> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_EMPLOYEES.find(e => e.id === id) || null;
    },

    getPvzPoints: async (): Promise<PvzPoint[]> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        return MOCK_PVZ_POINTS;
    },

    getPvzPoint: (id: string): PvzPoint | undefined => {
        return MOCK_PVZ_POINTS.find(p => p.id === id);
    },
};
