export interface LeaveType {
    id: string;
    label: string;
    category: 'annual' | 'paid' | 'unpaid' | 'sick';
    defaultDays?: number;
    description?: string;
}

export const LEAVE_CATEGORIES = {
    annual: "Yıllık İzin",
    paid: "Ücretli İzin",
    unpaid: "Ücretsiz İzin",
    sick: "Rapor/Hastalık"
} as const;

export const LEAVE_TYPES: LeaveType[] = [
    { id: "annual", label: "Yıllık İzin", category: "annual" },
    { id: "sick", label: "Rapor/Hastalık", category: "sick" },
    { id: "unpaid", label: "Ücretsiz İzin", category: "unpaid" },

    // 4857 Sayılı Kanun Kapsamındaki Ücretli İzinler
    { id: "4857_marriage", label: "4857 - Evlenme İzni (3 gün)", category: "paid", defaultDays: 3 },
    { id: "4857_adoption", label: "4857 - Evlat Edinme (3 gün)", category: "paid", defaultDays: 3 },
    { id: "4857_death", label: "4857 - Ölüm (3 gün) (Ana/Baba/Eş/Kardeş/Çocuk)", category: "paid", defaultDays: 3 },
    { id: "4857_birth", label: "4857 - Doğum / Babalık (5 gün)", category: "paid", defaultDays: 5 },
    { id: "4857_disability", label: "4857 - Engelli Süreğen Hastalık (10 gün)", category: "paid", defaultDays: 10 },

    // KHK375 Kapsamındaki Ücretli İzinler
    { id: "khk375_marriage", label: "KHK375 - Evlenme (5 gün)", category: "paid", defaultDays: 5 },
    { id: "khk375_death_family", label: "KHK375 - Ölüm (6 gün) (Eş/Çocuk)", category: "paid", defaultDays: 6 },
    { id: "khk375_death_parents", label: "KHK375 - Ölüm (5 gün) (Ana/Baba/Kardeş)", category: "paid", defaultDays: 5 },
    { id: "khk375_death_inlaws", label: "KHK375 - Ölüm (2 gün) (Kayın Peder/Kayınnana)", category: "paid", defaultDays: 2 },
    { id: "khk375_birth", label: "KHK375 - Doğum (5 gün)", category: "paid", defaultDays: 5 },
    { id: "khk375_disaster", label: "KHK375 - Tabii Afet (10 gün)", category: "paid", defaultDays: 10 },
];

export function getLeaveTypeById(id: string) {
    return LEAVE_TYPES.find(t => t.id === id);
}

export function getLeaveLabel(id: string) {
    const type = getLeaveTypeById(id);
    if (!type) return id;

    return type.label;
}

export function getCategoryLabel(category: keyof typeof LEAVE_CATEGORIES) {
    return LEAVE_CATEGORIES[category];
}
