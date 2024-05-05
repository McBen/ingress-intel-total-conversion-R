import type { Config } from 'jest';

const config: Config = {
    // collectCoverage: true,
    testEnvironment: "jsdom",
    setupFiles: ["./tests/setup_jest.js"],
    moduleNameMapper: {
        "\\.(jpg|ico|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/tests/filemock.js",
        "\\.(css|less)$": "<rootDir>/tests/filemock.js"
    }

};

export default config;