const {PrismaClient} = require("@prisma/client")
const prisma = new PrismaClient({ log: ["query"] })

async function main() {
    const users = await prisma.user.findMany({ take:50 })

    for (let i = 0; i < users.length; i++) {
        const posts = await prisma.post.findMany({
            where: { userId: users[i].id }
        })
        console.log(users[i].name + "has" + posts.length + "posts")
    }
}

main().finally(() => prisma.$disconnect())