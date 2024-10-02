const request = require("supertest");
const app = require("../service");
const { DB } = require("../database/database.js");
const {
  createAdminAndGetAuthToken,
  createDinerAndGetAuthToken,
  getDatabaseUser,
  randomName,
} = require("./userCreation.js");

test("get menu", async () => {
  const menuRes = await request(app).get("/api/order/menu").send();
  expect(menuRes.status).toBe(200);
  const menu = menuRes.body;
  expect(menu.length).toBe(5);
});
