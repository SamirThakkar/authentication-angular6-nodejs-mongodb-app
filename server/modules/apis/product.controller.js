const Product = require('../../models/productModel');
const fs = require('fs');
const q = require('q');
const async = require('async');

class ProductController{
  constructor(app){
    app.get('/getProducts', this.getAllProducts);
    app.post('/addProduct', this.addProduct);
    app.get('/singleProduct/:id', this.getProduct);
    app.put('/updateProduct', this.updateProduct);
    app.delete('/singleProduct', this.deleteProduct);
    app.post('/imageUpload', this.uploadSingleImage);
    app.post('/moreImagesUpload', this.uploadMultipleImage);
  }

  getAllProducts(req,res){
    Product.find({})
      .then((products) => {
        res.send(products);
      })
      .catch((e) => {
        res.send({
          error: e,
          success: false,
          message: "Error while getting products."
        });
      });
  }

  addProduct(req,res) {
    let product = new Product({
      ProductName: req.body.ProductName,
      ProductPrice: req.body.ProductPrice,
      ProductImage: req.body.ProductImage,
      MoreProductImages: req.body.MoreProductImages
    });
    product.save()
      .then((createdProduct) => {
        res.send({
          success: true,
          message: "Product successfully added",
          product: createdProduct
        });
      })
      .catch((e) => {
        res.send({
          error: e,
          success: false,
          message: "Error while adding product."
        });
      });
  }

    getProduct(req,res){
      let id = req.params.id;
      Product.find({_id: id})
        .then((product) => {
          res.send(product[0]);
        })
        .catch((e) => {
          res.send({
            error: e,
            success: false,
            message: "Error while getting product."
          });
        });
    }

  updateProduct(req,res) {
    const productData = req.body;
    Product.findById(productData._id)
      .then((product) => {
        product.ProductName = productData.ProductName;
        product.ProductPrice = productData.ProductPrice;
        product.ProductImage = productData.ProductImage;
        product.MoreProductImages = req.body.MoreProductImages;
        return product;
      })
      .then((updatedProductObj) => {
        return updatedProductObj.save();
      })
      .then((updatedItem) => {
        res.send({
          success: true,
          product: updatedItem,
          message: "Product successfully updated"
        });
      })
      .catch((e) => {
        res.send({
          error: e,
          success: false,
          message: "Error while updating product."
        });
      });
  }

  deleteProduct(req,res){
    let defer = q.defer();
    let productId = req.query.productId;

    Product.findById(productId)
      .then((foundItem) => {
        if (!foundItem) {
          return res.send({
            success: false,
            message: "Product not found.",
            id: productId
          });
        } else {
          return foundItem;
        }
      }).then((foundItem) => {
      _deleteFile(foundItem);
      _deleteMultipleFiles(foundItem);
    })
      .then((item) => {
        return Product.remove({_id: productId})
      })
      .then(() => {
        res.send({
          success: true,
          message: "Product successfully deleted",
          id: productId
        })
      })
      .catch(() => {
        res.send({
          success: false,
          message: "The request was not completed. Product with id " + productId + " is not successfully deleted"
        });
      });

    let _deleteFile = (product) => {
      fs.unlink(`${global.ROOT_PATH}/${product.ProductImage}`, (error) => {
        if (error) {
          defer.reject(error);
        } else {
          defer.resolve();
        }
      });
      defer.promise;
    };
    let _deleteMultipleFiles = (product) => {
      let i = 0;
      async.whilst(
        () => {
          if (i === product.MoreProductImages.length) {
            return false;
          }
          return true;
        },
        (callback) => {
          fs.unlink(`${global.ROOT_PATH}/${product.MoreProductImages[i].path}`, (error) => {
              i++;
              callback()
            },
            (e) => {
              if (e) {
                defer.reject(e);
              } else {
                defer.resolve();
              }
            });
        }
      );
      defer.promise;
    };
  }



  uploadSingleImage(req,res){
    global.upload(req, res, (err) => {
      if (err) {
        return res.send({status: 'error', message: "Something went wrong!", error: err});
      }
      return res.send({
        status: 'success',
        message: "File uploaded successfully!.",
        filePath: req.files[0].path,
      });
    });
  }

  uploadMultipleImage(req,res){
    global.moreImagesUpload(req, res, (err) => {
      if (err) {
        return res.send({status: 'error', message: "Something went wrong!", error: err});
      }
      return res.send({status: 'success', message: "File uploaded successfully!.", files: req.files});
    });
  }

}

module.exports = ProductController;
