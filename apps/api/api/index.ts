import { createApp } from "../src/main";
import { PrismaService } from "../src/prisma/prisma.service";

const prisma = new PrismaService();
const app = createApp(prisma);

export default app;
