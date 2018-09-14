import 'devextreme/dist/css/dx.common.css';
import 'devextreme/dist/css/dx.light.css';
import 'devextreme/dist/js/dx.all.js';

const init = class StData {
  constructor(id, data) {
    this.id = id;
    this.data = data;
  }

  chart() {
    console.log(this.id);
    console.log($(`#${this.id}`));
    $(`#${this.id}`).dxChart({
      dataSource: DevExpress.data.query(this.data).sortBy("count", true).toArray(),
      series: {
        argumentField: 'fruit',
        valueField: 'count'
      }
    });
  }
}


export { init };