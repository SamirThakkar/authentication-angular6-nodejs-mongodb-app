import {  NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import {AddEditProductComponent} from './add-edit-product/add-edit-product.component';
import {ListProductComponent} from './list-product/list-product.component';
import {ProductRoutingModule} from './product-routing.module';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {ProductService} from './shared/product.service';
import {DataResolve} from '../../@shared/services/data.resolve';

@NgModule({
  imports: [
    HttpModule,
    ProductRoutingModule,
    FormsModule,
    CommonModule
  ],
  declarations: [
    AddEditProductComponent,
    ListProductComponent
  ],
  providers:[ProductService,DataResolve]
})
export class ProductModule {}
