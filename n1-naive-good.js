const {PrismaClient} = require("@prisma/client")
const prisma = new PrismaClient({ log: ["query"] })

async function main() {
    const users = await prisma.user.findMany({ take:50,
                                               include: {posts: true}     
                                            })

    for (let i = 0; i < users.length; i++) {
        
        console.log(users[i].name + "has" + users[i].posts.length + "posts")
    }
}

main().finally(() => prisma.$disconnect())