const request = require("supertest");
const app = require("../service");
const { DB } = require("../database/database.js");
const {
  createAdminAndGetAuthToken,
  createDinerAndGetAuthToken,
  getDatabaseUser,
} = require("./userCreation.js");

test("list franchises empty success", async () => {
  const { createdUser, authToken } = await createAdminAndGetAuthToken();
  const { id } = await getDatabaseUser(createdUser);
  const franchiseRes = await request(app)
    .get(`/api/franchise/${id}`)
    .set("Authorization", `Auth: ${authToken}`)
    .send(createdUser);
  expect(franchiseRes.status).toBe(200);
});

test("list franchises with actual franchises success", () => {});
