const test = require("node:test")
const assert = require("node:assert")
const request = require("supertest")
const app = require("./server")

test("GET /users without token returns 401", async () => {
  const res = await request(app).get("/users")
  assert.strictEqual(res.status, 401)
})

test("POST /login with empty body returns 400", async () => {
  const res = await request(app).post("/login").send({})
  assert.strictEqual(res.status, 400)
})

test("POST /register with invalid email returns 400", async () => {
  const res = await request(app).post("/register").send({ email: "x", password: "12345678", name: "Toni" })
  assert.strictEqual(res.status, 400)
})