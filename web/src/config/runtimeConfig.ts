// Runtime configuration loaded from config.js injected at runtime
// This allows the same Docker image to work in different environments

interface RuntimeConfig {
  inviteServiceURL: string;
}

// Default values (used if config.js is not loaded)
const defaultConfig: RuntimeConfig = {
  inviteServiceURL: process.env.REACT_APP_INVITE_SERVICE_URL || 'http://localhost:8080',
};

// Access config from window object (injected by config.js)
// @ts-ignore - window.__RUNTIME_CONFIG__ is injected at runtime
const runtimeConfig: RuntimeConfig = (window as any).__RUNTIME_CONFIG__ || defaultConfig;

export const getInviteServiceURL = (): string => {
  return runtimeConfig.inviteServiceURL;
};

