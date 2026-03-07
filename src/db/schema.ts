import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, real } from "drizzle-orm/sqlite-core";

// --- Kullanıcılar (App Users - Authentication) ---
export const appUsers = sqliteTable("app_users", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    username: text("username").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").default("admin"), // admin, user vb.
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// --- Şubeler (Branches) ---
export const branches = sqliteTable("branches", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    address: text("address"),
    sgk_number: text("sgk_number"), // SGK Sicil No
    sgk_system_password: text("sgk_system_password"), // Sistem Şifresi
    sgk_workplace_password: text("sgk_workplace_password"), // İşyeri Şifresi
    sgk_user_code: text("sgk_user_code"), // Kullanıcı Kodu
    sgk_code: text("sgk_code"), // SGK Kod

    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// --- Departmanlar (Departments) ---
export const departments = sqliteTable("departments", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull().unique(),
    description: text("description"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// --- Personel (Employees) ---
export const employees = sqliteTable("employees", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    branchId: integer("branch_id").references(() => branches.id),
    sgkBranchId: integer("sgk_branch_id").references(() => branches.id),

    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    tcNumber: text("tc_number").unique(),

    birthDate: text("birth_date"), // ISO Date string YYYY-MM-DD
    gender: text("gender").default("male"), // male, female
    startDate: text("start_date"), // İşe Giriş Tarihi

    occupationCode: text("occupation_code"), // SGK Meslek Kodu
    position: text("position"),
    department: text("department"),
    salary: real("salary"), // Net Maaş
    grossSalary: real("gross_salary"), // Brüt Maaş
    iban: text("iban"), // IBAN
    leaveCarryover: integer("leave_carryover").default(0), // Geçen yıldan devreden izin günü

    besStatus: text("bes_status").default("voluntary"), // auto, voluntary, none

    // Çıkış Bilgileri
    terminationDate: text("termination_date"),
    terminationReason: text("termination_reason"),
    sgkExitCode: text("sgk_exit_code"),

    status: text("status").default("active"), // active, passive, on_leave
    avatarUrl: text("avatar_url"),

    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// --- İzinler (Leaves) ---
export const leaves = sqliteTable("leaves", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    employeeId: integer("employee_id").references(() => employees.id).notNull(),

    type: text("type").notNull(), // annual, sick, unpaid, marriage, paternity, death
    startDate: text("start_date").notNull(),
    endDate: text("end_date").notNull(),
    daysCount: integer("days_count").notNull(), // Gün sayısı
    returnDate: text("return_date"), // İşe dönüş tarihi

    description: text("description"),
    status: text("status").default("approved"), // pending, approved, rejected (Admin added directly = approved)

    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// --- İcralar (Garnishments) ---
export const garnishments = sqliteTable("garnishments", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    employeeId: integer("employee_id").references(() => employees.id).notNull(),

    fileNumber: text("file_number").notNull(), // Esas No
    officeName: text("office_name").notNull(), // İcra Dairesi

    totalAmount: real("total_amount").notNull(), // Toplam Borç
    deductionAmount: real("deduction_amount"), // Aylık kesinti tutarı
    remainingAmount: real("remaining_amount").notNull(), // Kalan Borç
    iban: text("iban"), // IBAN for payment

    priorityOrder: integer("priority_order").notNull(), // 1, 2, 3... (manuel değiştirilebilir)
    status: text("status").default("active"), // active, completed, suspended
    notificationDate: text("notification_date"), // Tebliğ/Teslim Tarihi
    creditor: text("creditor"), // Alacaklı (Yeni)

    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Garnishment Installments (Ödeme Planı)
export const garnishmentInstallments = sqliteTable("garnishment_installments", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    garnishmentId: integer("garnishment_id").references(() => garnishments.id).notNull(),
    paymentDate: text("payment_date").notNull(), // YYYY-MM-DD
    amount: real("amount").notNull(),
    status: text("status").default("pending"), // pending, paid
    paidAt: text("paid_at"),
    description: text("description"), // For refunds or notes
});

// --- İSG Evrak Türleri (Occupational Safety Document Types) ---
export const isgDocumentTypes = sqliteTable("isg_document_types", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(), // Örn: "İş Güvenliği Eğitimi", "Sağlık Raporu"
    renewal_period_months: integer("renewal_period_months").default(0),
    is_mandatory: integer("is_mandatory", { mode: 'boolean' }).default(false),
    validityMonths: integer("validity_months").default(12), // Geçerlilik süresi (ay)
    description: text("description"), // Açıklama
});

// --- İSG Kayıtları (Occupational Safety) ---
export const isgRecords = sqliteTable("isg_records", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    employeeId: integer("employee_id").references(() => employees.id).notNull(),
    documentTypeId: integer("document_type").references(() => isgDocumentTypes.id).notNull(),

    documentDate: text("document_date"), // Evrak tarihi
    expiryDate: text("expiry_date"), // Geçerlilik bitiş tarihi
    filePath: text("file_path"), // Dosya yolu
    fileType: text("file_type"), // pdf, jpg, png

    notificationStatus: text("notification_status").default("pending"), // pending, notified
});

// --- Harcamalar (Expenses) ---
export const expenses = sqliteTable("expenses", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    employeeId: integer("employee_id").references(() => employees.id),
    description: text("description").notNull(),
    amount: real("amount").notNull(),
    currency: text("currency").default("TRY"), // TRY, USD, EUR
    date: text("date").notNull(), // YYYY-MM-DD
    category: text("category"), // Seyahat, Yemek, Ulaşım, Yazılım, vb.
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// --- Dokümanlar (Documents - General & Personal) ---
export const documents = sqliteTable("documents", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    employeeId: integer("employee_id").references(() => employees.id), // Null ise şirket geneli
    branchId: integer("branch_id").references(() => branches.id), // Şube bazlı evraklar için
    companyName: text("company_name"), // Şirket adı

    title: text("title").notNull(),
    type: text("type"), // pdf, docx, jpg, png
    category: text("category").default("other"), // trade_registry, signature, tax, social_security, license, other
    filePath: text("file_path").notNull(),
    fileName: text("file_name"), // Orijinal dosya adı
    fileSize: integer("file_size"), // Byte cinsinden
    relatedTo: text("related_to").default("company"), // company, branch, employee

    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// --- Doküman Kategorileri (Document Categories - Dynamic) ---
export const documentCategories = sqliteTable("document_categories", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull().unique(),
    description: text("description"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// --- Ayarlar (Settings) ---
export const settings = sqliteTable("settings", {
    key: text("key").primaryKey(), // theme, etc.
    value: text("value").notNull(),
});

// --- Puantaj (Attendance) ---
export const attendance = sqliteTable("attendance", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    employeeId: integer("employee_id").references(() => employees.id).notNull(),
    date: text("date").notNull(), // YYYY-MM-DD
    status: text("status").notNull(), // present, annual_leave, sick_leave, sunday_work, sunday_leave_used, unpaid_leave, absent
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// --- Puantaj Ayarları (Attendance Settings) ---
export const attendanceSettings = sqliteTable("attendance_settings", {
    key: text("key").primaryKey(), // sunday_pay_rate
    value: text("value").notNull(),
});
