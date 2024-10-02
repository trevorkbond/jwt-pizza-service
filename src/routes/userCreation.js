const request = require("supertest");
const app = require("../service");
const { DB, Role } = require("../database/database.js");

const dinerUser = {
  name: "pizza diner",
  password: "a",
  roles: [{ role: Role.Diner }],
};
const adminUser = {
  name: "pizza admin",
  password: "a",
  roles: [{ role: Role.Admin }],
};
const testUsers = {
  admin: adminUser,
  diner: dinerUser,
};

async function createUser(user) {
  user.email = randomName() + "@admin.com";
  await DB.addUser(user);
  user.password = "a";
  return user;
}

function randomName() {
  return Math.random().toString(36).substring(2, 12);
}

async function loginUser(user) {
  const loginRes = await request(app).put("/api/auth").send(user);
  expect(loginRes.status).toBe(200);
  expect(loginRes.body.token).toMatch(
    /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/
  );
  return loginRes;
}

async function registerUser(user) {
  user.email = randomName() + "@test.com";
  const registerRes = await request(app).post("/api/auth").send(user);
  return {
    registerRes: registerRes,
    user: user,
  };
}

module.exports = {
  dinerUser,
  adminUser,
  testUsers,
  createUser,
  randomName,
  loginUser,
  registerUser,
};
