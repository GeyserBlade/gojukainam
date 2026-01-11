/**
 * Helper to extract string from req.params which can be string | string[]
 */
export function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) {
    return param[0];
  }
  return param || '';
}
