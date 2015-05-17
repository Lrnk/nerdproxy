'use strict';

angular.module('nerdproxyApp')
  .directive('modelControls', function () {
    return {
      restrict: 'E',
      templateUrl: 'views/modelControls.html',
      replace: true,
      link: function postLink() {


      }
    };
  });
