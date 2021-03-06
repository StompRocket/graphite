<template>
  <div class="home page">
    <nav class="nav">
      <router-link to="/">
        <img class="brand--wordmark" src="@/assets/wordmark.svg" />
      </router-link>

      <form @submit.prevent class="search__form">
        <input
          v-model="search"
          type="text"
          class="input search"
          :placeholder="$t('search')"
        />
      </form>
      <button class="btn new" @click="newDoc">{{ $t('new') }}</button>
      <Locale v-if="prominentLocale"></Locale>

      <router-link to="/settings"><img

          :src="$store.getters.user.photoURL"
          class="user"
          alt=""
      /></router-link>
    </nav>
    <div v-if="accountInfo" class="accountButton">
      <Locale></Locale>
      <p class="email">{{ user.email }}</p>
      <button class="btn" @click="logOut">{{ $t('logout') }}</button>
    </div>
    <div v-if="feedback" class="feedBackBar">
      <div class="container">
        <p>Do you Have Feedback?</p>
        <button class="btn--dark" @click="feedBack()">Tell us what you think</button>
      </div>

    </div>
    <div v-if="!docsLoaded" class="loading">
      <div class="sk-cube-grid">
        <div class="sk-cube sk-cube1"></div>
        <div class="sk-cube sk-cube2"></div>
        <div class="sk-cube sk-cube3"></div>
        <div class="sk-cube sk-cube4"></div>
        <div class="sk-cube sk-cube5"></div>
        <div class="sk-cube sk-cube6"></div>
        <div class="sk-cube sk-cube7"></div>
        <div class="sk-cube sk-cube8"></div>
        <div class="sk-cube sk-cube9"></div>
      </div>
      <img src="@/assets/wordmark.svg" alt="" />
      <p class="version">v{{ version }}</p>
    </div>
    <div class="documents">
      <router-link
        :to="openUrl(doc)"
        :key="doc.id"
        v-for="doc in filteredDocs"
        class="document"
      >
        <p class="title">{{ doc.title }}</p>
        <p class="description">
          {{ $t('opened') }}: {{ lastEdited(doc.opened) }}. {{ $t('owner') }}:
          {{ doc.owner }}
        </p>
      </router-link>
      <div v-if="docs.length <= 0 && docsLoaded" class="noDocs">
        <img src="../assets/undraw_files_6b3d.svg" alt="No Documents" />
        <h3>{{ $t('noDocs') }}</h3>
        <p>{{ $t('noDocsDesc') }}</p>
      </div>
    </div>
    <div v-if="featureModal" class="modal_container">
      <div class="modal--feature">
        <img src="../assets/undraw_around_the_world_v9nu.svg" alt="" />
        <h3>{{ $t('feature.new') }}</h3>
        <p>{{ $t('feature.supports') }}</p>
        <p>{{ $t('feature.translate') }}</p>
        <p>
          {{ $t('feature.support') }}:
          <a href="mailto:support@graphitewriter.com"
            >support@graphitewriter.com</a
          >
        </p>
        <p>{{ $t('feature.useBox') }}</p>
        <Locale></Locale>
        <button @click="closeFeatureModal" class="btn">{{ $t('ok') }}</button>
      </div>
      <div class="modal_container" @click="closeFeatureModal"></div>
    </div>
  </div>
</template>

<script>
import Locale from '@/components/locale.vue'

