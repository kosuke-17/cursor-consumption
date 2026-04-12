-- AlterTable
ALTER TABLE "hook_agent_events" ADD COLUMN     "cacheReadTokens" INTEGER,
ADD COLUMN     "cacheWriteTokens" INTEGER,
ADD COLUMN     "inputTokens" INTEGER,
ADD COLUMN     "outputTokens" INTEGER;

-- AlterTable
ALTER TABLE "hook_file_events" DROP COLUMN "content";
