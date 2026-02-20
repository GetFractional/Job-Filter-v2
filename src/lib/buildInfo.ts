import { DB_SCHEMA_VERSION } from '../db';

const buildSha = typeof __BUILD_SHA__ === 'string' && __BUILD_SHA__.trim() ? __BUILD_SHA__ : 'local';
const appEnv = typeof __APP_ENV__ === 'string' && __APP_ENV__.trim() ? __APP_ENV__ : 'dev';

export const BUILD_INFO = {
  buildSha,
  appEnv,
  schemaVersion: DB_SCHEMA_VERSION,
} as const;

export const BUILD_INFO_LABEL = `build:${BUILD_INFO.buildSha} env:${BUILD_INFO.appEnv} schema:v${BUILD_INFO.schemaVersion}`;
