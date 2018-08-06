import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Http} from '@angular/http';
import {ProductService} from '../shared/product.service';

@Component({
  selector: 'list-product',
  templateUrl: './list-product.component.html',
  styleUrls: ['./list-product.component.scss']
})
export class ListProductComponent implements OnInit {
  productList:any;
  isProducts:any;
  constructor(private router: Router, private http: Http, private route: ActivatedRoute, private productService: ProductService) {
  }

  ngOnInit() {
    this.productList = this.route.snapshot.data['products'];
    this.checkProductListLength();
    }

  delete(id){
    this.productService.deleteProductById(id).subscribe((res)=>{
          this.getProductList();
    },(e)=>{

    })
  }

  checkProductListLength(){
    if(this.productList.length){
      this.isProducts = true
    }else{
      this.isProducts = false;
    }
  }

  getProductList(){
    this.productService.getAllProducts().subscribe((res)=>{
      this.productList = res;
      this.checkProductListLength();
    },(e)=>{

    })
  }




}
