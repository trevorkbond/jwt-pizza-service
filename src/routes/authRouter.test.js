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

let dinerUserAuthToken;
let adminUserAuthToken;

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
  setLocalAuthToken(user, loginRes.body.token);
  return loginRes;
}

beforeAll(async () => {
  const userPromises = Object.entries(testUsers).map(async ([role, user]) => {
    const createdUser = await createUser(user);
    testUsers[role] = createdUser;
  });

  await Promise.all(userPromises);
});

for (const [role, testUser] of Object.entries(testUsers)) {
  test(`Login with ${role} user`, async () => {
    const loginRes = await loginUser(testUser);
    const { password, ...user } = {
      ...(role === "diner" ? dinerUser : adminUser),
      roles: [{ role }],
    };
    expect(loginRes.body.user).toMatchObject(user);
    expect(password).toBe("a");
  });
}
