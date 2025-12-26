module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/test'],
    testMatch: ['**/*.test.ts'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
    collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
    moduleNameMapper: {
        '^@cdk-constructs/aws$': '<rootDir>/src',
    },
};
