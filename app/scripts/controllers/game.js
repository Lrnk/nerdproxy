'use strict';

/**
 * @ngdoc function
 * @name nerdproxyApp.controller:GameCtrl
 * @description
 * # GameCtrl
 * Controller of the nerdproxyApp
 */
angular.module('nerdproxyApp')
  .controller('GameCtrl', function ($scope) {

    var stuff = {
      zoomFactor: 1
    };

    angular.extend($scope, {

      stuff: stuff,

      zoomIn: zoomIn,
      zoomOut: zoomOut
    });

    function zoomIn() {
      stuff.zoomFactor *= 1.5;
    }

    function zoomOut() {
      stuff.zoomFactor /= 1.5;
      stuff.zoomFactor = Math.max(stuff.zoomFactor, 1);
    }

  });
