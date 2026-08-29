export function hasSpeechContent(body: string): boolean {
  return /[\p{L}\p{N}]/u.test(body);
}
