import type {Config} from 'jest';

const config: Config = {
    // collectCoverage: true,
    testEnvironment: "jsdom",
    setupFiles: ["./tests/setup_jest.js"]
};

export default config;