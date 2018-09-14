import { TileLayer, Map, GeoJSON } from 'leaflet';
import { map, template, isEmpty, assign, forEach, includes, sortBy, cloneDeep, property, size } from 'lodash';
import { select } from 'd3-selection';

import templateBody from './template';
import Dashboard from '../main';
import DashboardData from '../dashboardData';
import * as tableBody from '../table/template';

import 'leaflet/dist/leaflet.css';
import './map.less';


const tile = {
  id: 0,
  name: 'Спутник',
  layer: new TileLayer('http://tiles.maps.sputnik.ru/tiles/kmt2/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://maps.sputnik.ru/">Спутник</a>'
  })
};

const COLORS = {
  green: '#54c089',
  red: '#da5e51',
  gray: '#a9a9a9',
  light: '#e3e3e3'
}

export default class MapDashboard extends Dashboard {
  constructor(...args) {
    super(...args);
    this.map = {};
    this.mapData = new GeoJSON();
    this.dafaultState = 'Россия';
    this.state = this.dafaultState;
    this.tableId = `table_${this.id}`;
    this.mapId = `map_${this.id}`;
  }

  initMap() {
    this.updateLabel();
    this.map = new Map(this.mapId, {
      zoom: 15
    });
    this.map.addLayer(tile.layer);

    this.addGeoData();
    this.map.fitBounds(this.mapData.getBounds());
  }

  drawOptions() {
    if (!this.loading) {
      this.initMap();
      const tableData = map(this.data.map.features, d => d.properties.data.results[0] || []);
      this.drawTable(tableData);
    }
  }

  updateLabel() {
    const label = document.getElementById(this.id).querySelector('.sv-map-label');
    label.innerHTML = this.state;
  }

  updateState(state, data) {
    if (!state) {
      return;
    }
    this.state = state;
    this.updateLabel();
    this.tableData = this.getTableDataOptions(data);
    this.tableData.rows = this.sortRows(this.tableData.sorted.label);
    const table = document.getElementById(this.tableId);
    this.updateTable(table);
  }

  setDefaultState() {
    const back = document.getElementById(this.id).querySelector('.sv-map-back');
    const tableData = map(this.data.map.features, d => d.properties.data.results[0]);
    this.updateState(this.dafaultState, tableData);
    this.mapData.eachLayer(l => l.setStyle({'fillOpacity': .8}));
    back.classList.add('sv-map-back--hidden');
    this.map.fitBounds(this.mapData.getBounds());
  }

  drawTable(data) {
    this.tableData = this.getTableDataOptions(data);
    this.tableData.rows = this.sortRows(this.tableData.sorted.label);
    const table = document.getElementById(this.tableId);
    const back = document.getElementById(this.id).querySelector('.sv-map-back');
    if (back) {
      back.addEventListener('click', this.setDefaultState.bind(this));
    }
    if (table) {
      table.addEventListener('click', this.sortTable.bind(this));
      this.updateTable(table);
    }
  }

  updateTable(table) {
    this.clearTable(table);
    const tbody = template(tableBody.default)(this.tableData);
    table.innerHTML = tbody;
    this.drawLines();
  }

  clearTable(table) {
    while (table.firstChild) {
      table.removeChild(table.firstChild);
    }
    table.removeEventListener('click', this.sortTable.bind(this));
  }

  addGeoData() {
    this.mapData = new GeoJSON(this.data.map, {
      style: (feature) => {
        // TODO check fillColor property
        const results = feature.properties.data.results[0]
        let color = COLORS.gray;
        if (results.PercentValue >= 0 && !isEmpty(results.SubSetName)) {
          color = results.PercentValue < 50 ? COLORS.red : COLORS.green;
        }
        return {
          'fillColor': color,
          'fillOpacity': .8,
          'color': COLORS.light,
          'weight': 2,
          'opacity': .8
        }
      },
      onEachFeature: (feature, layer) => {
        console.log(feature.properties.name, feature.properties.aoguid)
        const self = this;
        layer.bindTooltip(feature.properties.name, { sticky: true });

        layer.on('mouseover', function () {
          const opacity = (self.state === feature.properties.name || self.state === self.dafaultState ) ? 1 : .8
          this.setStyle({ "fillOpacity": opacity });
        });

        layer.on('mouseout', function () {
          const opacity = (self.state === feature.properties.name || self.state === self.dafaultState ) ? .8 : .4
          this.setStyle({ "fillOpacity": opacity });
        });

        layer.on('click', function () {
          self.mapData.eachLayer(l => {
            const opacity = (l.feature.properties.aoguid !== feature.properties.aoguid) ? .4 : 1
            l.setStyle({"fillOpacity": opacity});
          });

          self.map.fitBounds(layer.getBounds());
          self.updateState(feature.properties.name, feature.properties.data.results[0].SubSetName);
          const back = document.getElementById(self.id).querySelector('.sv-map-back');
          back.classList.remove('sv-map-back--hidden');
        });

        return layer;
    }
    });
    this.mapData.addTo(this.map);
  }

