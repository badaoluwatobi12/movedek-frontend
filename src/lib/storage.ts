// Browser local storage is intentionally disabled for SendAm app data.
// The frontend now reads/writes state through the backend PostgreSQL API.
export function safeGet(_key: string) {
  return null;
}
export function safeSet(_key: string, _value: string) {
  return;
}
