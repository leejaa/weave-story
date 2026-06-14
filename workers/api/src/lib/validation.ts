// UUID 형식 검증. 잘못된 path/body id로 Postgres가 "invalid uuid syntax"를 던져
// 500이 나는 것을 막고, 쿼리 전에 404/400으로 거른다.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}
