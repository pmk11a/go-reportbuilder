import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '../../middleware/auth'
import { makeBackendRequest, makeBackendRequestRaw } from '../../backend'

export const getKasBankListFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { query?: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const url = data.query ? `/api/accounting/kasbank${data.query}` : '/api/accounting/kasbank'
    const result = await makeBackendRequest(url, { method: 'GET' }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const getKasBankByNoBuktiFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { noBukti: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(
      `/api/accounting/kasbank/?noBukti=${encodeURIComponent(data.noBukti)}`,
      { method: 'GET' },
      accessToken
    )
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const createKasBankFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { body: any }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest('/api/accounting/kasbank', {
      method: 'POST',
      body: JSON.stringify(data.body),
    }, accessToken)
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const updateKasBankFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { noBukti: string; body: any }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(
      `/api/accounting/kasbank/?noBukti=${encodeURIComponent(data.noBukti)}`,
      { method: 'PUT', body: JSON.stringify(data.body) },
      accessToken
    )
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const deleteKasBankFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { noBukti: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(
      `/api/accounting/kasbank/?noBukti=${encodeURIComponent(data.noBukti)}`,
      { method: 'DELETE' },
      accessToken
    )
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const getKasBankDetailListFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { noBukti: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(
      `/api/accounting/kasbank/detail?noBukti=${encodeURIComponent(data.noBukti)}`,
      { method: 'GET' },
      accessToken
    )
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const getKasBankDetailFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { noBukti: string; urut: number }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(
      `/api/accounting/kasbank/detail/${data.urut}?noBukti=${encodeURIComponent(data.noBukti)}`,
      { method: 'GET' },
      accessToken
    )
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const addKasBankDetailFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { noBukti: string; body: any }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(
      `/api/accounting/kasbank/detail?noBukti=${encodeURIComponent(data.noBukti)}`,
      { method: 'POST', body: JSON.stringify(data.body) },
      accessToken
    )
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const updateKasBankDetailFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { noBukti: string; urut: number; body: any }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(
      `/api/accounting/kasbank/detail/${data.urut}?noBukti=${encodeURIComponent(data.noBukti)}`,
      { method: 'PUT', body: JSON.stringify(data.body) },
      accessToken
    )
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const deleteKasBankDetailFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { noBukti: string; urut: number }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(
      `/api/accounting/kasbank/detail/${data.urut}?noBukti=${encodeURIComponent(data.noBukti)}`,
      { method: 'DELETE' },
      accessToken
    )
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const setOtorisasiFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { noBukti: string; body: any }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(
      `/api/accounting/kasbank/otorisasi?noBukti=${encodeURIComponent(data.noBukti)}`,
      { method: 'POST', body: JSON.stringify(data.body) },
      accessToken
    )
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const batalOtorisasiFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { noBukti: string; body: any }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(
      `/api/accounting/kasbank/batal-otorisasi?noBukti=${encodeURIComponent(data.noBukti)}`,
      { method: 'POST', body: JSON.stringify(data.body) },
      accessToken
    )
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const generateNoBuktiFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { tipe: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const result = await makeBackendRequest(
      `/api/accounting/kasbank/generate-no-bukti?tipe=${encodeURIComponent(data.tipe)}`,
      { method: 'GET' },
      accessToken
    )
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const lookupPerkiraanFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { q: string; kelompokKas?: boolean; limit?: number }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const sp = new URLSearchParams({
      q: data.q,
      kelompokKas: String(data.kelompokKas ?? false),
      limit: String(data.limit ?? 50),
    })
    const result = await makeBackendRequest(
      `/api/accounting/kasbank/lookup-perkiraan?${sp.toString()}`,
      { method: 'GET' },
      accessToken
    )
    if (!result.success) throw new Error(result.message)
    return result.data
  })

export const downloadKasBankPdfFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { noBukti: string }) => data)
  .handler(async ({ data, context }) => {
    const { accessToken } = context as { accessToken: string }
    const response = await makeBackendRequestRaw(
      `/api/accounting/kasbank/pdf?noBukti=${encodeURIComponent(data.noBukti)}`,
      { method: 'GET' },
      accessToken
    )
    if (!response.ok) throw new Error(`Download failed: ${response.status}`)
    const buffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'application/pdf'
    return {
      buffer: Array.from(new Uint8Array(buffer)),
      contentType,
    }
  })
