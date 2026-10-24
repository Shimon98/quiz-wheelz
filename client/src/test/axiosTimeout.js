// What axios rejects with when a request's own timeout ends a silent wait:
// code ECONNABORTED, a request and no response.
export function axiosTimeoutAfter(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => reject({ code: "ECONNABORTED", message: `timeout of ${ms}ms exceeded`, request: {} }), ms);
  });
}
