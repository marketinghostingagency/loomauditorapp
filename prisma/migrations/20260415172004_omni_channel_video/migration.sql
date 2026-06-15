-- AlterTable
ALTER TABLE "ProjectAsset" ADD COLUMN     "aspectRatio" TEXT,
ADD COLUMN     "isMasterAsset" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentAssetId" TEXT,
ADD COLUMN     "platformTarget" TEXT[];

-- AddForeignKey
ALTER TABLE "ProjectAsset" ADD CONSTRAINT "ProjectAsset_parentAssetId_fkey" FOREIGN KEY ("parentAssetId") REFERENCES "ProjectAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
