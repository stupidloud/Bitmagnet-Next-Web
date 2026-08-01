import { NextResponse } from "next/server";
import { z } from "zod";

import {
  SEARCH_PARAMS,
  SEARCH_KEYWORD_LENGTH_MIN,
  SEARCH_KEYWORD_LENGTH_MAX,
  DEFAULT_SORT_TYPE,
  DEFAULT_FILTER_TIME,
  DEFAULT_FILTER_SIZE,
} from "@/config/constant";
import { searchTotalCount } from "@/app/api/graphql/service";

const schema = z.object({
  keyword: z
    .string()
    .min(SEARCH_KEYWORD_LENGTH_MIN)
    .max(SEARCH_KEYWORD_LENGTH_MAX),
  sortType: z.enum(SEARCH_PARAMS.sortType).default(DEFAULT_SORT_TYPE),
  filterTime: z.enum(SEARCH_PARAMS.filterTime).default(DEFAULT_FILTER_TIME),
  filterSize: z.enum(SEARCH_PARAMS.filterSize).default(DEFAULT_FILTER_SIZE),
});

const handler = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const params = Object.fromEntries(searchParams.entries());

  let safeParams;

  try {
    safeParams = schema.parse(params);
  } catch (error: any) {
    console.error(error);

    const { path, message } = error.errors[0] || {};
    const errMessage = path ? `${path[0]}: ${message}` : message;

    return NextResponse.json(
      {
        data: null,
        message: errMessage || "Invalid request",
        status: 400,
      },
      { status: 400 },
    );
  }

  try {
    const data = await searchTotalCount(null, { queryInput: safeParams });

    return NextResponse.json({
      data,
      message: "success",
      status: 200,
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        data: null,
        message: error?.message || "Internal Server Error",
        status: 500,
      },
      { status: 500 },
    );
  }
};

export { handler as GET, handler as POST };
