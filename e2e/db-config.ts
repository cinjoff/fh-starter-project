/** Shared constants for the E2E test database. */

export const TEST_DB_NAME = "fh_starter_test";
export const PG_HOST = "127.0.0.1";
export const PG_PORT = 54322;
export const PG_USER = "postgres";
export const PG_PASS = "postgres";

export const SUPERUSER_URL = `postgresql://${PG_USER}:${PG_PASS}@${PG_HOST}:${PG_PORT}/postgres`;
export const TEST_DB_URL = `postgresql://${PG_USER}:${PG_PASS}@${PG_HOST}:${PG_PORT}/${TEST_DB_NAME}`;

export const AUTH_FILE = ".auth/user.json";
export const AUTH_FILE_2 = ".auth/user2.json";
