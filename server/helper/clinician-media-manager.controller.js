const _ = require('lodash'),
  utils = require('../../helper/utils'),
  imageHelper = require('../../helper/image-helper'),
  fs = require('fs'),
  S3 = require('../../helper/s3'),
  imageFiles = ['jpg', 'jpeg', 'gif', 'bmp', 'png'],
  documentFiles = ['rtf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'pdf'],
  s3Config = require('../../config/s3-folder.json'),
  config = global.CONFIG,
  s3 = new S3(),
  async = require('async');

/**
 * @Class ClinicianMediaManager
 * @description function to manage the media manager's APIs
 * @ticket PO-58,PO-389,PO-401,PO-599
 */
class ClinicianMediaManager {

  constructor(app) {
    //files
    app.get('/api/v1/clinician-media-manager/files', this.getAllFiles);
    app.get('/api/v1/clinician-media-manager/files-by-folder',(req, res) => this.getFilesByFolder(req, res));
    app.post('/api/v1/clinician-media-manager/upload-file',   global.Multer.array('files'),(req, res) =>this.uploadFile(req,res));
    app.get('/api/v1/clinician-media-manager/file-info', this.getFileInfo);
    app.post('/api/v1/clinician-media-manager/get-file-with-metadata', this.getFileWithMetadata);
    app.delete('/api/v1/clinician-media-manager/files', this.deleteFile);

    //folders
    app.get('/api/v1/clinician-media-manager/folders', this.getFolders);
    app.post('/api/v1/clinician-media-manager/folders', this.validateFolderExist, this.createFolder);
  }

  /**
   * @method validateFolderExist
   * @description function check foldername exist or not
   * @param req
   * @param res
   * @param next
   * @returns {*}
   * @tickets PO-389,PO-401
   */
  validateFolderExist(req, res, next) {
    let parent = req.body.parent,
      folderName = req.body.name,
      fileType = req.body.popupType,
      key,
      params,
    pathToKey;
    if (!req.body.parent) {
      return res.sendError(new Exception('ValidationError', 'CHAT.PARENT_FOLDER_VALIDATION'));
    }
    if (!req.body.name) {
      return res.sendError(new Exception('ValidationError', 'CHAT.FOLDER_NAME_VALIDATION'));
    }
    parent = parent.replace('/', '');


    if(fileType === 'document') {
      let folderNameCompiled = _.template(s3Config.clinicianChatResources);
      pathToKey = folderNameCompiled({'clinicFolderName': req.physioClinicBucketFolderName});
    }
    if(fileType === 'image'){
      let folderNameCompiled = _.template(s3Config.clinicianChatImages);
      pathToKey = folderNameCompiled({'clinicFolderName': req.physioClinicBucketFolderName});
    }
    if (parent === '') {
      key =  `${pathToKey}/${folderName}/`;
    } else {
      key = `${pathToKey}/${parent}/${folderName}/`;
    }
    params = {
      Key: key,
      Bucket: config.fileUploadConfig.bucket
    };
    s3.checkFileExist(params.Bucket,params.Key).then((data)=>{
      return res.sendError(new Exception('ValidationError', 'Folder name is already exist.'));
    })
      .catch((error)=>{
      req.params = params;
      next();
    })
  }

  /**
   * @method getFileInfo
   * @description It is used to get file details
   * @returns {Promise}
   * @param req
   * @param res
   * @ticket PO-58,PO-401
   */
  getFileInfo(req, res) {
    let params = {
      Bucket:config.fileUploadConfig.bucket,
      Key: req.query.fileName
    };
    if (!req.query.fileName) {
      return res.sendError(new Exception('ValidationError', 'CHAT.FILE_NAME_VALIDATION_ERROR'));
    }
    s3.getFileInfo(params)  // here 'chat-images' is the folder name on s3 server into which the image will get deloyed.
      .then((data) => {
        res.sendResponse(data)
      })
      .catch((error) => {
        res.sendError(utils.getException({error, message: 'CHAT.UPLOAD_FILE_ERROR'}))
      });
  }

  /**
   * @method getFileWithMetadata
   * @description It is used to get file details with metadata
   * @returns {Promise}
   * @param req
   * @param res
   * @ticket PO-312,PO-401,PO-599
   */
  getFileWithMetadata(req, res) {
    let images = req.body.imageArr;
    let parallelFunctionGenerator = function (imageNode) {
      let fileName = imageNode.Key,
        metaData;
      return (callback) => {
        s3.getFileInfo({Key: fileName})  // here 'chat-images' is the folder name on s3 server into which the image will get deloyed.
          .then((data)=>{
            metaData = data;
            return imageHelper.getBase64(imageNode.link.replace(/ /g,'+'));
          })
          .then((hashData) => {
            images[_.findIndex(images, {Key: fileName})].hashData = hashData;
            images[_.findIndex(images, {Key: fileName})].metaData = metaData.Metadata;
            // rLogger.log('Got the s3 file info. --> ' + utils.stringifyJSON());
            callback(null);
          })
          .catch((error) => {
            callback(error);
          });
      };
    };
    let parallelFunctions = [];
    _.each(images, (node) => {
      parallelFunctions.push(parallelFunctionGenerator(node))
    });
    async.parallel(parallelFunctions, (error) => {
      if (error) {
        res.sendError(utils.getException({error, message: 'CHAT.UPLOAD_FILE_ERROR'}))
      } else {
        res.sendResponse(images)
      }
    });
  }

  /**
   * @method getAllFiles
   * @description function to get all files from specific bucket.
   * @param req
   * @param res
   * @ticket PO-58,PO-401
   */
  getAllFiles(req, res) {
    let params = {Bucket:config.fileUploadConfig.bucket};
    s3.getFiles(params)
      .then((data) => {
        _.forEach(data.Contents, (image) => {
          return image.link = utils.replaceS3toCloudFront(`https://${config.file}.s3.amazonaws.com/${image.Key}`);
        });
        res.sendResponse(data)
      })
      .catch((error) => {
        res.sendError(utils.getException({error, message: 'CHAT.GET_FILE_ERROR'}))
      });
  }

  /**
   * @method deleteFile
   * @description It is used to delete file from s3
   * @param req ,res
   * @param res
   * @ticket PO-58,PO-401
   */
  deleteFile(req, res) {
    let params = {
      Bucket: config.fileUploadConfig.bucket,
      Key: req.query.fileName
    };
    if (!req.query.fileName) {
      return res.sendError(new Exception('ValidationError', 'CHAT.FILE_NAME_VALIDATION_ERROR'));
    }
    s3.deleteFile(params)  // here 'chat-images' is the folder name on s3 server into which the image will get deloyed.
      .then((data) => {
        res.sendResponse(data)
      })
      .catch((error) => {
        res.sendError(utils.getException({error, message: 'CHAT.FILE_NAME_VALIDATION_ERROR'}))
      });
  }

  /**
   * @method getAllFolders
   * @description function to get all folders from specific bucket.
   * @param req
   * @param res
   * @ticket PO-58,PO-401
   */
  getFolders(req, res) {
    let fileType = req.query.type,
        params = {Bucket:config.fileUploadConfig.bucket},
        rootPath;
      if(fileType === 'document') {
      let folderNameCompiled = _.template(s3Config.clinicianChatResources);
      rootPath = folderNameCompiled({'clinicFolderName': req.physioClinicBucketFolderName});
    }
    if(fileType === 'image'){
      let folderNameCompiled = _.template(s3Config.clinicianChatImages);
      rootPath = folderNameCompiled({'clinicFolderName': req.physioClinicBucketFolderName});
    }
    params.Prefix = `${rootPath}/`;
    s3.getFolders(params)
      .then((data) => {
        res.sendResponse(data)
      })
      .catch((error) => {
        res.sendError(utils.getException({error, message: 'CHAT.FOLDER_GET_ERROR'}))
      });
  }

  /**
   * @method createFolder
   * @description function to create the folder in specific bucket.
   * @param req
   * @param res
   * @ticket PO-58,PO-389
   */
  createFolder(req,res) {
    s3.createFolder(req.params)
        .then((data) => {
          res.sendResponse(data)
        })
        .catch((error) => {
          res.sendError(utils.getException({error, message: 'CHAT.FOLDER_CREATE_ERROR'}))
        });
  }



  /**
   * @method getFilesByFolder
   * @description function to get files by foldername
   * @param req
   * @param res
   * @ticket PO-401
   */
  getFilesByFolder(req, res) {
    let fileType = req.query.fileType;
    let params = {};
    let folderName;
    if (fileType === 'image') {
      let folderNameCompiled = _.template(s3Config.clinicianChatImages);
      folderName = folderNameCompiled({'clinicFolderName': req.physioClinicBucketFolderName});
    }
    if (fileType === 'document') {
      let folderNameCompiled = _.template(s3Config.clinicianChatResources);
      folderName = folderNameCompiled({'clinicFolderName': req.physioClinicBucketFolderName});
    }
    if (req.query.folderName) {
      params.Prefix = `${folderName}/${req.query.folderName}`;
    } else {
      params.Prefix = `${folderName}`;
    }
    params.Bucket = config.fileUploadConfig.bucket;
    s3.getFilesByFolder(params)
      .then((data) => {
        let allFiles = _.cloneDeep(data.Contents);
        _.forEach(allFiles, (file) => {
          file.Key = file.Key.replace(params.Prefix, '');
          if (file.Key.indexOf('/') > -1) {
            _.remove(data.Contents, {Key: file.Key});
          }
        });
        if (fileType === 'image') {
          data.Contents = _.filter(data.Contents, (image) => {
            let split = image.Key.split('.');
            let lastSplitValue = split[split.length - 1];
            let splitedKey = image.Key.split(params.Prefix + '/');
            let filesByFolderArray = splitedKey[splitedKey.length -1].split('/');
            return imageFiles.indexOf(lastSplitValue) !== -1 && filesByFolderArray.length === 1;
          });
          _.forEach(data.Contents, (image) => {
            image.link = utils.replaceS3toCloudFront(`https://${data.Name}.s3.amazonaws.com/${image.Key}`);
          });
        }
        if (fileType === 'document') {
          _.forEach(data.Contents, (document) => {
            document.fileUrl = utils.replaceS3toCloudFront(`https://${data.Name}.s3.amazonaws.com/${document.Key}`);
            let lastSplitValue = document.Key.split('.');
            document.fileType = lastSplitValue[lastSplitValue.length - 1];
            document.fileName = document.Key;
            let splitfilename =  document.Key.split('/');
            document.displayFileName = splitfilename[splitfilename.length-1];
          });
          data.Contents = _.filter(data.Contents, (document) => {
            let split = document.Key.split('.');
            let lastSplitValue = split[split.length - 1];
            let splitedKey = document.Key.split(params.Prefix + '/');
            let filesByFolderArray = splitedKey[splitedKey.length -1].split('/');
            return documentFiles.indexOf(lastSplitValue) !== -1 && filesByFolderArray.length === 1;
          });
        }
        res.sendResponse(data);
      })
      .catch((error) => {
        res.sendError(utils.getException({error, message: req.getLocaleMessage('CHAT.GET_FILE_FROM_FOLDER_ERROR')}))
      });
  }

  /**
   * @method splitFileName
   * @description function to split filename
   * @param filename
   * @tickets PO-401
   */


  splitFileName(filename){
    let split = filename.split('.');
    if(documentFiles.indexOf(split[split.length-1]) !== -1){
      return 'documentFile';
    }
    else if(imageFiles.indexOf(split[split.length-1]) !== -1){
      return 'imageFile';
    }
  }

  /**
   * @method uploadFile
   * @description function to upload file
   * @param req
   * @param res
   * @ticket PO-58,PO-401
   */
  uploadFile(req, res) {
    let byPassDuplicateName = utils.parseBoolean(req.query.byPassDuplicateName);
    var file = req.files[0];
    let s3 = new S3();
    let params = {};
    let fileMatched=false;
    let counter = '';
    let setFileName;
    let folderName;
    if(this.splitFileName(file.originalname) === 'documentFile') {
      let folderNameCompiled = _.template(s3Config.clinicianChatResources);
          folderName = folderNameCompiled({'clinicFolderName': req.physioClinicBucketFolderName});
    }
    if(this.splitFileName(file.originalname) === 'imageFile'){
      let folderNameCompiled = _.template(s3Config.clinicianChatImages);
          folderName = folderNameCompiled({'clinicFolderName': req.physioClinicBucketFolderName});
    }
    if (req.query.folder) {
        params.Prefix = `${folderName}/${req.query.folder}`;
        setFileName = `${params.Prefix}/${file.originalname}`;
      } else {
        params.Prefix = `${folderName}`;
        setFileName = `${params.Prefix}/${file.originalname}`;
      }
    params.Bucket = config.fileUploadConfig.bucket;
    let split = file.originalname.split('.');
    let extension = file.originalname.split('.').pop();
    let newFileName = split[split.length - 2];
    async.whilst(
        function () {
          if (!fileMatched) {
            return !fileMatched;
          }
        },
        function (callback) {
          s3.checkFileExist(params.Bucket, setFileName)
            .then((data) => {
            if(!byPassDuplicateName) {
              throw {duplicateName: true }
            }
                if (counter == '')
                  counter = 0;
                counter=counter+1;
              file.originalname = `${newFileName}(${counter}).${extension}`;
              if(params.Prefix) {   //for root folder
                setFileName = `${params.Prefix}/${file.originalname}`;
              }else{
                setFileName = `${file.originalname}`;
              }
              callback();
            }).catch((err) => {
            if(!byPassDuplicateName) {
              if (err.duplicateName) {
                res.sendResponse({duplicateName: true, filename:file.originalname});
              }
            }
            fileMatched = true;
            callback();
          });
        },
        function (err) {
          s3.uploadFile({file:file,folder: params.Prefix})
                .then((data) => {
                  data.fileName = data.originalname;
                  data.fileSize = data.size;
                  data.fileUrl = utils.replaceS3toCloudFront(data.Location);
                  data.fileType = split[split.length - 1];
                  _deleteFile();
                  res.sendResponse(data)
                }).catch((err) => {
                   return res.sendError(new Exception('ValidationError', 'file is not in valid format'));
                       _deleteFile();
              });
              let _deleteFile = () => {
                fs.unlink(file.path, (err) => {
                  if (err) {
                    rLogger.error('Error in deleting file from the uploads folder');
                  }
                });
              }
        }
      );
      return true;
  }
}

module.exports = ClinicianMediaManager;
