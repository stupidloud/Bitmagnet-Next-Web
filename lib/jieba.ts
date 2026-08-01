const TOKEN_REGEX = /[\p{Script=Han}]{2,}|[A-Za-z0-9._-]{2,}/gu;

function cjkBigrams(text: string) {
  return Array.from(text.matchAll(/[\p{Script=Han}]{4,}/gu)).flatMap(([word]) =>
    Array.from({ length: word.length - 1 }, (_, index) =>
      word.slice(index, index + 2),
    ),
  );
}

export function jiebaCut(text: string) {
  const keywords = [
    ...Array.from(text.matchAll(TOKEN_REGEX), ([keyword]) => keyword),
    ...cjkBigrams(text),
  ];

  return Array.from(new Set(keywords))
    .filter((keyword) => keyword.length >= 2 && keyword !== text)
    .map((keyword) => ({
      keyword,
      required: false,
    }));
}
