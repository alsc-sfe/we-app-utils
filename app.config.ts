module.exports = {
  viewType: 'util',
  componentId: "1154",
  // 本地开发调试配置
  webpack: {
    // devServer配置
    devServer: {
      host: 'local.koubei.test',
      port: 8000,
    },
    output: {
      // 开启UMD构建
      umd: false,
      // UMD文件名前缀（需要自定义！！！）
      filename: 'index',
      // 模块打包成UMD后的, 导出的模块名称（需要自定义！！！）
      library: 'Index',
      // 自定义UMD构建配置
      config: (compileConfig) => {
        return compileConfig;
      },
    },
  },
};
