export function normalizeSentenceCaseLineStart(value: string): string {
  if (!value) return value;

  const firstAlphaIndex = value.search(/[A-Za-z]/);
  if (firstAlphaIndex < 0) return value;

  const currentChar = value[firstAlphaIndex];
  if (currentChar === currentChar.toUpperCase()) return value;

  const tokenMatch = value.slice(firstAlphaIndex).match(/^([A-Za-z0-9][A-Za-z0-9+&'./-]*)/);
  const firstToken = tokenMatch?.[1] ?? currentChar;
  const isSimpleLowercaseWord = /^[a-z]+$/.test(firstToken);
  if (!isSimpleLowercaseWord) return value;

  return `${value.slice(0, firstAlphaIndex)}${currentChar.toUpperCase()}${value.slice(firstAlphaIndex + 1)}`;
}
