require("dotenv/config")

const express = require("express")
const app = express()

const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")


const { z } = require("zod")

//register schema
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1).max(100)
})

//login schema

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
})

const rateLimit = require("express-rate-limit")

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,   
    max: 5,                     
    message: { message: "too many login attempts, try again later" }
})

app.use(express.json())

function validate(schema) {
    return function (req, res, next) {
        const result = schema.safeParse(req.body)
        if (!result.success) {
            return res.status(400).json({ message: "validation failed", errors: result.error.issues })
        }
        req.body = result.data   
        next()
    }
}

//token validation middleware
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization
    if(!authHeader) {
        return res.status(401).json({message: "no token provided"})
    }

    const token = authHeader.split(" ")[1]
    if(!token) {
        return res.status(401).json({ message:"malformed token"})
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET)
        req.user = payload
        next()
    } catch(err){
        return res.status(401).json({ message: "Invalid or expired token "})
    }
}
//admin requirement middleware
function requireAdmin(req, res, next) {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "admin access required" })
    }
    next()
}

// admin-only
app.get("/admin/users", authenticate, requireAdmin, async function (req, res, next) {
    try {
        const users = await prisma.user.findMany()
        res.json(users)
    } catch (err) {
        next(err)
    }
})


app.get("/users",authenticate, async function (req, res, next) {
    try {
        const users = await prisma.user.findMany()
        res.json(users)
    } catch (err) {
        next(err)
    }
})


app.get("/users/:id",authenticate, async function (req, res, next) {
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

app.post("/users",authenticate, async function (req, res, next) {
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

app.put("/users/:id",authenticate, async function (req, res, next) {
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
app.delete("/users/:id",authenticate, async function (req, res, next) {
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

app.post("/register",validate(registerSchema), async function (req, res, next) {
    try{
        const {email, password, name} = req.body

        if(!email || !password || !name) {
            return res.status(400).json({ message : "email , password and name are mandatory"})
        }

        const hash = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: { email: email, password: hash, name: name, role: "user"}
        })

        res.status(201).json({ id: user.id, email: user.email, name: user.name, role: user.role})
    } catch (err) {
        next(err)
    }
})

app.post("/login",loginLimiter, validate(loginSchema), async function (req, res, next){
    try{
        const {email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ message: "email and password are mandatory"})

        }

        const user = await prisma.user.findUnique({ where: { email: email} })

        if(!user) {
            return res.status(401).json({ message : "invalid credentials"})
        }

        const passwordOK = await bcrypt.compare(password, user.password)
        if(!passwordOK){
            return res.status(401).json({ message: "Invalid credentials" })
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role},
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        )

        res.json({ token: token })


    } catch(err){
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