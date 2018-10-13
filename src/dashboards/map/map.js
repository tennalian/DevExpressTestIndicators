import { map, template, isEmpty, assign, cloneDeep, property, size } from 'lodash';

import { templateBody } from './template';
import Dashboard from '../main';
import DashboardData from '../dashboardData';


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
    this.mapData = null;
    this.dafaultState = 'Россия';
    this.state = this.dafaultState;
    this.tableId = `table_${this.id}`;
    this.mapId = `map_${this.id}`;
  }

  isHasLeaflet() {
    return !!window.L;
  }

  initMap() {
    const self = this;
    if (property('map.features')(this.data)) {
      $(`#${this.mapId}`).dxVectorMap({
        maxZoomFactor: 10,
        zoomFactor: 3,
        "export": {
            enabled: false
        },
        controlBar: {
          visibility: false
        },
        onClick: function (e) {
          const element = e.target;
          if (element != null && element.layer.type == "area") {
            const info = element.attribute()
            // self.map.fitBounds(layer.getBounds()); // TODO use leaflet???
            self.updateState(info.name, info.data.results[0].childrens);
            const back = document.getElementById(self.id).querySelector('.sv-map-back');
            back.classList.remove('sv-map-back--hidden');
          }
        },
        layers: [{
            dataSource: this.data.map,
            hoverEnabled: true,
            name: "Russia",
            color: COLORS.gray,
            customize: (elements) => {
              $.each(elements, function (_, element) {
                const results = element.attribute().data.results[0];
                let color = COLORS.gray;
                if (results.PercentValue >= 0 && !isEmpty(results.childrens)) {
                  color = results.PercentValue < 50 ? COLORS.red : COLORS.green;
                }
                element.applySettings({
                  color: color,
                  weight: 2,
                  opacity: .8
                });
              });
            },
            label: {
              enabled: true,
              dataField: "name"
            },
        }]
      });
    }
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
    $(`#${this.tableId}`).dxDataGrid({
      dataSource: this.tableData.rows,
      columns: this.tableData.titles,
      showRowLines: true,
      showBorders: false,
      showColumnLines: false,
      rowAlternationEnabled: true
    });
  }

  setDefaultState() {
    const back = document.getElementById(this.id).querySelector('.sv-map-back');
    const tableData = map(this.data.map.features, d => d.properties.data.results[0]);
    this.updateState(this.dafaultState, tableData);
    back.classList.add('sv-map-back--hidden');
    // this.map.fitBounds(this.mapData.getBounds());  // Use Leaflet???
  }

  drawTable(data) {
    this.tableData = this.getTableDataOptions(data);
    const table = document.getElementById(this.tableId);
    const back = document.getElementById(this.id).querySelector('.sv-map-back');
    if (back) {
      back.addEventListener('click', this.setDefaultState.bind(this));
    }
    if (table) {
      $(`#${this.tableId}`).dxDataGrid({
          dataSource: this.tableData.rows,
          columns: this.tableData.titles,
          showRowLines: true,
          showBorders: false,
          showColumnLines: false,
          rowAlternationEnabled: true,
          onCellPrepared: function(options) {
            var fieldData = options.value,
                fieldHtml = "";
            if(fieldData && fieldData.value) {
                if(fieldData.diff) {
                    options.cellElement.addClass((fieldData.diff > 0) ? "inc" : "dec");
                    fieldHtml += "<div class='current-value'>" +
                        Globalize.formatCurrency(fieldData.value, "USD") +
                        "</div> <div class='diff'>" +
                        Math.abs(fieldData.diff).toFixed(2) +
                        "  </div>";
                } else {
                    fieldHtml = fieldData.value;
                }
                options.cellElement.html(fieldHtml);
            }
        }
      });
    }
  }

  getTableDataOptions(data) {
    const aliaces = this.data.aliaces;
    let rows = [];
    if (size(data) > 0) {
      rows = map(cloneDeep(data), item => {
        const row = {
          [`${aliaces.Measure}`]: item.Measure,
          '': '',
          [`${aliaces.Percent || '%'}`]: Math.round(item.PercentValue) || 0,
          [`${aliaces.Fact}`]: this.convertTableValue(Number(item.Value)),
          [`${aliaces.Plan}`]: this.convertTableValue(Number(item.TargetValue))
        }
        return row;
      });
    }
    const titles = [
      `${aliaces.Measure}`,
      {
        caption: '',
        width: 80,
        cellTemplate: function(container, options) {
          container.addClass("chart-cell");
           $("<div />").dxProgressBar({
            height: 10,
            readOnly: true,
            showStatus: false,
            value: options.data[`${aliaces.Percent || '%'}`],
            elementAttr: {
              class: `st-progress ${options.data[`${aliaces.Percent || '%'}`] < 100 ? 'st-progress-red' : 'st-progress-green'}`
            }
          }).appendTo(container)
        }
      },
      `${aliaces.Percent || '%'}`,
      `${aliaces.Fact}`,
      `${aliaces.Plan}`
    ];
    return { rows, titles };
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
      rows: property('map.features')(this.data) || [],
      mapId: this.mapId,
      tableId: this.tableId
    };

    const tmplOptions = assign(defaultOptions, options);
    return tmplOptions;
  }
}

