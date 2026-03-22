import { prisma } from '../config/prisma.config';
import { beforeAll, beforeEach, afterAll } from 'vitest';

beforeAll(async () => {
    // Ensure database is connected
    await prisma.$connect();
});

beforeEach(async () => {
    // Clean up database before each test
    // Order matters due to foreign key constraints
    const deleteTable = async (tableName: string) => {
        try {
            await (prisma as any)[tableName].deleteMany();
        } catch (e) {
            console.error(`Error deleting table ${tableName}:`, e);
            throw e;
        }
    };

    const tables = [
        'sharedLink',
        'environmentVariable',
        'environment',
        'requestHistory',
        'savedRequest',
        'collection',
        'workspaceMember',
        'workspace',
        'user'
    ];

    for (const table of tables) {
        await deleteTable(table);
    }
});

afterAll(async () => {
    await prisma.$disconnect();
});
