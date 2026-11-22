const BASE = '/api'

function getCsrf() {
  return (
    document.cookie
      .split('; ')
      .find((row) => row.startsWith('csrftoken='))
      ?.split('=')[1] ?? ''
  )
}

async function request(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()

  const isFormData =
    typeof FormData !== 'undefined' &&
    options.body instanceof FormData

  const isWrite =
    method !== 'GET' &&
    method !== 'HEAD' &&
    method !== 'OPTIONS'

  const headers = {
    Accept: 'application/json',

    ...(isFormData
      ? {}
      : {
          'Content-Type': 'application/json',
        }),

    ...(isWrite
      ? {
          'X-CSRFToken': getCsrf(),
        }
      : {}),

    ...(options.headers || {}),
  }

  console.log(
    `[API] ${method} ${BASE}${path}`
  )

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    method,
    credentials: 'include',
    headers,
  })

  /*
   * Handle unauthorized requests.
   */
  if (res.status === 401) {
    window.dispatchEvent(
      new Event('auth:unauthorized')
    )

    throw new Error('Unauthorized')
  }

  /*
   * 204 = No Content
   */
  if (res.status === 204) {
    return null
  }

  /*
   * Read the response.
   */
  let data = null

  const contentType =
    res.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    try {
      data = await res.json()
    } catch {
      data = null
    }
  } else {
    try {
      data = await res.text()
    } catch {
      data = null
    }
  }

  /*
   * Handle API errors.
   */
  if (!res.ok) {
    let message = `API error ${res.status}`

    if (data) {
      if (typeof data === 'string') {
        message = data
      } else if (
        typeof data === 'object'
      ) {
        /*
         * Django commonly returns:
         *
         * {
         *   "error": "Something went wrong."
         * }
         */
        if (
          typeof data.error === 'string' &&
          data.error.trim()
        ) {
          message = data.error
        }

        /*
         * Django REST Framework commonly returns:
         *
         * {
         *   "detail": "Something went wrong."
         * }
         */
        else if (
          typeof data.detail === 'string' &&
          data.detail.trim()
        ) {
          message = data.detail
        }

        /*
         * Handle field validation errors.
         */
        else {
          const messages = []

          Object.entries(data).forEach(
            ([field, value]) => {
              if (Array.isArray(value)) {
                messages.push(
                  `${field}: ${value.join(', ')}`
                )
              } else if (
                value &&
                typeof value === 'object'
              ) {
                messages.push(
                  `${field}: ${JSON.stringify(value)}`
                )
              } else if (
                value !== null &&
                value !== undefined
              ) {
                messages.push(
                  `${field}: ${String(value)}`
                )
              }
            }
          )

          if (messages.length > 0) {
            message = messages.join(' | ')
          }
        }
      }
    }

    console.error(
      `[API ERROR] ${method} ${BASE}${path}`,
      {
        status: res.status,
        data,
      }
    )

    const error = new Error(message)

    /*
     * Attach useful information to the Error object.
     * This lets pages such as LostAndFound.jsx
     * inspect the server response if needed.
     */
    error.status = res.status
    error.data = data
    error.path = path
    error.method = method

    throw error
  }

  console.log(
    `[API SUCCESS] ${method} ${BASE}${path}`,
    data
  )

  return data
}

export const api = {
  get: (path) =>
    request(path, {
      method: 'GET',
    }),

  post: (path, body) =>
    request(path, {
      method: 'POST',
      body:
        body instanceof FormData
          ? body
          : JSON.stringify(body),
    }),

  put: (path, body) =>
    request(path, {
      method: 'PUT',
      body:
        body instanceof FormData
          ? body
          : JSON.stringify(body),
    }),

  patch: (path, body) =>
    request(path, {
      method: 'PATCH',
      body:
        body instanceof FormData
          ? body
          : JSON.stringify(body),
    }),

  delete: (path) =>
    request(path, {
      method: 'DELETE',
    }),
}