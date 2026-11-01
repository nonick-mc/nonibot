const MaxRetryAfterSeconds = 5;

export const fetchWithRetryAfter: typeof fetch = async (input, init) => {
  const res = await fetch(input, init);
  if (res.status !== 429) return res;

  const seconds = Number(res.headers.get('retry-after'));
  if (!(seconds >= 0 && seconds <= MaxRetryAfterSeconds)) return res;

  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  return fetch(input, init);
};
