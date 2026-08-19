const express = require("express")
const app = express()

const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

app.use(express.json())


app.get("/users", async function (req, res, next) {
    try {
        const users = await prisma.user.findMany()
        res.json(users)
    } catch (err) {
        next(err)
    }
})

app.get("/users/:id", async function (req, res, next) {
    try {
        const id = Number(req.params.id)
        const user = await prisma.user.findUnique({ where: { id: id } })
        if (!user) {
            return res.status(404).json()
        }
        res.json(user)
    } catch (err) {
        next(err)
    }
})

app.post("/users", async function (req, res, next) {
    try {
        if (!req.body.name) {
            return res.status(400).json()
        }
        const newUser = await prisma.user.create({ data: { name: req.body.name } })
        res.status(201).json(newUser)
    } catch (err) {
        next(err)
    }
})

app.put("/users/:id", async function (req, res, next) {
    try {
        if (!req.body.name) {
            return res.status(400).json()
        }
        const id = Number(req.params.id)
        const user = await prisma.user.findUnique({ where: { id: id } })
        if (!user) {
            return res.status(404).json()
        }
        const updated = await prisma.user.update({ where: { id: id }, data: { name: req.body.name } })
        res.json(updated)
    } catch (err) {
        next(err)
    }
})
app.delete("/users/:id", async function (req, res, next) {
    try {
        const id = Number(req.params.id)
        const user = await prisma.user.findUnique({ where: { id: id } })
        if (!user) {
            return res.status(404).json()
        }
        await prisma.user.delete({ where: { id: id } })
        res.status(204).send()
    } catch (err) {
        next(err)
    }
})

app.use(function (err, req, res, next) {
    console.error(err)
    res.status(500).json({ message: "Internal server error" })
})

app.listen(3000, function(){
    console.log("Server 3000")
})