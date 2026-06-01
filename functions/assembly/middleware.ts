import assetNegotiationPlugin from "pages-plugin-asset-negotiation";

export const onRequest: PagesFunction = assetNegotiationPlugin({
  formats: ['avif', 'webp'], // Will try AVIF first, then WebP
});