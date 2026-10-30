const { STRATEGIES_KOSPI_CASH_50 } = require("./strategies_kospi_cash_50");
console.log("Total strategies:", STRATEGIES_KOSPI_CASH_50.length);
STRATEGIES_KOSPI_CASH_50.forEach(s => {
  console.log(s.id + ": " + s.name + " | " + s.category + " | rules: " + (s.rules ? s.rules.length : 0));
});
