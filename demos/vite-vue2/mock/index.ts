import { createProdMockServer } from 'vite-plugin-mock/es/createProdMockServer'
import dataApi from './apis/data'
export function setupProdMockServer() {
  createProdMockServer([...dataApi])
}
