const WIALON_API_URL = process.env.WIALON_API_URL!
const WIALON_TOKEN = process.env.WIALON_TOKEN!

export async function wialonRequest(svc: string, params: Record<string, unknown> = {}) {
  const loginRes = await fetch(`${WIALON_API_URL}?svc=token/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      svc: 'token/login',
      params: { token: WIALON_TOKEN },
    }),
  })

  const loginData = await loginRes.json()
  if (loginData.error) {
    throw new Error(`Wialon token/login failed: ${JSON.stringify(loginData.error)}`)
  }

  const sid: string = loginData.eid

  const res = await fetch(`${WIALON_API_URL}?svc=${svc}&sid=${sid}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ svc, params }),
  })

  const data = await res.json()
  if (data.error) {
    throw new Error(`Wialon ${svc} failed: ${JSON.stringify(data.error)}`)
  }

  return data
}
