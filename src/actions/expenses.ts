"use server"

import { db } from "@/db"
import { expenses } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getExpenses() {
    return await db.select().from(expenses).orderBy(expenses.date)
}

export async function addExpense(data: {
    description: string
    amount: number
    currency?: string
    date: string
    category?: string
    employeeId?: number
}) {
    await db.insert(expenses).values({
        description: data.description,
        amount: data.amount,
        currency: data.currency || "TRY",
        date: data.date,
        category: data.category,
        employeeId: data.employeeId,
    })

    revalidatePath("/expenses")
}

export async function deleteExpense(id: number) {
    await db.delete(expenses).where(eq(expenses.id, id))
    revalidatePath("/expenses")
}

export async function updateExpense(id: number, data: {
    description?: string
    amount?: number
    currency?: string
    date?: string
    category?: string
}) {
    await db.update(expenses)
        .set(data)
        .where(eq(expenses.id, id))

    revalidatePath("/expenses")
}
