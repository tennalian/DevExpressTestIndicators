import '../assets/styles/item.less';
import { isEmpty } from 'lodash';

import ProgressDashboard from '../dashboards/progress/progress';
import MapDashboard from '../dashboards/map/map';

export default class StDashboard {
  constructor(id, options, data) {
    this.id = id || null;
    this.options = options || null;
    this.data = data || null;
    this.loading = false;
    this.dashboard = null;
  }
  draw() {
    let id = this.id;
    if (this.id == null) {
      throw new SyntaxError('Dashboard id is not defined');
    }
    let options;
    let data;

    let element = document.getElementById(id);

    var elOptions = (element) ? element.getAttribute('options') : null;
    var elData = (element) ? element.getAttribute('data') : null;

    if (elOptions && elData) {
      options = JSON.parse(elOptions);
      data = JSON.parse(elData);
    } else {
      options = this.options;
      data = this.data;
    }

    let loading = this.loading;

    if (data == null) {
      throw new SyntaxError('Dashboard data is not defined');
    }

    if (options.type == 'progress') {
      this.dashboard = new ProgressDashboard(id, options, data, loading);
    } else if (options.type == 'geomap') {
      this.dashboard = new MapDashboard(id, options, data, loading);
    } else {
      this.dashboard = null;
      console.error(`Dashboard type is undefined (id: ${this.id})`);
    }
    if (!isEmpty(this.dashboard)) {
      this.id && this.dashboard.draw();
    }
  }

  update(updateHandler) {
    this.loading = true;
    this.draw();
    return updateHandler.then(data => {
      this.data = data;
      this.loading = false;
      this.draw();
    }, err => {
      this.loading = false;
      console.error(err);
    });
  }

  setLoading() {
    this.loading = true;
    this.draw();
  }

  remove() {
    // TODO remove listeners
    // this.dashboard.destroy()
  }
};

