const fs = require("fs");

function readJsonConfig(path) {
  const jsonData = fs.readFileSync(path, "utf8");
  const config = JSON.parse(jsonData);
  return config;
}

module.exports = {
  readJsonConfig,
};