import { NextResponse } from "next/server";

import { statsInfo } from "@/app/api/graphql/service";

// Function to handle GET requests
const handler = async () => {
  try {
    const data = await statsInfo();

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
