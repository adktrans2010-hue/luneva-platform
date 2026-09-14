export const legacyCertificateAssetMap: Readonly<Record<string, string>> = {
  "/certificates/uploads/1784019753433-jpg.jpg": "/certificates/rpp/arpps-membership.jpg",
  "/certificates/uploads/1784019642352-20220418-jpg.jpg": "/certificates/management/hr-manager.jpg",
  "/certificates/uploads/1784021042926-file-001-png.png":
    "/certificates/conferences/all-russian-scientific-practical-2.png",
};

export function canonicalCertificateAsset(image: string) {
  return legacyCertificateAssetMap[image] ?? image;
}
