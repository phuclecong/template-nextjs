import axios from "axios"
import simpleRestDataProvider from "@refinedev/simple-rest"
import { getAuthToken } from "./auth-provider"

/**
 * Refine dataProvider pointed at the mock API (ADR-0002, ADR-0005). A request
 * interceptor attaches the in-memory access token so the MSW worker can
 * resolve the caller for authorization.
 */
const httpClient = axios.create()

httpClient.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const apiUrl = "/api"

export const dataProvider = simpleRestDataProvider(apiUrl, httpClient)
