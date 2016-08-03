'use strict'

###*
 * @ngdoc directive
 * @name AdminLayout.directive:contentHeight
 * @scope
 * @restrict A
 *
 * @description
 * Fix the contentContainer height (dependant on whether to include the header or the footer in the calculations)
 * Emits & boradcasts 'content.changed' event
 *
 * @param {boolean}  includeHeader  (optional) include the header in the calculation of the content height
 * @param {boolean}  includeFooter  (optional) include the footer in the calculation of the content height
###
angular.module('AdminLayout').directive 'contentHeight', ['$window', '$timeout', ($window, $timeout) ->
  {
    restrict: 'A',
    link: (scope, element, attributes) ->

      includeFooter = true
      includeHeader = true

      includeHeader = attributes.includeHeader if attributes.includeHeader?
      includeFooter = attributes.includeFooter if attributes.includeFooter?

      $timeout (->
        _contentHeightSetup()
        return
      ), 10
      angular.element($window).bind 'resize', ->
        _contentHeightSetup()
        return

      _contentHeightSetup = ->
        height = $window.innerHeight
        #subtrackt the header height
        height = height-angular.element(document).find('header')[0].offsetHeight if includeHeader == true
        #subtrackt the footer height
        height = height-angular.element(document).find('footer')[0].offsetHeight if includeFooter == true

        element.css {
          height : height + 'px'
        }
        #inform parents and children (custom-scrollbars, full-height iframes etc) that height has changed
        scope.$emit 'content.changed', {height : height}
        scope.$broadcast 'content.changed', {height : height}
        return
      return
  }
]
