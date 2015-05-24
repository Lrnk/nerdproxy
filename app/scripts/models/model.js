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

    return (Model);



    function abstractMethod() {
      throw new Error("Tried to call abstract method");
    }

  }
);
