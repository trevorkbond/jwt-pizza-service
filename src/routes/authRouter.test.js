const request = require("supertest");
const app = require("../service");
const { DB } = require("../database/database.js");
const {
  dinerUser,
  adminUser,
  testUsers,
  createUser,
  randomName,
  loginUser,
  registerUser,
  getDatabaseUser,
} = require("./userCreation.js");

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

test("logout success", async () => {
  const { registerRes, user } = await registerUser(dinerUser);
  const authToken = registerRes.body.token;
  const logoutRes = await request(app)
    .delete("/api/auth")
    .set("Authorization", `Auth: ${authToken}`)
    .send(user);
  expect(logoutRes.status).toBe(200);
});

test("update user success", async () => {
  const admin = await createUser(adminUser);
  const loginRes = await loginUser(admin);
  const authToken = loginRes.body.token;
  const { id } = await getDatabaseUser(admin);
  admin.email = randomName() + "@email.com";
  admin.password = "newpassword";
  const updateRes = await request(app)
    .put(`/api/auth/${id}`)
    .set("Authorization", `Auth: ${authToken}`)
    .send(admin);
  expect(updateRes.status).toBe(200);
});
