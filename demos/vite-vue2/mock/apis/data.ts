import { MockMethod } from 'vite-plugin-mock'

export default [
  {
    url: '/api/data',
    method: 'get',
    response: () => {
      return {
        code: 0,
        'data|10': [
          {
            date: '@DATE',
            name: '@NAME',
            address: '@county(true)',
          },
        ],
      }
    },
  },
] as MockMethod[]
