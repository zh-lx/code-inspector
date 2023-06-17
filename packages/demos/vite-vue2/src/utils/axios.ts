import axios, { ResponseType } from 'axios'
import { NoticeType } from 'types/axios'
import Notification from 'element-ui/lib/notification'

const instance = axios.create({
  timeout: 30000,
})

// request拦截器
instance.interceptors.request.use(
  (config) => {
    return config
  },
  (err) => {
    return Promise.reject(err)
  }
)

// response拦截器
instance.interceptors.response.use(
  (response) => {
    return response
  },
  (err) => {
    if (err.response) {
      switch (err.response.status) {
        case 401:
          break
        default:
          break
      }
      if (err.response?.data) {
        return Promise.reject(err.response.data)
      }
    } else {
      return Promise.reject(err)
    }
  }
)

export const get = (
  url: string,
  params: any,
  notice: NoticeType,
  responseType: ResponseType
): Promise<any> => {
  return new Promise((resolve, reject) => {
    instance({
      url,
      method: 'get',
      responseType: responseType || 'json',
      params,
    })
      .then((res) => {
        if (res.status === 200) {
          resolve(res.data)
        } else {
          throw res
        }
      })
      .catch((err) => {
        console.error(err, 'Get err')
        if (notice) {
          let message = err?.data?.desc
          if (err.message && err.message.indexOf('timeout') !== -1) {
            message = notice.timeoutMsg || '接口超时'
          }
          Notification.warning({
            title: notice.title,
            message: message,
          })
        }
        reject(err)
      })
  })
}

export const post = (
  url: string,
  params: any,
  notice: NoticeType
): Promise<any> => {
  return new Promise((resolve, reject) => {
    instance({
      url,
      method: 'post',
      data: params,
    })
      .then((res) => {
        if (res.status === 200) {
          resolve(res.data)
        } else {
          throw res
        }
      })
      .catch((err) => {
        console.error(err, 'Post err')
        if (notice) {
          let message = err?.data?.desc
          if (err.message.indexOf('timeout') !== -1) {
            message = notice.timeoutMsg || '接口超时'
          }
          Notification.warning({
            title: notice.title,
            message: message,
          })
        }
        reject(err)
      })
  })
}

export const getDownload = (url: string, params: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    instance({
      url: url,
      method: 'get',
      params,
      responseType: 'blob',
    })
      .then((res) => {
        if (res.status === 200) {
          const data = res.data
          if (data.size === 0) {
            resolve({
              code: -1,
              msg: '暂无文件',
              data: '',
            })
          }
          const r = new FileReader()
          r.onload = () => {
            // 如果JSON.parse不报错，说明result是json字符串，则可以推测是下载报错情况下返回的对象，类似于{code: 0}
            // 如果JSON.parse报错，说明是下载成功，返回的二进制流，则进入catch进行后续处理
            try {
              const resData = JSON.parse(<string>r.result) // this.result为FileReader获取blob数据转换为json后的数据，即后台返回的原始数据
              // 如果执行到这里，说明下载报错了，进行后续处理
              resolve({
                code: -1,
                msg: '暂无文件',
                data: resData,
              })
            } catch (err) {
              // 正常处理
              let fileName = res.headers['content-disposition']
              // 获取文件名
              if (fileName && fileName.length >= 2) {
                fileName = fileName.split('=')[1]
              }
              fileName = decodeURIComponent(fileName)
              // 兼容ie11
              if (window.navigator.msSaveOrOpenBlob) {
                try {
                  const blobObject = new Blob(data)
                  window.navigator.msSaveOrOpenBlob(blobObject, fileName)
                } catch (e) {
                  resolve({
                    code: -1,
                    msg: '暂无文件',
                    data: '',
                  })
                }
                return
              }
              const url = window.URL.createObjectURL(data)
              resolve({
                code: 200,
                msg: '获取成功',
                data: {
                  url,
                  fileName,
                },
              })
            }
          }
          r.readAsText(data) // FileReader的API
        } else {
          throw res
        }
      })
      .catch((err) => {
        console.error(err, 'Post err')
        reject(err)
      })
  })
}
