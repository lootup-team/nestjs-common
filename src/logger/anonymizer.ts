export interface Anonymizer {
  maskFields<T extends object>(obj: T, fields: (string | RegExp)[]): T;
}
