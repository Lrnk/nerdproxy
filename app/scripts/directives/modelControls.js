'use strict';

angular.module('nerdproxyApp')
  .directive('modelControls', function () {
    return {
      restrict: 'E',
      templateUrl: 'views/modelControls.html',
      replace: true,
      scope: true,
      controller: function($scope) {

        $scope._ = _;

        $scope.$on('modelSelection', function(e, selectedModels) {

          if(selectedModels && selectedModels.length) {
            $scope.menuItems = selectedModels[0].getContextMenuItems();
          } else {
            $scope.menuItems = [];
          }

        })
      },

      link: function postLink(scope) {
      }
    };
  });
