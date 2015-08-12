var app = angular.module('app', []);

app.controller('MainCtrl', ['$scope', '$http', '$q',
    function ($scope, $http, $q) {

        var api_host = 'http://www.zhutian.com.tw',
            markets_ajax = $http.get(api_host + '/crop-trade/json/markets'),
            crops_ajax = $http.get(api_host + '/crop-trade/json/crops');

        $q.all([markets_ajax, crops_ajax]).then(function (result) {
            var markets = result[0].data,
                crops = result[1].data;

            $scope.markets = markets; // view data
            $scope.crops = crops; // view data

            $scope.market_selected = $scope.markets[0].code; // set default value 
            $scope.category_selected = $scope.crops[1].category; // set default value 

            if ($scope.category_selected) {
                $scope.getCropList($scope.category_selected);
            }
        });

        /* 取得該 Category 下的 Crop */
        $scope.getCropList = function (category_selected) {
            angular.forEach($scope.crops, function (el, i) {
                if (el.category === category_selected) {
                    $scope.crops_list = el.crops; // view data
                    $scope.crop_selected = $scope.crops_list[0].name; // set default value 
                    return true;
                }
            });
            if ($scope.crop_selected) {
                $scope.getCropIdList($scope.category_selected, $scope.crop_selected);
            }
        };

        /* 取得該 Category 下 Crop 的子項目, (ex 番茄:黑柿,粉柿,牛番茄) */
        $scope.getCropIdList = function (category_selected, crop_selected) {
            angular.forEach($scope.crops, function (el, i) {
                if (el.category === category_selected) {
                    angular.forEach(el.crops, function (subel, j) {
                        if (subel.name === crop_selected) {
                            $scope.crops_id_list = subel.data; // view data
                            $scope.crop_id_selected = $scope.crops_id_list[0].code; // set default value 
                            return true;
                        }
                    });
                }
            });
            if ($scope.crop_id_selected) {
                $scope.getCropTradePerMonth($scope.market_selected, $scope.crop_id_selected);
            }
        };


        /* 取得 Crop 每月價格/交易量數據 */
        $scope.getCropTradePerMonth = function (market_id, crop_id) {
            var url = api_host + '/crop-trade/public/stats/' + market_id + '/' + crop_id;
            $http.get(url).success(function (json) {
                $scope.crop_trade_per_month = json;

                var trade_date = [],
                    price_top = [],
                    price_median = [],
                    price_bottom = [],
                    price_avg = [],
                    amount = [],
                    o_price_chart = {},
                    o_amount_chart = {};
                angular.forEach($scope.crop_trade_per_month, function (el, i) {
                    trade_date.push(el.trade_date.replace(/-01$/g, ''));
                    price_avg.push(parseFloat(el.price_avg));
                    price_top.push(parseFloat(el.price_top));
                    price_median.push(parseFloat(el.price_median));
                    price_bottom.push(parseFloat(el.price_bottom));
                    amount.push(parseInt(el.amount));
                });

                o_price_chart.trade_date = trade_date;
                o_price_chart.data = [
                    // 交易量
                    {
                        type: 'column',
                        name: '交易量',
                        color: 'rgba(128, 133, 233, 0.30)',
                        data: amount,
                        yAxis: 1
                    },
                    // 價
                    {
                        type: 'line',
                        name: '上價',
                        color: Highcharts.getOptions().colors[1],
                        data: price_top
                        // yAxis: 0,
                    },
                    {
                        type: 'line',
                        name: '中價',
                        color: Highcharts.getOptions().colors[2],
                        data: price_median
                        //yAxis: 0,
                    },
                    {
                        type: 'line',
                        name: '下價',
                        color: Highcharts.getOptions().colors[3],
                        data: price_bottom
                        // yAxis: 0,
                    },
                    {
                        type: 'line',
                        name: '均價',
                        color: Highcharts.getOptions().colors[0],
                        data: price_avg,
                        //yAxis: 0
                    }
                ];

                o_amount_chart.trade_date = trade_date;
                o_amount_chart.data = [{
                    type: 'column',
                    name: '交易量',
                    data: amount
                }];

                // 農產品項目每月交易資料不足 12 筆的話，就不 render chart
                if ($scope.crop_trade_per_month.length > 12) {
                    $('#price').show();
                    $scope.renderPriceChart(o_price_chart.trade_date, o_price_chart.data);
                } else {
                    $('#price').hide();
                }


            });
        };

        $scope.renderPriceChart = function (trade_date, data) {

            $('#price').highcharts({
                chart: {
                    zoomType: 'xy'
                },
                title: {
                    text: '單一農產品每月均價'
                },
                subtitle: {
                    text: 'Source: http://amis.afa.gov.tw/'
                },
                xAxis: {
                    categories: trade_date,
                    crosshair: true
                },
                yAxis: [
                    {
                        labels: {
                            format: 'NT {value}',
                            style: {
                                color: Highcharts.getOptions().colors[1]
                            }
                        },
                        title: {
                            text: null
                        },
                        min: 0
                    },
                    {
                        labels: {
                            format: '{value} 個',
                            style: {
                                color: 'rgba(128, 133, 233, 1)'
                            }
                        },

                        title: {
                            text: null
                        },
                        min: 0,
                        opposite: true
                }],
                tooltip: {
                    shared: true
                },
                legend: {
                    layout: 'vertical',
                    align: 'right',
                    x: -80,
                    verticalAlign: 'top',
                    y: 20,
                    floating: true,
                    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'
                },
                series: data
            });

        };
}]);