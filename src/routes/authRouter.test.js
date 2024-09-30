const request = require("supertest");
const app = require("../service");
const { DB, Role } = require("../database/database.js");

const dinerUser = {
  name: "pizza diner",
  email: "reg@test.com",
  password: "a",
  roles: [{ role: Role.Diner }],
};
const adminUser = {
  name: "pizza diner",
  email: "reg@test.com",
  password: "a",
  roles: [{ role: Role.Admin }],
};
let dinerUserAuthToken;
let adminUserAuthToken;
let franchiseeUserAuthToken;

function setLocalAuthToken(user, authToken) {
  const userRole = user.roles[0].role;
  switch (userRole) {
    case Role.Admin:
      adminUserAuthToken = authToken;
      break;
    case Role.Diner:
      dinerUserAuthToken = authToken;
      break;
    case Role.Franchisee:
      franchiseeUserAuthToken = authToken;
      break;
  }
}

function randomName() {
  return Math.random().toString(36).substring(2, 12);
}

async function registerUser(user) {
  user.email = randomName() + "@test.com";
  const registerRes = await request(app).post("/api/auth").send(user);
  authToken = registerRes.body.token;
  setLocalAuthToken(user, authToken);
  expect(authToken).toMatch(
    /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/
  );
}

async function loginUser(user) {
  const loginRes = await request(app).put("/api/auth").send(user);
  expect(loginRes.status).toBe(200);
  expect(loginRes.body.token).toMatch(
    /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/
  );
  return loginRes;
}

beforeAll(async () => {
  await registerUser(dinerUser);
  await registerUser(adminUser);
});

test("Login with diner user", async () => {
  const loginRes = await loginUser(dinerUser);
  const { password, ...user } = { ...dinerUser, roles: [{ role: "diner" }] };
  expect(loginRes.body.user).toMatchObject(user);
  expect(password).toBe("a");
});

test("Login with admin user", async () => {
  const loginRes = await loginUser(adminUser);
  const { password, ...user } = { ...adminUser, roles: [{ role: "admin" }] };
  expect(loginRes.body.user).toMatchObject(user);
  expect(password).toBe("a");
});
