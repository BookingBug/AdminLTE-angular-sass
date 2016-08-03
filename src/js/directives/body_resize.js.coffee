'use strict'

###*
 * @ngdoc directive
 * @name AdminLayout.directive:bodyResize
 * @scope
 * @restrict A
 *
 * @description
 * Toggle side-menu based on window size
 *
 * @param {object}  field   A field object
###
angular.module('AdminLayout').directive 'bodyResize', ['$window', '$timeout', 'AdminCoreOptions', ($window, $timeout, AdminCoreOptions) ->
  {
    restrict: 'A'
    link: (scope, element) ->
      $timeout (->
        _sideMenuSetup(true)
        return
      ), 0
      angular.element($window).bind 'resize', ->
        _sideMenuSetup()
        return

      _sideMenuSetup = (firstLoad = false) ->
        if $window.innerWidth > 768 && (!firstLoad || AdminCoreOptions.sidenav_start_open) && !AdminCoreOptions.deactivate_sidenav
          scope.page.sideMenuOn = true
        else
          scope.page.sideMenuOn = false
        scope.$apply()
        return

      return
  }
]
