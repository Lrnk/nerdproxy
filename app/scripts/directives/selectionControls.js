'use strict';

angular.module('nerdproxyApp')
  .directive('selectionControls', function () {
    return {
      restrict: 'E',
      templateUrl: 'views/selectionControls.html',
      replace: true,
      link: function postLink() {


      }
    };
  });
