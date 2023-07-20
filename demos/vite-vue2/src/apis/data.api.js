import { get } from '/@/utils/axios'

export function GetDataApi() {
  return get('/api/data')
}
