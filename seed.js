require("dotenv/config")

const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function main() {
    for (let i = 1; i<=50;i++){
        await prisma.user.create({
            data: {
                name: "User " + i,
                email: "user" + i + "@gmail.com",
                password: "PLACEHOLDER",
                role: "user",
                posts: {
                    create: [
                        {title: "First post of user" + i},
                        {title: "Second post of user" + i},
                        {title: "Third post of user" + i}

                    ]
                }
            }
        })
    }
    console.log("Seed done 50 users and 3 post each DONE")
}
main().finally(() => prisma.$disconnect())