module.exports = {
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'routes/**/*.js',
        'middleware/**/*.js',
        'config/**/*.js',
        '!**/node_modules/**',
        '!**/logs/**'
    ],
    coverageThreshold: {
        global: {
            branches: 50,
            functions: 50,
            lines: 60,
            statements: 60
        }
    },
    testMatch: ['**/tests/**/*.test.js'],
    verbose: true
};
