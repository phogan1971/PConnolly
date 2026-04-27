import { db } from "@/lib/db";
import type { ListingChannelAdapter } from "./types";
import { WebsiteAdapter } from "./website";
import { CarzoneExportAdapter } from "./carzone-export";
import { MockCarzoneApiAdapter } from "./mock-carzone-api";

const cache = new Map<string, ListingChannelAdapter>();

export async function getAdapterForChannel(channelKey: string): Promise<ListingChannelAdapter | null> {
  if (cache.has(channelKey)) return cache.get(channelKey)!;
  const channel = await db.channel.findUnique({ where: { key: channelKey } });
  if (!channel) return null;
  const config = (channel.configJson ?? {}) as { adapter?: string };
  const adapterKey = config.adapter ?? channelKey;

  let adapter: ListingChannelAdapter;
  switch (adapterKey) {
    case "website":
      adapter = new WebsiteAdapter(channel.id);
      break;
    case "carzone-export":
    case "export":
      adapter = new CarzoneExportAdapter(channel.id);
      break;
    case "mock-carzone-api":
    case "mock-api":
      adapter = new MockCarzoneApiAdapter(channel.id);
      break;
    case "carzone-api":
    case "api":
      throw new Error(
        "Official Carzone API adapter not implemented yet. " +
          "Set CARZONE_ADAPTER=export or mock-api until credentials are issued.",
      );
    default:
      throw new Error(`Unknown adapter: ${adapterKey}`);
  }
  cache.set(channelKey, adapter);
  return adapter;
}

export async function listChannels() {
  return db.channel.findMany({ orderBy: { key: "asc" } });
}
