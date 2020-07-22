// 示例

declare global {
  interface Window {
    goldlog: any;
  }
}

class CookLog {
  logkey: string;

  gmkey: string;

  req_method: string;

  constructor() {
    this.logkey = '';
    this.gmkey = '';
    this.req_method = '';
  }

  log({ componentName = '', componentVersion = '' }) {
    const gokey = `component_name=${componentName}&component_version=${componentVersion}&page_url=${window.location.href}`;
    window.goldlog && window.goldlog.record(this.logkey, this.gmkey, gokey, this.req_method);
  }
}

export default CookLog;
