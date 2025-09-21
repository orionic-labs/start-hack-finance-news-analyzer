import { pgTable, serial, varchar, integer, numeric } from 'drizzle-orm/pg-core';

export const clients = pgTable('clients', {
    clientId: serial('client_id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    status: varchar('status', { length: 50 }).notNull(),
    contactName: varchar('contact_name', { length: 255 }),
    contactEmail: varchar('contact_email', { length: 255 }),
    logoUrl: varchar('logo_url', { length: 500 }),
});

export const allocations = pgTable('allocations', {
    allocationId: serial('allocation_id').primaryKey(),
    clientId: integer('client_id')
        .references(() => clients.clientId)
        .notNull(),
    assetClass: varchar('asset_class', { length: 255 }).notNull(),
    allocationPercent: numeric('allocation_percent', { precision: 5, scale: 2 }).notNull(),
});
