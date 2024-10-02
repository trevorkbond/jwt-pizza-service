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

// function setLocalAuthToken(user, authToken) {
//   const userRole = user.roles[0].role;
//   switch (userRole) {
//     case Role.Admin:
//       adminUserAuthToken = authToken;
//       break;
//     case Role.Diner:
//       dinerUserAuthToken = authToken;
//       break;
//     case Role.Franchisee:
//       franchiseeUserAuthToken = authToken;
//       break;
//   }
// }

function randomName() {
  return Math.random().toString(36).substring(2, 12);
}

async function loginUser(user) {
  const loginRes = await request(app).put("/api/auth").send(user);
  expect(loginRes.status).toBe(200);
  expect(loginRes.body.token).toMatch(
    /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/
  );
  // setLocalAuthToken(user, loginRes.body.token);
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

beforeAll(async () => {
  const userPromises = Object.entries(testUsers).map(async ([role, user]) => {
    const createdUser = await createUser(user);
    testUsers[role] = createdUser;
  });

  await Promise.all(userPromises);
});

for (const [role, testUser] of Object.entries(testUsers)) {
  test(`Login with ${role} user success`, async () => {
    const loginRes = await loginUser(testUser);
    const { password, ...user } = {
      ...(role === "diner" ? dinerUser : adminUser),
      roles: [{ role }],
    };
    expect(loginRes.body.user).toMatchObject(user);
    expect(password).toBe("a");
  });
}

test("Login with nonexistant user failure", async () => {
  const fakeUser = {
    email: randomName() + "@fake.com",
    password: randomName(),
  };
  const loginRes = await request(app).put("/api/auth").send(fakeUser);
  expect(loginRes.status).toBe(404);
});

test("register a user success", async () => {
  const { registerRes } = await registerUser(dinerUser);
  expect(registerRes.status).toBe(200);
  expect(registerRes.body.token).toMatch(
    /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/
  );
});

test("register a user failure", async () => {
  const badUser = { blah: "blah" };
  const registerRes = await request(app).post("/api/auth").send(badUser);
  expect(registerRes.status).toBe(400);
  expect(registerRes.body.message).toBe(
    "name, email, and password are required"
  );
});

test("logout failure", async () => {
  const newUser = await createUser(dinerUser);
  const logoutRes = await request(app).delete("/api/auth").send(newUser);
  expect(logoutRes.status).toBe(401);
});

// test("logout success", async () => {
//   const { user } = await registerUser(dinerUser);
//   const logoutRes = await request(app).delete("/api/auth").send(user);
//   expect(logoutRes.status).toBe(200);
// });

test("update user success", async () => {
  const admin = await createUser(adminUser);
  console.log(admin);
  admin.email = randomName() + "@email.com";
  admin.password = "newpassword";
  // const updateRes = await request(app).put
});
