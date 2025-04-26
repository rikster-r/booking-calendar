export function extractAvitoId(url: string) {
  // extracts 6 or more digits followed by a slash, question mark, or the end of the string
  const match = url.match(/_(\d{6,})(?:[/?]|$)/);
  return match ? Number(match[1]) : undefined;
}

export function validateAvitoUrl(url: string) {
  const avitoLinkRegex =
    /^https:\/\/www\.avito\.ru(\/[\w\-._~:\/?#[\]@!$&'()*+,;=]*)?$/;
  return avitoLinkRegex.test(url);
}
