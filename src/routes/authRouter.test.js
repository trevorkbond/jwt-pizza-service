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
const franchiseeUser = {
  name: "pizza franchisee",
  password: "a",
  roles: [{ role: Role.Franchisee }],
};
const testUsers = {
  admin: adminUser,
  diner: dinerUser,
  franchisee: franchiseeUser,
};

let dinerUserAuthToken;
let adminUserAuthToken;
let franchiseeUserAuthToken;

async function createUser(user) {
  user.email = randomName() + "@admin.com";

  await DB.addUser(user);
  user.password = "a";

  return user;
}

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

async function loginUser(user) {
  const loginRes = await request(app).put("/api/auth").send(user);
  expect(loginRes.status).toBe(200);
  expect(loginRes.body.token).toMatch(
    /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/
  );
  return loginRes;
}

beforeAll(async () => {
  Object.entries(testUsers).forEach(async ([role, user]) => {
    console.log(user);
    const createdUser = await createUser(user);
    testUsers.role = createdUser;
  });
  console.log(testUsers);
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
