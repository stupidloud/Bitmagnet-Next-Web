import { getPreviewInfo, success, fail } from "../service";

// Function to handle GET requests
const handler = async (
  request: Request,
  { params }: { params: Promise<{ hash64: string }> },
) => {
  try {
    const { hash64 } = await params;
    const linkInfo = await getPreviewInfo(hash64);

    console.log(linkInfo);

    const data = {
      name: linkInfo.name,
      size: linkInfo.size,
      screenshots: linkInfo.screenshots?.map(
        (_item, index) => `${request.url}/${index}`,
      ),
    };

    return success(data);
  } catch (error: any) {
    console.error(error);

    return fail(error.message || "Internal Server Error");
  }
};

export { handler as GET, handler as POST };
