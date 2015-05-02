angular.module('firebase.config', [])
  .constant('FBURL', 'https://amber-fire-8525.firebaseio.com')
  .constant('SIMPLE_LOGIN_PROVIDERS', ['password'])

  .constant('loginRedirectPath', '/login');
