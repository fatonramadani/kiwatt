import { postRouter } from "~/server/api/routers/post";
import { organizationRouter } from "~/server/api/routers/organization";
import { memberRouter } from "~/server/api/routers/member";
import { tariffRouter } from "~/server/api/routers/tariff";
import { energyRouter } from "~/server/api/routers/energy";
import { invoiceRouter } from "~/server/api/routers/invoice";
import { reportsRouter } from "~/server/api/routers/reports";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  organization: organizationRouter,
  member: memberRouter,
  tariff: tariffRouter,
  energy: energyRouter,
  invoice: invoiceRouter,
  reports: reportsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
