import Vue from 'vue'
import App from './App.vue'
import { createPinia, PiniaVuePlugin } from 'pinia'
import router from './router'
import Loading from 'element-ui/lib/loading'
import 'element-ui/lib/theme-chalk/loading.css'

Vue.use(Loading)

Vue.use(PiniaVuePlugin)
const pinia = createPinia()
Vue.prototype.$ELEMENT = { size: 'mini', zIndex: 3000 }
new Vue({
  render: (h) => h(App),
  pinia,
  router,
}).$mount('#app')
