import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Http} from '@angular/http';
import {ProductService} from '../shared/product.service';
import {Product} from '../shared/product.model';
import * as _ from 'lodash';

@Component({
  selector: 'add-edit-product',
  templateUrl: './add-edit-product.component.html',
  styleUrls:['./add-edit-product.component.scss']
})
export class AddEditProductComponent implements OnInit {
  isEditMode:any;
  ProductObj : Product = new Product
  (  null, null,'',[]);
  noFileSelected:boolean=false;
  noMoreFileSelected:boolean=false;
  editObjData:any;
  filesToUpload: Array<File> = [];
  numberRegex = "^[0-9]*$";
  imageUploaded :boolean=true;
  moreImagesUploaded:boolean =true;
  moreFilesToUpload:Array<File>= [];
  moreUploadedFiles:any = [];



  constructor(private router: Router, private http: Http, private route: ActivatedRoute,
              private productService : ProductService ) {
  }

  ngOnInit() {
    if(this.route.snapshot.data['product']) {
      this.editObjData = this.route.snapshot.data['product'];
      this.ProductObj = this.editObjData;
      this.moreUploadedFiles = this.ProductObj.MoreProductImages;
      this.isEditMode = true;
    }
  }

  checkProductImageSelectedOrNot(){
    if(!this.filesToUpload.length){
      this.noFileSelected = true;
      return false;
    }else{
      this.noFileSelected = false;
      return true;
    }

  }

  getProductImage(fileInput) {
    this.noFileSelected = false;
    this.filesToUpload = <Array<File>>fileInput.target.files;
    this.ProductObj.ProductImage = fileInput.target.files[0]['name'];
    this.productService.imageUpload(this.filesToUpload).subscribe((res)=>{
      if(res.status === 'success'){
        this.imageUploaded = true;
        this.ProductObj.ProductImage = res.filePath;
      }else{
        this.imageUploaded = false;
        this.noFileSelected = false;
      }
    },(e)=>{
    })
  }

  checkMoreProductImagesSelectedOrNot(){
    if(!this.moreFilesToUpload.length){
      this.noMoreFileSelected = true;
      return false;
    }else{
      this.noMoreFileSelected= false;
      return true;
    }

  }

  getProductsMoreImage(files){
    this.noMoreFileSelected = false;
    this.ProductObj.MoreProductImages = [];
    this.moreFilesToUpload = <Array<File>>files.target.files;
    this.productService.moreImagesUpload(this.moreFilesToUpload).subscribe((res)=>{
      if(res.status === 'success'){
        this.noMoreFileSelected = false;
        this.moreImagesUploaded = true;
        this.moreUploadedFiles = res.files;
        _.each(this.moreUploadedFiles,(file)=>{
          this.ProductObj.MoreProductImages.push({path:file.path});
        });
      }else{
        this.moreImagesUploaded = false;
        this.noMoreFileSelected = true;
      }
    },(e)=>{
    })

  }

  addProduct(form) {
    if (this.checkProductImageSelectedOrNot() && this.checkMoreProductImagesSelectedOrNot() && this.imageUploaded && form.valid)  {
      this.productService.addProduct(this.ProductObj).subscribe((res)=>{
        this.router.navigate(['/product/list']);
        },(e)=>{

      })
    }
  }

  updateProduct(form){
    if(this.ProductObj.ProductImage && this.ProductObj.MoreProductImages && this.imageUploaded && this.moreImagesUploaded && form.valid){
      this.productService.updateProduct( this.ProductObj).subscribe((res) => {
        this.router.navigate(['/product/list']);
      }, (e)=>{
        })
    }
  }

}
