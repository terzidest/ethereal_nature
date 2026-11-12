/** Summaries show headings without the `*emphasis*` markers the storefront italicises. */
export const plain = (text: string) => text.replaceAll('*', '')
