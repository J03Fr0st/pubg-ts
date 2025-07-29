// Mock for inquirer ESM module
const inquirer = {
  prompt: jest.fn(),
};

module.exports = inquirer;
module.exports.default = inquirer;
