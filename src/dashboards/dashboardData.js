import { forEach, includes, isEmpty, map, cloneDeep, clone, uniq, filter, max, sortBy, size, maxBy, property } from 'lodash';
export default class DashboardData {
  constructor(type, data) {
    this.data = data;
    this.type = type;
  }

  getData() {
    const charts = ['histogram', 'doublehistogram', 'doublehistogramwithouttrand', 'chart']
    if (this.type === 'progress') {
      return this.convertProgress();
    }

    if (this.type === 'table') {
      return this.convertTable();
    }

    if (this.type === 'number') {
      return this.convertNumber();
    }

    if (includes(charts, this.type)) {
      return this.convertChart();
    }

    if (this.type === 'pie') {
      return this.convertPie();
    }

    if (this.type === 'treemap') {
      return this.convertTreemap();
    }

    return {rows: []};
  }

  convertTable() {
    let self = this;
    let dashboard = {
      type: 'table',
      data: {
        rows: []
      }
    };

    if (!isEmpty(this.data.results)) {
      let aliases = this.getAliaces();
      forEach(this.data.results, function(item) {
        let row = [
          {
            value: {
              val: item.Measure,
              label: ''
            },
            title: aliases.Measure
          },{
            value: {
              val: Math.round(item.PercentValue) || 0,
              label: '%'
            },
            title: aliases.PercentValue
          },{
            value: {
              val: self.convertTableValue(+item.Value),
              label: ''
            },
            title: aliases.Fact
          },{
            value: {
              val: self.convertTableValue(+item.TargetValue),
              label: ''
            },
            title: aliases.Plan
          }
        ];

        dashboard.data.rows.push(row);
      });

      dashboard.data.extend = {
        val: true,
        min: 100,
        label: aliases.PercentValue
      };

      dashboard.data.sorted = {
        label: aliases.Measure,
        type: 'up'
      };
    }

    return dashboard;
  }

  convertProgress() {
    let self = this;
    let dashboard = {
      type: 'progress',
      data: {
        colorConfig: {
          value: 0.001,
          min: 100
        },
        chart: {title: '',  value: {val: 0, label: '%'}},
        rows: []
      }
    };

    if (!isEmpty(this.data.results)) {
      let item = this.data.results[0];
      let aliases = this.getAliaces();
      let percent = (item.PercentValue) ? +Math.floor(item.PercentValue).toFixed(0) : 0;
      dashboard.data.colorConfig.value = +Math.floor(item.PredictionPercent).toFixed(0);
      dashboard.data.chart = this.getProgressChart(percent);

      if ((item.Value > 0) || (item.TargetValue > 0)) {
        dashboard.data.rows.push([
          {
            title: aliases.Fact,
            value: self.getTypeValue(+item.Value)
          },{
            title: aliases.Plan,
            value: self.getTypeValue(+item.TargetValue)
          }
        ]);

        if ((item.Prediction > 0) && (item.PredictionPercent > 0)) {
          dashboard.data.rows.push([
            {
              title: aliases.PredictionPercent,
              value: {
                val: Math.floor(+item.PredictionPercent),
                label: ''
              }
            },{
              title: aliases.Prediction,
              value: self.getTypeValue(+item.Prediction)
            }
          ]);
        }
      }
    }

    return dashboard;
  }

  convertNumber() {
    let dashboard = {
      type: 'number',
      data: {
        rows: []
      }
    };

    if (!isEmpty(this.data.results)) {
      let item = this.data.results[0];
      let value = (item.Value) ? +Math.floor(+item.Value).toFixed(0) : 0;

      dashboard.data.rows.push(this.getTypeValue(value));
    }
    return dashboard;
  }

  convertChart() {
    const self = this;
    const type = (this.type === 'chart') ? 'chart' : 'histogram';
    let dashboard = {
      type: type,
      data: {
        rows: []
      }
    };

    if (!isEmpty(this.data.results)) {
      let convert = this.convertChartData();
      let row_prev = {
        title: (this.data.aliases && self.convertChartLegengTitle('Plan')) ? self.convertChartLegengTitle('Plan') : new Date().getFullYear() - 1,
        values: []
      };

      let row_cur = {
        title: (this.type !== 'doublehistogram') ? '' : (this.data.aliases && self.convertChartLegengTitle('Fact')) ? self.convertChartLegengTitle('Fact') : new Date().getFullYear(),
        values: []
      };

      forEach(this.data.results, function(item, i) {
        let rect_сur = {
          label: (self.type !== 'doublehistogram') ? self.getChartLabel(item.Measure) : item.Measure,
          val: +convert[i].Value,
          popup: {
            label: (self.type !== 'doublehistogram') ? item.Measure  : item.Measure + ', ' + row_cur.title,
            val: +item.Value
          }
        };
        row_cur.values.push(rect_сur);

        let rect_prev = {
          label: item.Measure,
          val: +convert[i].TargetValue,
          popup: {
            label: item.Measure + ', ' + row_prev.title,
            val: +item.TargetValue
          }
        };
        row_prev.values.push(rect_prev);
      });

      if (this.type === 'doublehistogram' || this.type === 'doublehistogramwithouttrand') {
        if (size(row_prev.values) > 0) {
          dashboard.data.rows.push(row_prev, row_cur);
        }
        dashboard.data.hiddenTrend = (this.type === 'doublehistogramwithouttrand');
      } else {
        dashboard.data.rows.push(row_cur);
        dashboard.data.hiddenTrend = true;
      }
    }

    return dashboard;
  }

