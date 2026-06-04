import {
  makeBackendRequest,
  makeBackendRequestRaw,
  BffResponseBuilder,
} from '@/bff/utils'

/**
 * BFF proxy for the Permission Report endpoint.
 *
 * Frontend URL: GET /api/admin/reports/permission-report?format=json|xlsx|pdf&userId=&menuId=&menuType=&page=&perPage=
 * Backend URL : GET /api/admin/reports/permissions?...same params...
 *
 * For `format=json` the response is the standard JSON envelope and the BFF
 * wraps it via `BffResponseBuilder.send(...)`.
 *
 * For `format=xlsx` and `format=pdf` the backend streams a binary blob; the
 * BFF must relay the body unchanged together with the original
 * Content-Type / Content-Disposition headers. To guard against accidental
 * "export the entire matrix" requests, the BFF rejects xlsx/pdf calls that
 * carry no filter (matching backend behaviour, with a friendlier message).
 */
export const APIRoute = {
  GET: async ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    const format = (url.searchParams.get('format') || 'json').toLowerCase()

    if (!['json', 'xlsx', 'pdf'].includes(format)) {
      return new BffResponseBuilder(400).send(
        false,
        `Invalid format: ${format}. Must be one of json, xlsx, pdf.`,
        null
      )
    }

    const userId = url.searchParams.get('userId')
    const menuId = url.searchParams.get('menuId')

    if ((format === 'xlsx' || format === 'pdf') && !userId && !menuId) {
      return new BffResponseBuilder(400).send(
        false,
        'Excel/PDF export requires at least one filter (userId or menuId).',
        null
      )
    }

    // Forward every original query param to the backend as-is. The backend's
    // contract already covers format / userId / menuId / menuType / page / perPage.
    const backendPath = `/api/admin/reports/permissions${url.search}`

    if (format === 'json') {
      const result = await makeBackendRequest(backendPath, { method: 'GET' }, request)
      return new BffResponseBuilder(result.status).send(
        result.success,
        result.message,
        result.data,
        result.meta
      )
    }

    // Binary path (xlsx / pdf) — relay status, headers, and body bytes.
    const upstream = await makeBackendRequestRaw(backendPath, { method: 'GET' }, request)
    if (!upstream.ok) {
      // The backend always returns JSON on error; try to read & forward it.
      const errBody = await upstream.text().catch(() => '')
      let message = `Backend returned ${upstream.status}`
      try {
        const parsed = JSON.parse(errBody)
        message = parsed?.message || message
      } catch {
        if (errBody) message = errBody
      }
      return new BffResponseBuilder(upstream.status).send(false, message, null)
    }

    // Copy through the binary body together with the headers we care about.
    const headers = new Headers()
    const contentType =
      upstream.headers.get('content-type') ||
      (format === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf')
    headers.set('Content-Type', contentType)

    const disposition =
      upstream.headers.get('content-disposition') ||
      `attachment; filename="permission-report.${format}"`
    headers.set('Content-Disposition', disposition)

    const contentLength = upstream.headers.get('content-length')
    if (contentLength) headers.set('Content-Length', contentLength)

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    })
  },
}
