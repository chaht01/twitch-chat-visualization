var app = angular.module('twitch_vis', ['ngRoute', 'ngAnimate', 'ngSanitize'])
    .config(function($routeProvider) {

        $routeProvider
            .when('/', {
                controller:'VideoListController as videoList',
                templateUrl:'partials/list.html'
            })
            .when('/detail/:videoId', {
                controller:'DetailVideoController as detailVideo',
                templateUrl:'partials/detail.html'
            })
            .otherwise({
                redirectTo:'/'
            });
    })
