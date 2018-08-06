import { Injectable } from '@angular/core';
import { Http,  Headers, RequestOptions } from '@angular/http';
import {map} from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {apiUrl} from '../../../shared/constant';

@Injectable()
export class ProductService {
  http: any;
  authToken:any;
  options;

  static get parameters() {
    return [Http];
  }

  constructor(private Http:HttpClient) {
    this.http = Http;
  }

    // Function to create headers, add token, to be used in HTTP requests
    createAuthenticationHeaders() {
        this.loadToken();
        // Headers configuration options
        this.options = new RequestOptions({
            headers: new Headers({
                'Content-Type': 'application/json',
                'authorization': this.authToken
            })
        });
    }

    // Function to get token from client local storage
    loadToken() {
        this.authToken = localStorage.getItem('token');
    }

    getAllProducts() {
    this.createAuthenticationHeaders(); // Create headers before sending to API
         let searchUrl = `${apiUrl}/getProducts`;
    return this.http.get(searchUrl, this.options).pipe(map((response: any) => response.json()));
  }

  getProductById(id) {
      this.createAuthenticationHeaders(); // Create headers before sending to API
      let searchUrl = `${apiUrl}/singleProduct/${id}`;
    return this.http.get(searchUrl, this.options).pipe(map((response: any) => response.json()));
  }

  deleteProductById(id) {
      this.createAuthenticationHeaders(); // Create headers before sending to API
      let searchUrl = `${apiUrl}/singleProduct?productId=${id}`;
    return this.http.delete(searchUrl, this.options).pipe(map((response: any) => response.json()));
  }

  imageUpload(file){
    let searchUrl = `${apiUrl}/imageUpload`;
    let headers = new Headers();
    headers.append('Content-Type', 'multipart/form-data; boundary=------WebKitFormBoundary'+ Math.random());
    headers.append('Accept','application/json');
    let options = new RequestOptions({
      headers: headers
    });
    let formData = new FormData();
    formData.append('file', file[0]);
    return this.http.post(searchUrl, formData).pipe(map((response: any) => response.json()));
  }


  moreImagesUpload(files){
    let searchUrl = `${apiUrl}/moreImagesUpload`;
    let headers = new Headers();
    headers.append('Content-Type', 'multipart/form-data; boundary=------WebKitFormBoundary'+ Math.random());
    headers.append('Accept','application/json');
    let options = new RequestOptions({
      headers: headers
    });
    let formData = new FormData();
    for(let i =0; i < files.length; i++){
      formData.append("uploads[]", files[i], files[i]['name']);
    }
    return this.http.post(searchUrl, formData).pipe(map((response: any) => response.json()));
  }


  addProduct(productData) {
      this.createAuthenticationHeaders(); // Create headers before sending to API
      let searchUrl = `${apiUrl}/addProduct`;
    return this.http.post(searchUrl, productData , this.options).pipe(map((response: any) => response.json()));
  }

  updateProduct(productData) {
      this.createAuthenticationHeaders(); // Create headers before sending to API
      let searchUrl = `${apiUrl}/updateProduct`;
    return this.http.put(searchUrl, productData, this.options).pipe(map((response: any) => response.json()));
  }
}
