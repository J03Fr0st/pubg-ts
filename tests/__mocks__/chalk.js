// Mock for chalk ESM module
const chalk = {
  blue: {
    bold: (text) => text,
  },
  green: (text) => text,
  red: (text) => text,
  yellow: (text) => text,
  cyan: (text) => text,
  gray: (text) => text,
  bold: (text) => text,
};

module.exports = chalk;
module.exports.default = chalk;
