import { NextResponse } from "next/server";

import { torrentByHash } from "@/app/api/graphql/service";

// Function to handle GET requests
const handler = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const hash = searchParams.get("hash");

  // Return a 400 response if the hash parameter is missing
  if (!hash) {
    return NextResponse.json(
      {
        message: "`hash` is required",
        status: 400,
      },
      {
        status: 400,
      },
    );
  }

  try {
    const data = await torrentByHash(null, { hash });

    // Return a 200 response with the query data
    return NextResponse.json(
      {
        data,
        message: "success",
        status: 200,
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      },
    );
  } catch (error: any) {
    console.error(error);

    // Return a 500 response if there's an error during the query execution
    return NextResponse.json(
      {
        message: error?.message || "Internal Server Error",
        status: 500,
      },
      {
        status: 500,
      },
    );
  }
};

export { handler as GET, handler as POST };
