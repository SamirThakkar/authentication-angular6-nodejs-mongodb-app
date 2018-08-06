const _ = require('lodash');
class Module {
  constructor(app) {
    this.app = app;
  }

  /**
   * @method initAPIs
   * @description function to initialize the APIs
   */
  initAPIs() {
    let fs = require('fs');
    let path = require('path');
    let folders = [__dirname,__dirname.replace('modules-admin','modules')];
    _.each(folders,(folder)=>{
      fs.readdirSync(folder).filter((file) => {
        let stats = fs.statSync(path.join(folder, file));
        return (file.indexOf('.') !== 0 && stats.isDirectory());
      }).forEach((dir) => {
        fs.readdirSync(path.join(folder, dir)).filter(function(file) {
          let stats = fs.statSync(path.join(folder, dir, file));
          return (file.indexOf('.') !== 0 && !stats.isDirectory() &&
            file.endsWith('.controller.js'));
        }).forEach((file) => {
          try {
            let tmpAPI = require(path.join(folder, dir, file));
            new tmpAPI(this.app);
          }catch(e){
            console.error('Error in init api',path.join(folder, dir, file));
            console.error(e);
          }
        });
      });
    })
  }
}
module.exports = Module;
