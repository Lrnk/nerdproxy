'use strict';

angular.module('nerdproxyApp')
  .directive('chatBox', function () {
    return {
      restrict: 'E',
      templateUrl: 'views/chatBox.html',
      replace: true,
      link: function postLink() {


      }
    };
  });
