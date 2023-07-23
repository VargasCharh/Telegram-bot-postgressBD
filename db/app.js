const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("bot", "vargas", null, {
  host: "localhost",
  dialect: "postgres",
});

async function run() {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}
run();

module.exports = sequelize;
