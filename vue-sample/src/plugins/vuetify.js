import Vue from 'vue'
import Vuetify from "vuetify";
import 'vuetify/dist/vuetify.min.css'

Vue.use(Vuetify)

const opt = {
  theme: {
    themes:{
      light:{
        primary: '#FF3399'
      }
    }
  }
}

export default new Vuetify(opt);