  getTableDataOptions(data) {
    const aliases = this.data.aliaces;
    const extend = {
      val: true,
      min: 50,
      label: aliases.PercentValue || '%'
    };
    const sorted = {
      label: aliases.Measure,
      type: property('sorted.type')(this.tableData) || 'up'
    }
    let rows = [];
    if (size(data) > 0) {
      rows = map(cloneDeep(data), item => {
        const row = [{
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
          title: aliases.PercentValue || '%'
        },{
          value: {
            val: this.convertTableValue(+item.Value),
            label: ''
          },
          title: aliases.Fact
        },{
          value: {
            val: this.convertTableValue(+item.TargetValue),
            label: ''
          },
          title: aliases.Plan
        }];
        return row
      });
    }
    let titles = [];
    extend.values = [];
    forEach(rows, function(row) {
      forEach(row, function(item) {
        if (!includes(titles, item.title)) {
          titles.push(item.title);
        }
        if (extend.val) {
          if (item.title == extend.label) {
            extend.values.push(item.value.val);
          }
        }
      });
    });

    return { rows, extend, sorted, titles };
  }

  sortTable(e) {
    const data = this.tableData;
    const table = document.getElementById(this.tableId);

    // span, svg, path
    if ((e.target.className !== 'target') && (e.target.parentNode.className !== 'target') && (e.target.parentNode.parentNode.className !== 'target') ) {
      return;
    }

    let element = e.target;
    if (e.target.parentNode.className === 'target') {
      element = e.target.parentNode;
    }
    if (e.target.parentNode.parentNode.className === 'target') {
      element = e.target.parentNode.parentNode;
    }
    const label = element.dataset.label;
    const type = (data.sorted && (data.sorted.type == 'up') && (data.sorted.label == label)) ? 'down' : 'up';

    this.tableData.sorted = { label, type };
    this.tableData.rows = this.sortRows(label);
    this.tableData.codeKey = {};

    this.updateTable(table);
  }

  sortRows(label) {
    const rows = property('rows')(this.tableData) || [];
    const sorted = this.tableData.sorted;
    let index = 0;

    let sortedRow = [];
    let newRows = [];

    map(rows, (row, i) => {
      forEach(row, item => {
        item.index = i
      });
      return row;
    });

    forEach(rows[0], function(item, i) {
      if (item.title == label) {
        index = i;
      }
    });

    forEach(rows, function(row) {
      sortedRow.push(row[index]);
    });

    sortedRow = sortBy(sortedRow, el => {
      return (isNaN(Number(String(el.value.val).split(" ").join("")))) ? el.value.val : +(String(el.value.val).split(" ").join(""));
    });

    forEach(sortedRow, function(item, i) {
      forEach(rows, function(row, j) {
        if ((item.value.val === row[index].value.val) && (item.index === row[index].index)) {
          newRows.push(row);
        }
      });
    });

    if (sorted.type == 'down') {
      newRows.reverse();
    }

    return newRows;
  }

  drawLines() {
    const progress = document.getElementById(this.id).querySelectorAll('.s-progress');
    const round = document.getElementById(this.id).querySelectorAll('.s-round');

    const backColor = super.getRgba('#000000', '0.1');
    forEach(progress, el => {
      const percent = +el.dataset.percent || 0;
      const min = +el.dataset.min || 0;

      const color = (percent < min) ? '#da5e51' : '#54c089';
      const height = 4;

      let svg = select(el)
      .append('svg:svg')
      .attr('width', '100%')
      .attr('height', height);

      svg.append('rect')
        .attr('class', 'p-back')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', '100%')
        .attr('height', height)
        .attr('fill', backColor);

      svg.append('rect')
       .attr('class', 'p-front')
       .attr('height', height)
       .attr('x', 0)
       .attr('y', 0)
       .attr('width', 0)
       .transition()
       .duration(2000)
       .delay(0)
       .attr('width', percent + '%')
       .attr('fill', color);
    });

    forEach(round, r => {
      const percent = +r.dataset.percent || 0;
      const min = +r.dataset.min || 0;
      const color = (percent < min) ? COLORS.red : COLORS.green;
      const width = 7;
      const height = 7;

      let svg = select(r)
        .append('svg:svg')
        .attr('width', width)
        .attr('height', height);

      svg.append('circle')
        .attr('r', width / 2)
        .attr('cx', width / 2)
        .attr('cy', height / 2)
        .attr('fill', color);
    });
  }

  convertTableValue(value) {
    value = (value >= 100) ? Math.floor(value) : value;
    return String(value).replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 ');
  }

  getTemplate() {
    const tmp = super.getInnerTemplate(templateBody);
    const temp = template(tmp);
    return temp;
  }

  getTmplOptions() {
    const defaultOptions = super.getTmplOptions();
    const loading = this.loading;

    if (this.data.codeKey && !isEmpty(this.data.codeKey)) {
      const dbData = new DashboardData(this.options.type, this.data.codeKey.data).getData();
      if (dbData.type) {
        this.data = assign({}, this.data, { map: dbData.data }, { aliaces: dbData.aliaces });
      } else {
        console.warn('Dashboard type is not defined (id: ' + this.id + ')');
      }
    }

    let options = {
      loading,
      rows: this.data.map.features,
      mapId: this.mapId,
      tableId: this.tableId
    };

    const tmplOptions = assign(defaultOptions, options);
    return tmplOptions;
  }
}

