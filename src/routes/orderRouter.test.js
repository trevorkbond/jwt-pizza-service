const request = require("supertest");
const app = require("../service");
const { createAdminAndGetAuthToken, randomName } = require("./userCreation.js");

test("get menu", async () => {
  const menuRes = await request(app).get("/api/order/menu").send();
  expect(menuRes.status).toBe(200);
  const menu = menuRes.body;
  expect(menu).toBeDefined();
});

test("add menu item success", async () => {
  const { authToken } = await createAdminAndGetAuthToken();
  const menuItemToAdd = {
    title: randomName(),
    description: randomName(),
    image: randomName(),
    price: 0.001,
  };
  const addRes = await request(app)
    .put("/api/order/menu")
    .set("Authorization", `Bearer: ${authToken}`)
    .send(menuItemToAdd);
  expect(addRes.status).toBe(200);
  const addedMenu = addRes.body;
  addedMenu.forEach((item) => delete item.id);
  expect(addedMenu).toContainEqual(menuItemToAdd);
});
