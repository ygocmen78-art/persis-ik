"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface GarnishmentFiltersProps {
    branches: { id: number; name: string }[];
    employees: { id: number; firstName: string; lastName: string }[];
}

export function GarnishmentFilters({ branches, employees }: GarnishmentFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const currentBranch = searchParams.get("branch") || "all";
    const currentYear = searchParams.get("year") || "all";
    const currentMonth = searchParams.get("month") || "all";
    const currentEmployee = searchParams.get("employee") || "all";

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value === "all") {
                params.delete(name);
            } else {
                params.set(name, value);
            }
            return params.toString();
        },
        [searchParams]
    );

    const onFilterChange = (key: string, value: string) => {
        router.push(pathname + "?" + createQueryString(key, value));
    };

    const currentSysYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => (currentSysYear - 2 + i).toString());

    const months = [
        { value: "1", label: "Ocak" },
        { value: "2", label: "Şubat" },
        { value: "3", label: "Mart" },
        { value: "4", label: "Nisan" },
        { value: "5", label: "Mayıs" },
        { value: "6", label: "Haziran" },
        { value: "7", label: "Temmuz" },
        { value: "8", label: "Ağustos" },
        { value: "9", label: "Eylül" },
        { value: "10", label: "Ekim" },
        { value: "11", label: "Kasım" },
        { value: "12", label: "Aralık" },
    ];

    return (
        <div className="flex flex-col sm:flex-row gap-2 mb-6 p-4 rounded-lg bg-muted/50 border">
            <div className="flex flex-1 items-center gap-2">
                <Select value={currentBranch} onValueChange={(val) => onFilterChange("branch", val)}>
                    <SelectTrigger className="w-[200px] bg-background">
                        <SelectValue placeholder="Tüm Şubeler" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tüm Şubeler</SelectItem>
                        {branches.map(b => (
                            <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={currentYear} onValueChange={(val) => onFilterChange("year", val)}>
                    <SelectTrigger className="w-[120px] bg-background">
                        <SelectValue placeholder="Tüm Yıllar" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tüm Yıllar</SelectItem>
                        {years.map(y => (
                            <SelectItem key={y} value={y}>{y}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={currentMonth} onValueChange={(val) => onFilterChange("month", val)}>
                    <SelectTrigger className="w-[140px] bg-background">
                        <SelectValue placeholder="Tüm Aylar" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tüm Aylar</SelectItem>
                        {months.map(m => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={currentEmployee} onValueChange={(val) => onFilterChange("employee", val)}>
                    <SelectTrigger className="w-[200px] bg-background">
                        <SelectValue placeholder="Tüm Personeller" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tüm Personeller</SelectItem>
                        {employees.map(e => (
                            <SelectItem key={e.id} value={e.id.toString()}>{e.firstName} {e.lastName}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center">
                <Button
                    variant="ghost"
                    onClick={() => router.push(pathname)}
                    disabled={currentBranch === "all" && currentYear === "all" && currentMonth === "all" && currentEmployee === "all"}
                >
                    Filtreleri Temizle
                </Button>
            </div>
        </div>
    );
}
