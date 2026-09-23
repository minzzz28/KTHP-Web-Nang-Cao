module.exports = {
  testEnvironment: 'node',
  clearMocks: true,
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }]
  },
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/server.js'
  ],
  coverageDirectory: 'coverage'
};
