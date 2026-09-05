export interface RemoteConfig {
  version: string;
  routesEnabled: Record<string, boolean>;
  numeric: Record<string, number>;
  json: Record<string, unknown>;
}

export const DEFAULT_REMOTE_CONFIG: RemoteConfig = {
  version: 'apk-4.3.7-reconstruction-1',
  routesEnabled: {},
  numeric: {},
  json: {},
};
