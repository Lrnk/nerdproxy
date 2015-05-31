'use strict';

angular.module('nerdproxyApp')
  .directive('modelControls', function () {
    return {
      restrict: 'E',
      templateUrl: 'views/modelControls.html',
      replace: true,
      scope: true,
      controller: function ($scope) {

        $scope._ = _;

        $scope.$on('modelSelection', function (e) {

          var selectedModels = $scope.getSelectedModels();

          if (selectedModels && selectedModels.length === 1) {
            $scope.menuItems = selectedModels[0].getContextMenuItems();

          } else if (selectedModels && selectedModels.length > 1) {
            $scope.menuItems = ['moveSelection', 'removeSelection']

          } else {
            $scope.menuItems = [];
          }

        })
      },

      link: function postLink(scope) {

        $('.colour-picker').spectrum({
          showPaletteOnly: true,
          showPalette: true,
          color: 'green',
          palette: [
            ['green', '#667C26', '#254117', 'goldenrod', '#FBB117', '#C35817', '#F88017', '#8467D7', '#8EEBEC']
          ],
          change: function (colour) {
            _.each(scope.getSelectedModels(), function (model) {
              model.setColour(colour.toHexString());
            });
          }
        });

        scope.$on('modelSelection', function () {
          $('.colour-picker').spectrum('hide');
        });

      }
    };
  });