  convertPie() {
    let self = this;
    let dashboard = {
      type: 'pie',
      data: {
        rows: []
      }
    };

    if (!isEmpty(this.data.results)) {
      let aliases = this.getAliaces();

      let groups = uniq(map(cloneDeep(this.data.results), item => {
        return item.Measure;
      }));
      let results = map(groups, group => {
        let items = filter(cloneDeep(this.data.results), item => item.Measure == group);
        let values = map(items, item => item.Value);
        let maxValues = max(values);
        let convertValues = self.getConvertPieValues(values, maxValues);
        let val = 0;
        let extend = [];
        forEach(items, (item, i) => {
          val += item.Value;
          let ext = {
            label: item.SubSetName,
            val: convertValues[i],
            popup: Math.floor(+item.Value),
          };
          extend.push(ext)
        });
        return {
          label: group,
          val,
          extend
        }
      });

      const resultsMaxValue = max(map(results, r => r.val));
      if (resultsMaxValue > 0) {
        results = sortBy(results, 'val').reverse();
        forEach(results, (item, i) => {
          if (i < 5) {
            dashboard.data.rows.push(item);
          }
        });
      }
    }

    return dashboard;
  }

  convertTreemap() {
    let self = this;
    let dashboard = {
      type: 'treemap',
      data: {
        rows: [{
          name: 'parent',
          children: []
        }]
      }
    };

    if (!isEmpty(this.data.results)) {
      let aliases = this.getAliaces();
      let groups = uniq(map(cloneDeep(this.data.results), item => {
        return item.Measure;
      }));

      let results = map(groups, (group, i) => {
        let items = filter(cloneDeep(this.data.results), item => item.Measure == group);
        let children = [];
        forEach(items, (item, i) => {
          let child = {
            name: item.SubSetName || '',
            value: item.Value.toFixed(2),
          };
          children.push(child)
        });

        let value = 0;
        forEach(children, child => {
          value += +child.value;
        });

        return {
          value,
          name: i,
          title: group || 'Group' + i,
          children
        }
      });
      dashboard.data.rows[0].children = results;
    }

    return dashboard;
  }

  ////////

  getTypeValue(val) {
    let label = '';
    if (val >= 1000) {
      label = 'тыс';
      val = (val / 1000).toFixed(0);
      if (val > 1000) {
        label = 'млн';
        val = (val / 1000).toFixed(2);
      }
    } else {
      val = Math.floor(val);
    }
    return {val, label};
  }

  convertChartData() {
    let convert = map(this.data.results, clone);
    let maxValue = maxBy(convert, function(o) { return +o.Value; });
    let maxTargetValue = maxBy(convert, function(o) { return +o.TargetValue; });
    convert = this.getConvertChartValues(convert, maxValue.Value, 'Value');
    convert = this.getConvertChartValues(convert, maxTargetValue.TargetValue, 'TargetValue');
    return convert;
  }

  convertTableValue(value) {
    value = (value >= 100) ? Math.floor(value) : value;
    return String(value).replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 ');
  }

  convertChartLegengTitle(item) {
    return (property(item)(this.data.aliases[0]));
  }

  getConvertChartValues(data, max, property) {
    if (max >= 100) {
      data.map(item => {
        if ((item[property] < 10) && (item[property] >= 1)) {
          item[property] = +item[property] / 10;
        } else {
          item[property] = Math.floor(+item[property] / 10);
        }
        return item;
      });
      let newMax = maxBy(data, function(o) { return +o[property]; });
      data = this.getConvertChartValues(data, newMax[property], property);
    }
    return data;
  }

  getConvertPieValues(items, m) {
    if (m >= 100) {
      let newItems = [];
      forEach(items, item => {
        item = Math.floor(+item);
        if ((item < 10) && (item >= 1)) {
          item = item / 10;
        } else {
          item = Math.floor(item / 10);
        }
        newItems.push(item);
      });
      let newMax = max(newItems);
      items = this.getConvertPieValues(newItems, newMax);
    }
    return items;
  }

  getProgressChart(percent) {
    let percentValue = this.getTypeValue(percent);
    return {title: percentValue.label,  value: {val: percentValue.val, label: '%'}};
  }

  getChartLabel(item) {
    if (item.length > 8) {
      let arr = item.split(' ');
      let name = '';
      forEach(arr, el => {
        name += el[0];
      });
      item = name.toUpperCase();
    }
    return item;
  }

  getAliaces() {
    let aliases = {};
    if (!isEmpty(this.data.aliases)) {
      aliases = this.data.aliases[0];
      aliases.Measure = (aliases.Measure && aliases.Measure.length > 0) ? aliases.Measure : 'Разрез';
      aliases.Persent = (aliases.Persent && aliases.Persent.length > 0) ? aliases.Persent : '%';
      aliases.Fact = (aliases.Fact && aliases.Fact.length > 0) ? aliases.Fact : 'Факт';
      aliases.Plan = (aliases.Plan && aliases.Plan.length > 0) ? aliases.Plan : 'План';
      aliases.Prediction = (aliases.Prediction && aliases.Prediction.length > 0) ? aliases.Prediction : 'Прогноз';
      aliases.PredictionPercent = (aliases.PredictionPercent && aliases.PredictionPercent.length > 0) ? aliases.PredictionPercent : 'Прогноз, %';
    } else {
      aliases.Measure  = 'Разрез',
      aliases.Persent = '%',
      aliases.Fact = 'Факт',
      aliases.Plan = 'План',
      aliases.Prediction = 'Прогноз',
      aliases.PredictionPercent = 'Прогноз, %';
    }

    return aliases;
  }
}
