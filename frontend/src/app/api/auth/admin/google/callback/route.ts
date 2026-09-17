import { ADMIN_OAUTH_FLOW, createCallbackHandler } from '@/api/server/oauthRoutes';

export const dynamic = 'force-dynamic';

export const GET = createCallbackHandler(ADMIN_OAUTH_FLOW);
