const fs = require('fs'),
  AWS = require('aws-sdk'),
  _ = require('lodash'),
  utils= require('../helper/utils');
  uuid = require('node-uuid'),
  fileUploadConfig = global.CONFIG.fileUploadConfig;
validator = require('../helper/validation');
const imagemagick = require('imagemagick');


/**
 * @class S3
 * @description helper class for the s3 methods
 * @tickets PO-44,PO-58,PO-534
 */
class S3 {
  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: fileUploadConfig.accessKeyId,
      secretAccessKey: fileUploadConfig.secretAccessKey
    });
    this.bucket = fileUploadConfig.bucket;
  }

  /**
   * @method getFiles
   * @description function to get the all files of the bucket
   * @tickets PO-58
   */
  getFiles(params) {
    rLogger.log('Getting s3 files with param. --> ' + JSON.stringify(params));
    return new Promise((resolve, reject)=> {
      this.s3.listObjects(params, (err, data) => {
        if (err) {
          reject(err);
          rLogger.error('Getting error in list objects. --> ' + err.toString());
        } else {
          data.Contents = _.filter(data.Contents, (file)=> {
            return file.Size !== 0;
          });
          resolve(data);
          rLogger.log('Got the files. --> ' + JSON.stringify(data.Contents));
        }
      });
    });
  }

  /**
   * @method getFileInfo
   * @description It is used to get file details
   * @param params
   * @returns {Promise}
   * @tickets PO-58
   */
  getFileInfo(params){
    rLogger.log('Getting s3 file info. --> '+JSON.stringify(params));
    params.Bucket = this.bucket;
    return new Promise((resolve,reject)=>{
      this.s3.getObject(params, (err, data) => {
        if (err){
          reject(err);
          rLogger.error('Error in getting file info. --> '+err.toString());
        } else {
          resolve(data);
          rLogger.log('Got the s3 file info. --> '+JSON.stringify(data));
        }
      });
    });
  }

  /**
   * @method deleteFile
   * @description It is used to delete file from s3
   * @param params
   * @returns {Promise}
   */
  deleteFile(params) {
    rLogger.log('Deleting file with params --> ' + JSON.stringify(params));
    return new Promise((resolve, reject)=> {
      this.s3.deleteObject(params, (err, data) => {
        if (err) {
          reject(err);
          rLogger.error('Error in deleting file --> ' + err.toString());
        } else {
          resolve(data);
          rLogger.log('File deleted successfully.');
        }
      });
    });
  }

  /**
   * @method getFolders
   * @description function to get the folders of the bucket
   * @tickets PO-58,PO-401
   */
  getFolders(params) {
    rLogger.log('Getting the folder with params --> ' + JSON.stringify(params));
    return new Promise((resolve, reject)=> {
      this.s3.listObjects(params, (err, data) => {
        if (err) {
          reject(err);
          rLogger.error('Getting error in folder list --> ' + err.toString());
        } else {
          let folderData = _.filter(data.Contents,(result)=>{
             return result.Key.indexOf('/') > -1 && result.Size == 0
          });
          _.each(data.Contents,(resultKey)=> {
            let splitedKey = resultKey.Key.split('/');
            splitedKey.splice(0,3);
            resultKey.Key = splitedKey.join('/');
          });
          let addToTree = (node, treeNodes)=> {
            let breakLoop = false;
            _.forEach(treeNodes, (treeNode)=> {
              if (node.Key.indexOf(treeNode.Key) == 0) {
                addToTree(node, treeNode.children);
                breakLoop = true;
              }
            });
            if (!breakLoop) {
              let name = node.Key.split('/');
                treeNodes.push({
                  name: name[name.length - 2],
                  Key: node.Key,
                  id:  node.Key,
                  children: []
                });
            }
          };

          let createTree = (nodes) => {
            var tree = [];
            _.forEach(nodes, (node)=> {
              addToTree(node, tree);
            });
            return tree;
          };
          data.Contents = createTree(folderData);
          resolve(data);
          rLogger.log('Folder data --> ' + JSON.stringify(data));
        }
      });
    });
  }

  /**
   * @method createFolder
   * @description It is used to create the folder on s3 bucket
   * @param params
   * @returns {Promise}
   */
  createFolder(params) {
    rLogger.log('Create folder with params --> ' + JSON.stringify(params));
    return new Promise((resolve, reject)=> {
      this.s3.putObject(params, (err, data) => {
        if (err) {
          reject(err);
          rLogger.error('Error in creating folder --> ' + err.toString());
        } else {
          resolve(data);
          rLogger.log('Folder created successfully --> ' + JSON.stringify(params));
        }
      });
    });
  }

  /**
   * @method createBucket
   * @description It is used to create the bucket in s3
   * @param params
   * @returns {Promise}
   */
  createBucket(params) {
    rLogger.log('Create bucket with params --> ' + JSON.stringify(params));
    params.CreateBucketConfiguration = {LocationConstraint: "us-east-2"}; // us-east-2	== us east ohio
    return new Promise((resolve, reject)=> {
      this.s3.createBucket(params, (err, data) => {
        if (err) {
          reject(err);
          rLogger.error('Error in creating bucket --> ' + err.toString());
        } else {
          resolve(data);
          rLogger.log('Bucket created successfully --> ' + JSON.stringify(params));
        }
      });
    });
  }

  /**
   * @method deleteBucket
   * @description It is used to delete bucket from s3
   * @param params
   * @returns {Promise}
   */
  deleteBucket(params) {
    rLogger.log('Delete bucket with params --> ' + JSON.stringify(params));
    return new Promise((resolve, reject)=> {
      this.s3.deleteBucket(params, (err, data) => {
        if (err) {
          reject(err);
          rLogger.error('Error in deleting bucket --> ' + err.toString());
        } else {
          resolve(data);
          rLogger.log('Bucket deleted successfully --> ' + JSON.stringify(params));
        }
      });
    });
  }

  /**
   * @method getBuckets
   * @description It is used to get list of buckets from s3
   * @returns {Promise}
   */
  getBuckets() {
    rLogger.log('Getting bucket with params --> ' + JSON.stringify(params));
    return new Promise((resolve, reject)=> {
      this.s3.listBuckets({}, (err, data) => {
        if (err) {
          reject(err);
          rLogger.error('Error in getting buckets --> ' + err.toString());
        } else {
          resolve(data);
          rLogger.log('Got buckets --> ' + JSON.stringify(data));
        }
      });
    });
  }

  /**
   * @method uploadFile
   * @description function to upload the file
   * @param file
   * @param folder
   * @param bucketName
   * @returns {Promise}
   * @tickets PO-44, PO-58,PO-312, PO-401,PO-534
   */
  uploadFile({file, folder, bucketName, useOriginalFileName}) {
    let folderName;
    bucketName = bucketName || this.bucket;
    let extension = file.originalname.split('.').pop();
    let fileName = useOriginalFileName ? `${useOriginalFileName}.${extension}` : file.originalname;
    rLogger.log('Uploading file  --> ' + JSON.stringify(file));
    return new Promise((resolve, reject)=> {
      fs.readFile(file.path, (err, data) => {
        if (err) {
          rLogger.error('Error in reading the file');
          return reject(err);
        }
        let base64data = new Buffer(data, 'binary');
        if (!_.isUndefined(folder)) {
          if (folder) {
            folderName = `${folder}/${fileName}`
          } else {
            folderName = `${fileName}`
          }
        }
        let isImage = file.mimetype.split('/')[0] == 'image';
        if (isImage) {
          imagemagick.identify(file.path, ((err, uploadImageProperties) => {
            if(_.isUndefined(uploadImageProperties)){
              reject(err);
            } else if (validator.isImage(uploadImageProperties.format)) {
              let imageMeta = {'width': uploadImageProperties.width.toString(),'height':uploadImageProperties.height.toString()};
              this.s3.upload({
                Bucket: bucketName,
                Key: folderName,
                Body: base64data,
                ACL: 'public-read',
                ContentType:file.mimetype,
                Metadata: imageMeta
              }, (err,data)=> {
                if (err) {
                  rLogger.error('Error in uploading the file to s3 --> ' + fileName);
                  reject(err);
                } else {
                  rLogger.log('File uploaded successfully to s3 --> ' + fileName);
                  data.height = imageMeta.height;
                  data.width = imageMeta.width;
                  data.Location = utils.replaceS3toCloudFront(data.Location);
                  console.log(data.Location);
                  resolve(data);
                }
              });
            }
          }));
        } else {
          this.s3.upload({
            Bucket: bucketName,
            Key: folderName,
            Body: base64data,
            ACL: 'public-read'
          },(err,data)=> {
            if(err){
              rLogger.error('Error in uploading the file to s3 --> '+fileName);
              reject(err);
            } else {
              rLogger.log('File uploaded successfully to s3 --> '+fileName);
              console.log(data);
              data.Location = utils.replaceS3toCloudFront(data.Location);
              console.log(data.Location);
              resolve(data);
            }
          });
        }
      });
    });
  }

  /**
   * @method checkFileExist
   * @description function to check filename exist or not
   * @param bucketName
   * @param fileName
   * @returns {Promise}
   * @tickets PO-331,PO-332
   */
  checkFileExist(bucketName, fileName){
    return new Promise((resolve, reject)=> {
      this.s3.headObject({
        Bucket: bucketName,
        Key: fileName
      },(err, data)=> {
        if (err) {
         reject(err);
        }
        else{
           resolve(data);
         }
      });
    });
  }

  /**
   * @method getFilesByFolder
   * @description function to get files by folder
   * @param params
   * @returns {Promise}
   * @tickets PO-58
   */
  getFilesByFolder(params) {
    rLogger.log('Get files by folder --> ' + JSON.stringify(params));
    return new Promise((resolve, reject)=> {
      this.s3.listObjects(params, (err, data) => {
        if (err) {
          reject(err);
          rLogger.error('Getting error in getting files by folder --> ' + err.toString());
        } else {
          data.Contents  = _.filter(data.Contents,(file)=>file.Size !== 0);
          resolve(data);
          rLogger.log('Got the files from the folder --> ' + JSON.stringify(data));
        }
      });
    });
  }
}


module.exports = S3;
