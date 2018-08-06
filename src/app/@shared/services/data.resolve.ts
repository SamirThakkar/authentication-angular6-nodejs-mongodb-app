import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import {Http} from '@angular/http';
import {map} from 'rxjs/operators';

@Injectable()
export class DataResolve implements Resolve<any> {

  constructor(private http: Http) { }

  resolve(route: ActivatedRouteSnapshot) {
    let apiPath = route.data['apiPath'];
    if(apiPath.indexOf(':id') > -1){
      apiPath = apiPath.replace(':id', route.params['id']);
    }
    return this.http.get(apiPath).pipe(map((response: any) => response.json()));
  }
}
