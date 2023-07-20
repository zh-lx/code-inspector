import axios from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';
import localConfig from '@/config';
import { selectToken } from '@/store/reducer/userSlice';
import { store, persistor } from '@/store';
import { message } from '@/hooks/useGlobalTips';
import { downloadStreamFile } from '@/utils/utils';

type HttpStatusCode = keyof typeof localConfig.api.status;

export interface DTO<ResDataType = any> {
  Code: HttpStatusCode;
  Data: ResDataType;
  Message: string | undefined;
  Success: boolean;
}

class Request {
  private instance: AxiosInstance;

  private baseConfig: AxiosRequestConfig = {
    baseURL: localConfig.api.baseUrl,
    timeout: localConfig.api.timeout
  };

  public constructor(config: AxiosRequestConfig = {}) {
    // 创建axios实例
    this.instance = axios.create(Object.assign(this.baseConfig, config));
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        const token = selectToken(store.getState());
        if (token) {
          config.headers![localConfig.api.sessionKey] = token;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse<DTO>) => {
        const { headers, data } = response;
        if (headers['content-type']?.includes('application/json')) {
          // 服务端自定义的一套状态码，并不是真实的http状态码，如果处理http状态码错误，请至下面error错误函数中修改
          if (data.Code !== 200) {
            const errorText =
              data.Message ||
              localConfig.api.status[data.Code as HttpStatusCode] ||
              'HTTP响应错误';
            data.Code === 401 && persistor.purge(); // 退出登录
            message.error(errorText);
            return Promise.reject(errorText);
          }
        }
        return response;
      },
      (error) => {
        // 这里处理http状态码错误
        message.error(`${error.message}, 请检查网络或联系管理员`);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get 请求
   * @param url
   * @param config
   * @returns {DTO.Data} return response.data.Data
   */
  public get<ResData = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ResData> {
    return this.instance
      .get<DTO<ResData>>(url, config)
      .then(({ data }) => data.Data);
  }

  /**
   * Post 请求
   * @param url
   * @param data
   * @param config
   * @returns {DTO.Data} 直接返回数据部分 return response.data.Data
   */
  public post<Params = any, ResData = any>(
    url: string,
    data: Params,
    config?: AxiosRequestConfig
  ): Promise<ResData> {
    return this.instance
      .post<DTO<ResData>>(url, data, config)
      .then(({ data }) => data.Data);
  }

  /**
   * 获取Blob数据
   * @param url
   * @param data
   * @param config
   * @returns
   */
  public getBlob<Params = any>(
    url: string,
    data: Params,
    config?: AxiosRequestConfig
  ): Promise<{
    blob: Blob;
    filename?: string;
    fileType?: string;
  }> {
    return this.post(url, data, { responseType: 'blob', ...config }).then(
      (res) => {
        const { data, headers } = res;
        // if (headers['content-type'] === 'application/octet-stream') {}
        const fileType = headers['content-type'];
        const filename = headers['content-disposition'].split('=')[1];
        return { blob: data, filename: decodeURIComponent(filename), fileType };
      }
    );
  }

  /**
   * 请求流数据文件并直接下载
   * @param url
   * @param data
   * @param config
   * @returns
   */
  public async getStreamFileToDownload<Params = any>(
    url: string,
    data: Params,
    config?: AxiosRequestConfig
  ) {
    const { blob, filename, fileType } = await this.getBlob(url, data, config);
    downloadStreamFile(blob, filename, fileType);
    return { blob, filename, fileType };
  }

  /**
   * 应对其他情况的请求方法，如: 需要返回整个response.data 等。
   * @param {AxiosRequestConfig} config
   * @returns {AxiosResponse.data} return response.data
   */
  public request<ResData = any>(config: AxiosRequestConfig) {
    return this.instance
      .request<DTO<ResData>>(config)
      .then((response) => response.data);
  }
}

export default new Request();
