import { getAssetFromKV } from "@cloudflare/kv-asset-handler";

import manifestJSON from "__STATIC_CONTENT_MANIFEST";
const assetManifest = JSON.parse(manifestJSON);

export default {
  /** @param {Request} request */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api")) {
      return new Response(manifestJSON);
    }

    const options = {
      ASSET_NAMESPACE: env.__STATIC_CONTENT,
      ASSET_MANIFEST: assetManifest,
      cacheControl: {
        // This do the trick!
        bypassCache: true,
      },
    };

    try {
      const asset = await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil,
        },
        options
      );

      console.log("ASSET", asset);

      return asset;
    } catch (err) {
      console.error("NOT_FOUND", err);
      try {
        const notFoundPage = new Request(`${url.origin}/404.html`, request);
        let notFoundResponse = await getAssetFromKV(
          {
            request: notFoundPage,
            waitUntil: ctx.waitUntil,
          },
          options
        );

        return new Response(notFoundResponse.body, {
          ...notFoundResponse,
          status: 404,
        });
      } catch (err) {
        console.error("UNEXPECTED", err);
        return new Response(err.toString(), { status: 500 });
      }
    }
  },
};
