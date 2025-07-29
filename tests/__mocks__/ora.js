// Mock for ora ESM module
const ora = () => ({
  start: jest.fn().mockReturnThis(),
  succeed: jest.fn().mockReturnThis(),
  fail: jest.fn().mockReturnThis(),
  stop: jest.fn().mockReturnThis(),
  text: '',
});

module.exports = ora;
module.exports.default = ora;