let timeout = null
export default {
  name: 'Home',
  head: {
    title: {
      inner: "Graphite Writer",
      complement: 'Documents'
    },

  },
  data() {
    return {
      featureModal: false,
      prominentLocale: this.$config.getValue('prominentLocalDisplay').asBoolean(),
      feedbackConfig: this.$config.getValue('feedback').asBoolean(),
      locale: 'en',
      search: '',
      loaded: false,
      accountInfo: false,
      version: require('../../package.json').version,
      trace: this.$perf.trace('loadDocuments'),
      feedback: false
    }
  },
  created() {
    this.trace.start()
  },
  computed: {
    docsLoaded() {
      return this.$store.state.docsLoaded
    },
    docs() {
      if (this.$store.getters.userDocs.length > 0) {
        if (this.$analytics) {
          this.$analytics.setUserProperties({
            docCount: this.$store.getters.userDocs.length,
          })
        }
      }

      return this.$store.getters.userDocs
    },
    filteredDocs() {
      if (this.search.length <= 0) {
        return this.$store.state.docs
      } else {
        return this.$store.state.docs.filter((i) => {
          clearTimeout(timeout)
          timeout = setTimeout(this.logSearch, 1000)
          return i.title.toLowerCase().indexOf(this.search.toLowerCase()) > -1
        })
      }
    },
    photoURL() {
      return `url(${this.$store.state.user.photoURL}) no-repeat center center`
    },
    user() {
      return this.$store.state.user
    },
  },
  methods: {
    feedBack() {
      window.localStorage.setItem("feedback", "true")
      this.feedback = false
      if (this.$analytics) {
        this.$analytics.logEvent('openedFeedback')
      }
      var win = window.open("https://ronan092344.typeform.com/to/WkVNS1", '_blank');
      win.focus()
    },
    closeFeatureModal() {
      this.featureModal = false
      if (this.$analytics) {
        this.$analytics.logEvent('closedLanguageFeature')
      }
      localStorage.setItem('languageFeature', 'true')
    },
    openUrl(doc) {
      if (doc.sharedDoc) {
        return '/shared/' + this.user.uid + '/' + doc.id
      } else {
        return '/d/' + this.user.uid + '/' + doc.id
      }
    },
    logSearch() {
      console.log('Log search')
      timeout = null
      if (this.$analytics) {
        this.$analytics.logEvent('searching')
      }
    },
    logOut() {
      if (this.$analytics) {
        this.$analytics.logEvent('logout')
      }
      this.$firebase
        .auth()
        .signOut()
        .then(() => {
          window.location.href = 'https://graphitewriter.com'
        })
    },
    lastEdited(time) {
      return this.$moment.unix(time).fromNow()
    },
    newDoc() {
      swal(this.$t('newDocName') + ':', {
        content: 'input',
        button: this.$t('ok'),
      }).then((value) => {
        if (value != null) {
          if (value.length <= 0) {
            value = 'Untitled'
          }

          fetch(`${this.$store.getters.api}/api/v1/documents/new`, {
            method: 'post',
            headers: {
              Authorization: this.$store.getters.fbToken,
              'content-type': 'application/json',
            },
            body: JSON.stringify({ title: value, time: this.$moment().unix() }),
          })
            .then((res) => res.json())
            .then((res) => {
              if (res.success) {
                if (this.$analytics) {
                  this.$analytics.logEvent('newDoc')
                }
                this.$router.push(
                  `/d/${this.$store.getters.user.uid}/${res.id}`
                )
              }
            })
        }
      })
    },
  },
  components: { Locale },
  mounted() {
    if (this.$analytics) {
      this.$analytics.logEvent('openedDocumentsPage')
    }
    this.$firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        this.$firebase
          .auth()
          .currentUser.getIdToken(/* forceRefresh */ true)
          .then((idToken) => {
            if (!localStorage.getItem('feedback') && this.feedbackConfig) {
              this.feedback = true
            }
            // Send token to your backend via HTTPS
            this.$store.commit('setToken', idToken)
            this.$store.dispatch('fetchDocs')
            this.loaded = true
            this.trace.stop()
            if (
              !localStorage.getItem('languageFeature') &&
              this.prominentLocale
            ) {
              this.featureModal = true
              if (this.$analytics) {
                this.$analytics.logEvent('shownLanguageFeature')
              }
            }
            //console.log( this.$store.state.token)
          })
      } else {
      }
    })
  },
}
</script>
