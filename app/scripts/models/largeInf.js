'use strict';

angular.module('nerdproxyApp')
  .factory('LargeInf', function (Inf) {

    function LargeInf(modelData) {
      Inf.call(this, modelData);
      this.baseRadius = 2;
    }

    LargeInf.prototype = Object.create(Inf.prototype, {
      getSyncData: {
        value: function () {
          return {
            id: this.id,
            xCm: this.xCm,
            yCm: this.yCm,
            type: 'largeInf'
          }
        }
      }
    });

    LargeInf.prototype.constructor = LargeInf;

    return (LargeInf);

  }
);
