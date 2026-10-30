module.exports = {
  testEnvironment: 'node',
  clearMocks: true,
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }]
  },
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: 'coverage'
};
