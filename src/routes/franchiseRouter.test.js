const request = require("supertest");
const app = require("../service");
const {
  createAdminAndGetAuthToken,
  getDatabaseUser,
  randomName,
} = require("./userCreation.js");

async function createAndVerifyFranchisee() {
  const { createdUser, authToken } = await createAdminAndGetAuthToken();
  const { id } = await getDatabaseUser(createdUser);
  const franchiseRes = await request(app)
    .get(`/api/franchise/${id}`)
    .set("Authorization", `Auth: ${authToken}`)
    .send(createdUser);
  expect(franchiseRes.status).toBe(200);
  expect(franchiseRes.body).toMatchObject([]);
  return { createdUser, authToken, id };
}

async function createFranchise() {
  const { createdUser, authToken } = await createAndVerifyFranchisee();
  const franchiseToAdd = {
    name: randomName(),
    admins: [{ email: createdUser.email }],
  };
  const addRes = await request(app)
    .post("/api/franchise")
    .set("Authorization", `Bearer: ${authToken}`)
    .send(franchiseToAdd);
  const franchiseId = addRes.body.id;
  return { franchiseId, authToken };
}

test("list franchises success", async () => {
  const franchiseRes = await request(app).get("/api/franchise").send();
  expect(franchiseRes.status).toBe(200);
});

test("list franchises empty success", async () => {
  await createAndVerifyFranchisee();
});

test("list franchises with actual franchises success", async () => {
  const { createdUser, authToken, id } = await createAndVerifyFranchisee();
  let franchisesToAdd = [];
  for (let i = 0; i < 5; i++) {
    franchisesToAdd.push({
      admins: [{ email: createdUser.email }],
      id: id,
      name: randomName(),
    });
  }

  for (const franchise of franchisesToAdd) {
    await request(app)
      .post("/api/franchise")
      .set("Authorization", `Bearer: ${authToken}`)
      .send(franchise);
  }

  const franchiseRes = await request(app)
    .get(`/api/franchise/${id}`)
    .set("Authorization", `Auth: ${authToken}`)
    .send(createdUser);
  expect(franchiseRes.status).toBe(200);
  const receivedFranchises = franchiseRes.body;

  // the response changes the structure of
  // the franchiseRes drastically
  // I know that if the right names are there
  // that all of the franchises were added
  franchisesToAdd.forEach((franchise) => {
    expect(receivedFranchises).toContainEqual(
      expect.objectContaining({
        name: franchise.name,
      })
    );
  });
});

test("delete franchise success", async () => {
  const { franchiseId, authToken } = await createFranchise();
  const deleteRes = await request(app)
    .delete(`/api/franchise/${franchiseId}`)
    .set("Authorization", `Bearer: ${authToken}`)
    .send();
  expect(deleteRes.status).toBe(200);
  expect(deleteRes.body.message).toBe("franchise deleted");
});

test("create and delete store", async () => {
  const { franchiseId, authToken } = await createFranchise();
  const addRes = await request(app)
    .post(`/api/franchise/${franchiseId}/store`)
    .set("Authorization", `Bearer: ${authToken}`)
    .send({ franchiseId: franchiseId, name: randomName() });
  expect(addRes.status).toBe(200);
});
