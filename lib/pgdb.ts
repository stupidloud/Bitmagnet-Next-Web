import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Client } from "pg";

async function getHyperdriveConnectionString() {
  const { env } = await getCloudflareContext({ async: true });
  const hyperdrive = (
    env as CloudflareEnv & {
      HYPERDRIVE?: { connectionString: string };
    }
  ).HYPERDRIVE;

  if (!hyperdrive?.connectionString) {
    throw new Error("Missing Cloudflare `HYPERDRIVE` binding");
  }

  return hyperdrive.connectionString;
}

async function queryWithClient(text: string, params: any) {
  const connectionString = await getHyperdriveConnectionString();
  const client = new Client({ connectionString });

  await client.connect();

  try {
    return await client.query(text, params);
  } finally {
    await client.end();
  }
}

export const query = async (text: string, params: any) => {
  return queryWithClient(text, params);
};
