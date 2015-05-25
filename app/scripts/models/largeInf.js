'use strict';

angular.module('nerdproxyApp')
  .factory('LargeInf', function (Inf) {

    function LargeInf(modelData) {
      Inf.call(this, modelData);
    }

    LargeInf.prototype = Object.create(Inf.prototype);

    _.extend(LargeInf.prototype, {

      constructor: LargeInf,

      baseRadius: 2,

      getSyncData: function () {
        return {
          id: this.id,
          xCm: this.xCm,
          yCm: this.yCm,
          type: 'largeInf',
          colour: this.colour
        }
      }
    });

    return (LargeInf);

  }
);
