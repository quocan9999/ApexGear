/** Jest config for crawler unit tests — isolated from the api `src` suite. */
module.exports = {
  rootDir: 'scripts',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  testEnvironment: 'node',
};
