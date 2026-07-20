// SVELTEKIT IMPORTS
import { PUBLIC_CONVEX_SITE_URL } from '$env/static/public';

// UTILS
import { CLIENT_IP_HEADER, resolveClientAddress } from '@/shared/utils/clientAddress.js';

// TYPES
import type { RequestHandler } from './$types';

/**
 * Better-auth proxy from SvelteKit → Convex.
 *
 * Replaces `@mmailaender/convex-better-auth-svelte`'s `createSvelteKitHandler`
 * because that helper hard-strips every header except a small allow-list
 * (`accept`, `authorization`, `cookie`, `user-agent`, etc.) — crucially
 * dropping `x-forwarded-for`. The result: better-auth sees Vercel's edge as
 * the caller and writes Vercel's IP into `session.ipAddress` instead of the
 * real user's. We rebuild the same forward but stamp `x-forwarded-for` /
 * `x-real-ip` from `event.getClientAddress()` (SvelteKit's helper, which on
 * Vercel reads the trusted incoming `x-forwarded-for` itself).
 *
 * Keep this in sync with the upstream `FORWARDED_AUTH_HEADER_NAMES` allow-list
 * if you ever bump the package — diff `node_modules/.../sveltekit/index.js`.
 */
const FORWARDED_AUTH_HEADER_NAMES = new Set([
	'accept',
	'authorization',
	'better-auth-cookie',
	'content-type',
	'cookie',
	'origin',
	'referer',
	'user-agent'
]);

const proxy: RequestHandler = async (event) => {
	const { request, getClientAddress } = event;
	const requestUrl = new URL(request.url);
	const nextUrl = `${PUBLIC_CONVEX_SITE_URL}${requestUrl.pathname}${requestUrl.search}`;
	const newRequest = new Request(nextUrl, request);

	const forwarded = new Headers();
	for (const [name, value] of request.headers.entries()) {
		if (FORWARDED_AUTH_HEADER_NAMES.has(name.toLowerCase())) forwarded.set(name, value);
	}
	forwarded.set('host', new URL(nextUrl).host);
	forwarded.set('x-forwarded-host', requestUrl.host);
	forwarded.set('x-forwarded-proto', requestUrl.protocol.replace(/:$/, ''));
	forwarded.set('x-better-auth-forwarded-host', requestUrl.host);
	forwarded.set('x-better-auth-forwarded-proto', requestUrl.protocol.replace(/:$/, ''));
	forwarded.set('accept-encoding', 'identity');

	// The whole point of this file: hand better-auth the real client IP.
	// SvelteKit's getClientAddress() reads the trusted `x-forwarded-for` set by
	// Vercel's edge from the actual TCP socket — not anything client-controlled.
	//
	// We set a CUSTOM header name (`x-client-ip`) instead of `x-forwarded-for`
	// because Convex sits behind Cloudflare, and Cloudflare rewrites the
	// well-known IP headers (`x-forwarded-for`, `cf-connecting-ip`) to the
	// immediate caller's IP — i.e. Vercel's egress. Custom header names pass
	// through CDNs unchanged. Better-auth's `advanced.ipAddress.ipAddressHeaders`
	// is configured (in `auth.ts`) to read this exact header.
	//
	// Spoofing risk: nil. The proxy strips all inbound headers above before
	// setting this one, so a client setting `x-client-ip` on the browser
	// request never reaches Convex.
	const clientIp = resolveClientAddress({ getClientAddress });
	if (!clientIp) {
		return new Response('Could not resolve client address.', { status: 400 });
	}
	forwarded.set(CLIENT_IP_HEADER, clientIp);

	for (const name of [...newRequest.headers.keys()]) newRequest.headers.delete(name);
	for (const [name, value] of forwarded.entries()) newRequest.headers.set(name, value);

	return fetch(newRequest, { method: request.method, redirect: 'manual' });
};

export const GET = proxy;
export const POST = proxy;
