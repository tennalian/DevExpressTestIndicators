import 'devextreme/dist/css/dx.common.css';
import 'devextreme/dist/css/dx.light.css';
import 'devextreme/dist/js/dx.all.js';

import './styles.less';

const init = class StData {
  constructor(id, data) {
    this.id = id;
    this.data = data;
  }

  chart() {
    $(`#${this.id}`).dxChart({
      dataSource: DevExpress.data.query(this.data).sortBy("count", true).toArray(),
      series: {
        argumentField: 'fruit',
        valueField: 'count'
      }
    });
  }

  progress(val) {
    const template = `<div id="st-progress-dashboard">
        <div data-options="dxTemplate: { name: 'content' }">
            <div id="toolbar"></div>
            <div class="progress"></div>
        </div>
    </div>`;
    // $(`#${this.id}`).dxProgressBar({
    //   height: 10,
    //   readOnly: true,
    //   showStatus: false,
    //   value: val,
    //   elementAttr: {
    //     class: `st-progress ${val < 100 ? 'st-progress-red' : 'st-progress-green'}`
    //   }
    // });

    $(`#${this.id}`).innerHtml = template;

    const slideOutView = $(`#${this.id}`).dxSlideOutView({
        contentTemplate: 'content'
    }).dxSlideOutView("instance");

    const progress = $(`#${this.id} .progress`).dxProgressBar({
      height: 10,
      readOnly: true,
      showStatus: false,
      value: val,
      elementAttr: {
        class: `st-progress ${val < 100 ? 'st-progress-red' : 'st-progress-green'}`
      }
    }).dxProgressBar("instance");
  }
}

// https://js.devexpress.com/Documentation/Guide/Widgets/SlideOutView/Customize_the_View/


export { init };