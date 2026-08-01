import { Metadata } from "next";
import { notFound } from "next/navigation";

import { base64ToHex, getLinkInfoFromWhatsLink } from "@/utils";
import { DetailContent } from "@/components/DetailContent";
import { torrentByHash } from "@/app/api/graphql/service";

// Function to fetch torrent data based on the hash
async function fetchData(hash64: string) {
  const hash = base64ToHex(hash64); // Convert base64 hash to hex

  if (!hash || hash.length !== 40) {
    console.error("Invalid hash", hash);
    notFound();
  }

  const data = await torrentByHash(null, { hash });

  if (!data) {
    notFound();
  }

  return { data };
}

// Function to generate metadata for the page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ hash64: string }>;
}): Promise<Metadata> {
  const { hash64 } = await params;
  const { data } = await fetchData(hash64);

  return {
    title: data.name,
  };
}

// Component to render the detail page
export default async function Detail({
  params,
}: {
  params: Promise<{ hash64: string }>;
}) {
  const { hash64 } = await params;
  const { data } = await fetchData(hash64);

  const linkInfo = getLinkInfoFromWhatsLink(data.magnet_uri);

  return (
    <>
      <DetailContent data={data} linkInfo={linkInfo} />
    </>
  );
}
