import { CUSTOMER_OAUTH_FLOW, createLoginStartHandler } from '@/api/server/oauthRoutes';

export const dynamic = 'force-dynamic';

export const GET = createLoginStartHandler(CUSTOMER_OAUTH_FLOW);
