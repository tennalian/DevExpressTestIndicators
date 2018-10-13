import { forEach, includes, isEmpty, map, assign, cloneDeep, clone, uniq, filter, max, sortBy, size, maxBy, property, concat, chain, find } from 'lodash';
import * as REGIONS_DATA from '../assets/mapdata/regions.json';


export default class DashboardData {
  constructor(type, data) {
    this.data = data;
    this.type = type;
  }

  getData() {
    if (this.type === 'progress') {
      return this.convertProgress();
    }

    if (this.type === 'geomap') {
      return this.convertMap();
    }

    return {rows: []};
  }

  convertMap() {
    let regions = [];
    if (!isEmpty(this.data.results)) {
      regions = assign(REGIONS_DATA, { features: map(REGIONS_DATA.features, d => {
        const childrens = chain(this.data.results)
          .filter(item => item.Measure.toLowerCase() === d.properties.aoguid)
          .map(item => {
            return {
              Measure: item.SubSetName,
              Value: item.Value,
              TargetValue: item.TargetValue,
              PredictionPercent: item.PredictionPercent,
              Prediction: item.Prediction,
              PercentValue: item.PercentValue,
            }
          })
          .value();
        const itemData = find(this.data.results, item => item.MeasureObjectId.toLowerCase() === d.properties.aoguid) || {};
        if (isEmpty(itemData)) {
          itemData.Value = childrens.reduce((sum, current) => sum + current.Value, 0) || 0;
          itemData.TargetValue = childrens.reduce((sum, current) => sum + current.TargetValue, 0) || 0;
          itemData.PercentValue = (itemData.TargetValue) ? Math.round((itemData.Value / itemData.TargetValue) * 100) : (itemData.Value > 0 ? 100 : 0);
        }
        d.properties.data = {
          results: [{
            Measure: d.properties.name,
            Value: itemData.Value,
            TargetValue: itemData.TargetValue,
            Prediction: itemData.Prediction || 0,
            PredictionPercent: itemData.PredictionPercent || 0,
            PercentValue: itemData.PercentValue || 0,
            childrens
          }]
        };
        return d;
      })});
    }

    // const convert = map(CONVERT_DATA.data, item => {});

    const dashboard = {
      type: 'geomap',
      data: regions,
      aliaces: this.getAliaces()
    };
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
                label: '%'
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

  ////////

  getTypeValue(val) {
    let label = '';
    if (val >= 1000) {
      label = 'тыс';
      if (val / 1000 >= 100) {
        val = (val / 1000).toFixed(0);
      } else {
        val = (val / 1000 >= 10) ? (val / 1000).toFixed(1) : (val / 1000).toFixed(2);
      }

      if (val > 1000) {
        label = 'млн';
        val = (val / 1000 >= 10) ? (val / 1000).toFixed(1) : (val / 1000).toFixed(2);
      }
    } else {
      // val = Math.floor(val);
      val = val;
    }

    return {val, label};
  }

  convertTableValue(value) {
    value = (value >= 100) ? Math.floor(value) : value;
    return String(value).replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 ');
  }

  getProgressChart(percent) {
    let percentValue = this.getTypeValue(percent);
    return {title: percentValue.label,  value: {val: percentValue.val, label: '%'}};
  }

  getChartLabel(item) {
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
