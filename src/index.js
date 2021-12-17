import { getAssetFromKV } from "@cloudflare/kv-asset-handler";

// https://github.com/cloudflare/kv-asset-handler#asset_manifest-required-for-es-modules
// import manifestJSON from '__STATIC_CONTENT_MANIFEST'
// const manifestJSON = JSON.stringify({
//   "index.html": "path/to/my/custom-loc-if-needed"
// });
// const assetManifest = JSON.parse(manifestJSON)

export default {
  /** @param {Request} request */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // if (url.pathname.startsWith("/api")) {
    //   callMyApi(url)
    // }

    const options = {
      ASSET_NAMESPACE: env.__STATIC_CONTENT,
      // ASSET_MANIFEST: assetManifest,
    };

    try {
      const asset = await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil,
        },
        options
      );

      return asset;
    } catch (err) {
      try {
        const notFoundPage = new Request(
          `${url.origin}/404.html`,
          request
        );
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
        console.error(err);
        return new Response(err.toString(), { status: 500 });
      }
    }
  },
};
