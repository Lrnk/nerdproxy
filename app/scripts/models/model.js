'use strict';

angular.module('nerdproxyApp')
  .factory('Model', function () {

    function Model() {
      if (this.constructor === Model) {
        throw new Error("Tried to instantiate abstract class!");
      }
    }

    Model.prototype = {

      createSnap: abstractMethod,
      setPos: abstractMethod,
      startMove: abstractMethod,
      continueMove: abstractMethod,
      endMove: abstractMethod,
      getSyncData: abstractMethod,

      select: function () {
        this.snap.addClass('selected');
      },

      deselect: function () {
        this.snap.removeClass('selected');
      }

    };

    _.extend(Model, {

      getModelIdFromElement: function getModelIdFromElement(element) {

        if (!element || !element instanceof SVGElement) {
          return undefined;

        } else if (element.className && element.className.baseVal && ~element.className.baseVal.indexOf('model ')) {
          return $(element).data('modelId');

        } else {
          return getModelIdFromElement(element.parentElement);
        }

      }
    });


    return (Model);


    function abstractMethod() {
      throw new Error("Tried to call abstract method");
    }

  }
);
