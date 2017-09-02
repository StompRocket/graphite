function GetURLParameter (sParam) {
  var sPageURL = window.location.search.substring(1)
  var sURLVariables = sPageURL.split('&')
  for (var i = 0; i < sURLVariables.length; i++) {
    var sParameterName = sURLVariables[i].split('=')
    if (sParameterName[0] == sParam) {
      return sParameterName[1]
    }
  }
}

var toolbarOptions = [
  ['bold', 'italic', 'underline', 'strike'], // toggled buttons
  ['blockquote', 'code-block'],
  [{
    'header': 1
  }, {
    'header': 2
  }], // custom button values
  [{
    'list': 'ordered'
  }, {
    'list': 'bullet'
  }],
  [{
    'script': 'sub'
  }, {
    'script': 'super'
  }], // superscript/subscript
  [{
    'indent': '-1'
  }, {
    'indent': '+1'
  }], // outdent/indent
  [{
    'direction': 'rtl'
  }], // text direction

  [{
    'header': [1, 2, 3, 4, 5, 6, false]
  }],

  [{
    'color': []
  }, {
    'background': []
  }], // dropdown with defaults from theme
  [{
    'font': []
  }],
  [{
    'align': []
  }],

  ['clean'] // remove formatting button
]
$(document).ready(function ($) {
  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      var user = firebase.auth().currentUser

      var name, email, photoUrl, uid, emailVerified

      if (user != null) {
        name = user.displayName
        email = user.email
        photoUrl = user.photoURL
        emailVerified = user.emailVerified
        uid = user.uid // The user's ID, unique to the Firebase project. Do NOT use
        // this value to authenticate with your backend server, if
        // you have one. Use User.getToken() instead.
      }
      const documentname = GetURLParameter('d')

      function saveDocument (data) {
        firebase.database().ref('users/' + uid + '/docs/' + documentname + '/').set({
          data: data
        })
      }

      function updateContents () {
        firebase.database().ref('users/' + uid + '/docs/' + documentname + '/').once('value').then(function (snapshot) {
          var data = snapshot.val().data

          quill.setContents(data)
        })
      }
      updateContents()
      quill.update()
      quill.on('text-change', function (delta, oldDelta, source) {
        console.log('change')
        var currentdocument = quill.getContents()
        saveDocument(currentdocument)
      })
    }
  })

  var quill = new Quill('#editor', {
    modules: {
      toolbar: toolbarOptions
    },
    placeholder: 'Compose an epic...',
    theme: 'snow'
  })
})
